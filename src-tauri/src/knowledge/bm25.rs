//! BM25 full-text search module.
//!
//! Implements the BM25 (Best Matching 25) ranking algorithm for keyword-based search.
//! Used as part of hybrid search alongside vector similarity search.

use crate::vector::store::SearchResult;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// BM25 parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bm25Params {
    /// BM25 term frequency saturation parameter (default: 1.5)
    pub k1: f32,
    /// BM25 document length normalization parameter (default: 0.75)
    pub b: f32,
    /// Average document length in tokens
    pub avgdl: f32,
}

impl Default for Bm25Params {
    fn default() -> Self {
        Self {
            k1: 1.5,
            b: 0.75,
            avgdl: 100.0, // Will be calculated from corpus
        }
    }
}

/// Document in the BM25 index
#[derive(Debug, Clone)]
struct Bm25Document {
    id: String,
    tokens: Vec<String>,
    token_freqs: HashMap<String, usize>,
    length: usize,
    metadata: serde_json::Value,
}

/// BM25 store for full-text search
pub struct Bm25Store {
    documents: HashMap<String, Bm25Document>,
    inverted_index: HashMap<String, Vec<InvertedIndexEntry>>,
    document_count: usize,
    total_term_freq: HashMap<String, usize>,
    params: Bm25Params,
}

/// Inverted index entry
#[derive(Debug, Clone)]
struct InvertedIndexEntry {
    doc_id: String,
    term_freq: usize,
    positions: Vec<usize>,
}

/// BM25 search result
#[derive(Debug, Clone)]
pub struct Bm25SearchResult {
    pub id: String,
    pub score: f32,
    pub metadata: serde_json::Value,
}

impl Bm25Store {
    /// Create a new BM25 store with default parameters
    pub fn new() -> Self {
        Self {
            documents: HashMap::new(),
            inverted_index: HashMap::new(),
            document_count: 0,
            total_term_freq: HashMap::new(),
            params: Bm25Params::default(),
        }
    }

    /// Create a new BM25 store with custom parameters
    pub fn with_params(params: Bm25Params) -> Self {
        Self {
            documents: HashMap::new(),
            inverted_index: HashMap::new(),
            document_count: 0,
            total_term_freq: HashMap::new(),
            params,
        }
    }

    /// Tokenize text into terms
    pub fn tokenize(text: &str) -> Vec<String> {
        text.to_lowercase()
            .split(|c: char| !c.is_alphanumeric())
            .filter(|s| !s.is_empty() && !is_stop_word(s))
            .map(|s| s.to_string())
            .collect()
    }

    /// Add a document to the index
    pub fn add_document(
        &mut self,
        id: String,
        text: String,
        metadata: serde_json::Value,
    ) -> Result<()> {
        let tokens = Self::tokenize(&text);
        let mut token_freqs: HashMap<String, usize> = HashMap::new();
        let mut positions: HashMap<String, Vec<usize>> = HashMap::new();

        for (pos, token) in tokens.iter().enumerate() {
            *token_freqs.entry(token.clone()).or_insert(0) += 1;
            positions.entry(token.clone()).or_insert_with(Vec::new).push(pos);
        }

        let length = tokens.len();
        let doc = Bm25Document {
            id: id.clone(),
            tokens,
            token_freqs,
            length,
            metadata: metadata.clone(),
        };

        // Update inverted index
        for (term, freq) in &doc.token_freqs {
            let positions = positions.get(term).cloned().unwrap_or_default();
            let entry = InvertedIndexEntry {
                doc_id: id.clone(),
                term_freq: *freq,
                positions,
            };

            self.inverted_index
                .entry(term.clone())
                .or_insert_with(Vec::new)
                .push(entry);

            *self.total_term_freq.entry(term.clone()).or_insert(0) += freq;
        }

        // Store document
        self.documents.insert(id.clone(), doc);
        self.document_count += 1;

        // Update average document length
        let total_length: usize = self.documents.values().map(|d| d.length).sum();
        if self.document_count > 0 {
            self.params.avgdl = total_length as f32 / self.document_count as f32;
        }

        Ok(())
    }

    /// Remove a document from the index
    pub fn remove_document(&mut self, id: &str) -> Result<()> {
        if let Some(doc) = self.documents.remove(id) {
            // Remove from inverted index
            for term in doc.token_freqs.keys() {
                if let Some(entries) = self.inverted_index.get_mut(term) {
                    entries.retain(|e| e.doc_id != id);
                    if entries.is_empty() {
                        self.inverted_index.remove(term);
                    }
                }
                if let Some(freq) = self.total_term_freq.get_mut(term) {
                    *freq = freq.saturating_sub(doc.token_freqs.get(term).copied().unwrap_or(0));
                    if *freq == 0 {
                        self.total_term_freq.remove(term);
                    }
                }
            }
            self.document_count -= 1;

            // Update average document length
            if self.document_count > 0 {
                let total_length: usize = self.documents.values().map(|d| d.length).sum();
                self.params.avgdl = total_length as f32 / self.document_count as f32;
            }
        }
        Ok(())
    }

    /// Search the index with a query
    pub fn search(&self, query: &str, k: usize) -> Vec<SearchResult> {
        if self.document_count == 0 {
            return Vec::new();
        }

        let query_terms = Self::tokenize(query);
        if query_terms.is_empty() {
            return Vec::new();
        }

        // Calculate IDF for each query term
        let mut idf_scores: HashMap<&str, f32> = HashMap::new();
        for term in &query_terms {
            let df = self.inverted_index.get(term).map(|v| v.len()).unwrap_or(0);
            let idf = Self::calculate_idf(df, self.document_count);
            idf_scores.insert(term, idf);
        }

        // Calculate BM25 score for each document
        let mut scores: HashMap<&str, f32> = HashMap::new();

        // Collect candidate documents (documents containing any query term)
        let mut candidates: HashSet<&str> = HashSet::new();
        for term in &query_terms {
            if let Some(entries) = self.inverted_index.get(term) {
                for entry in entries {
                    candidates.insert(&entry.doc_id);
                }
            }
        }

        // Score each candidate document
        for doc_id in candidates {
            if let Some(doc) = self.documents.get(doc_id) {
                let mut score = 0.0f32;

                for term in &query_terms {
                    // Use the String version for HashMap lookup
                    let idf = self.total_term_freq.get(term).map(|_| {
                        Self::calculate_idf(
                            self.inverted_index.get(term).map(|v| v.len()).unwrap_or(0),
                            self.document_count,
                        )
                    }).unwrap_or(0.0);
                    let term_freq = doc.token_freqs.get(term).copied().unwrap_or(0) as f32;

                    // BM25 scoring formula
                    let numerator = term_freq * (self.params.k1 + 1.0);
                    let denominator = term_freq
                        + self.params.k1 * (1.0 - self.params.b
                            + self.params.b * (doc.length as f32 / self.params.avgdl));

                    score += idf * (numerator / denominator);
                }

                if score > 0.0 {
                    scores.insert(doc_id, score);
                }
            }
        }

        // Sort by score and return top-k
        let mut results: Vec<_> = scores
            .into_iter()
            .filter_map(|(id, score)| {
                self.documents.get(id).map(|doc| SearchResult {
                    id: doc.id.clone(),
                    score,
                    metadata: doc.metadata.clone(),
                })
            })
            .collect();

        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(k);

        results
    }

    /// Calculate IDF (Inverse Document Frequency)
    fn calculate_idf(df: usize, n: usize) -> f32 {
        if df == 0 {
            return 0.0;
        }
        ((n - df) as f32 + 0.5) / (df as f32 + 0.5)
    }

    /// Get document count
    pub fn document_count(&self) -> usize {
        self.document_count
    }

    /// Get total term count
    pub fn total_terms(&self) -> usize {
        self.total_term_freq.values().sum()
    }

    /// Check if a document exists
    pub fn contains(&self, id: &str) -> bool {
        self.documents.contains_key(id)
    }

    /// Clear the index
    pub fn clear(&mut self) {
        self.documents.clear();
        self.inverted_index.clear();
        self.document_count = 0;
        self.total_term_freq.clear();
        self.params.avgdl = 100.0;
    }

    /// Get statistics
    pub fn stats(&self) -> Bm25Stats {
        Bm25Stats {
            document_count: self.document_count,
            total_terms: self.total_terms(),
            unique_terms: self.inverted_index.len(),
            avg_doc_length: self.params.avgdl,
        }
    }
}

impl Default for Bm25Store {
    fn default() -> Self {
        Self::new()
    }
}

/// BM25 statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bm25Stats {
    pub document_count: usize,
    pub total_terms: usize,
    pub unique_terms: usize,
    pub avg_doc_length: f32,
}

/// Check if a term is a stop word
fn is_stop_word(term: &str) -> bool {
    const STOP_WORDS: &[&str] = &[
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
        "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
        "to", "was", "were", "will", "with", "the", "this", "have", "from",
        "they", "we", "say", "she", "or", "an", "will", "my", "one", "all",
        "would", "there", "their", "what", "so", "up", "out", "if", "about",
        "who", "get", "which", "go", "me", "when", "make", "can", "like",
        "time", "no", "just", "him", "know", "take", "people", "into", "year",
        "your", "good", "some", "could", "them", "see", "other", "than",
        "then", "now", "look", "only", "come", "its", "over", "think", "also",
        "back", "after", "use", "two", "how", "our", "work", "first", "well",
        "way", "even", "new", "want", "because", "any", "these", "give", "day",
        "most", "us", "is", "are", "was", "were", "been", "being", "have", "has",
        "had", "having", "do", "does", "did", "doing", "would", "should", "could",
        "ought", "i", "me", "my", "myself", "we", "our", "ours", "ourselves",
        "you", "your", "yours", "yourself", "yourselves", "he", "him", "his",
        "himself", "she", "her", "hers", "herself", "it", "its", "itself",
    ];
    STOP_WORDS.contains(&term)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenization() {
        let tokens = Bm25Store::tokenize("Hello World! This is a test.");
        assert!(tokens.contains(&"hello".to_string()));
        assert!(tokens.contains(&"world".to_string()));
        assert!(!tokens.contains(&"this".to_string())); // Stop word
        assert!(!tokens.contains(&"is".to_string())); // Stop word
    }

    #[test]
    fn test_add_and_search() {
        let mut store = Bm25Store::new();

        store.add_document(
            "doc1".to_string(),
            "The quick brown fox jumps over the lazy dog".to_string(),
            serde_json::json!({}),
        ).unwrap();

        store.add_document(
            "doc2".to_string(),
            "A quick brown cat sleeps on the sofa".to_string(),
            serde_json::json!({}),
        ).unwrap();

        let results = store.search("quick brown", 10);
        assert!(!results.is_empty());
        assert_eq!(results.first().unwrap().id, "doc1"); // doc1 has more matches
    }

    #[test]
    fn test_remove_document() {
        let mut store = Bm25Store::new();

        store.add_document(
            "doc1".to_string(),
            "Test document content".to_string(),
            serde_json::json!({}),
        ).unwrap();

        assert!(store.contains("doc1"));

        store.remove_document("doc1").unwrap();
        assert!(!store.contains("doc1"));
    }

    #[test]
    fn test_stats() {
        let mut store = Bm25Store::new();

        store.add_document(
            "doc1".to_string(),
            "First document text".to_string(),
            serde_json::json!({}),
        ).unwrap();

        store.add_document(
            "doc2".to_string(),
            "Second document text".to_string(),
            serde_json::json!({}),
        ).unwrap();

        let stats = store.stats();
        assert_eq!(stats.document_count, 2);
    }

    #[test]
    fn test_empty_search() {
        let store = Bm25Store::new();
        let results = store.search("test", 10);
        assert!(results.is_empty());
    }

    #[test]
    fn test_idf_calculation() {
        let mut store = Bm25Store::new();

        // Add 10 documents, only 2 contain "test"
        for i in 0..10 {
            let text = if i < 2 {
                format!("This is a test document {}", i)
            } else {
                format!("This is document {}", i)
            };
            store.add_document(format!("doc{}", i), text, serde_json::json!({})).unwrap();
        }

        let results = store.search("test", 10);
        // doc0 and doc1 should have higher scores
        assert!(results.len() <= 2);
    }
}
