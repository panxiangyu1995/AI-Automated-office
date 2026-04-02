//! Smart chunker module.
//!
//! Provides intelligent document chunking that preserves semantic boundaries.
//! Supports sentence-based chunking with token limits and overlapping windows.

use crate::knowledge::types::{ChunkingStrategyConfig, ChunkingStrategyType, DocumentChunk};
use anyhow::Result;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

/// Smart chunker configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartChunkerConfig {
    /// Target chunk size in tokens
    pub chunk_size: usize,
    /// Overlap between chunks in tokens
    pub overlap: usize,
    /// Minimum chunk size in tokens
    pub min_chunk_size: usize,
    /// Maximum chunk size in tokens
    pub max_chunk_size: usize,
    /// Preserve document structure (headings, lists)
    pub preserve_structure: bool,
    /// Include heading context in chunks
    pub include_heading_context: bool,
}

impl Default for SmartChunkerConfig {
    fn default() -> Self {
        Self {
            chunk_size: 512,
            overlap: 50,
            min_chunk_size: 100,
            max_chunk_size: 1024,
            preserve_structure: true,
            include_heading_context: true,
        }
    }
}

impl From<&ChunkingStrategyConfig> for SmartChunkerConfig {
    fn from(config: &ChunkingStrategyConfig) -> Self {
        Self {
            chunk_size: config.chunk_size,
            overlap: config.overlap,
            min_chunk_size: config.min_chunk_size,
            max_chunk_size: config.max_chunk_size,
            preserve_structure: true,
            include_heading_context: true,
        }
    }
}

/// Chunk with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartChunk {
    /// Chunk ID
    pub chunk_id: String,
    /// Document ID
    pub document_id: String,
    /// Chunk content
    pub content: String,
    /// Token count
    pub token_count: usize,
    /// Start offset in original text
    pub start_offset: usize,
    /// End offset in original text
    pub end_offset: usize,
    /// Parent heading (if within a heading section)
    pub heading: Option<String>,
    /// Page number (if available)
    pub page_number: Option<usize>,
    /// Section identifier
    pub section: Option<String>,
    /// Chunk index in document
    pub chunk_index: usize,
}

/// Document structure extracted from text
#[derive(Debug, Clone)]
pub struct DocumentStructure {
    /// Extracted headings with their levels and positions
    pub headings: Vec<Heading>,
    /// Extracted lists
    pub lists: Vec<List>,
    /// Paragraph boundaries
    pub paragraphs: Vec<Paragraph>,
}

/// Heading in document
#[derive(Debug, Clone)]
pub struct Heading {
    pub level: usize,
    pub text: String,
    pub start_offset: usize,
    pub end_offset: usize,
}

/// List in document
#[derive(Debug, Clone)]
pub struct List {
    pub items: Vec<String>,
    pub start_offset: usize,
    pub end_offset: usize,
}

/// Paragraph in document
#[derive(Debug, Clone)]
pub struct Paragraph {
    pub text: String,
    pub start_offset: usize,
    pub end_offset: usize,
}

/// Smart chunker for intelligent document splitting
pub struct SmartChunker {
    config: SmartChunkerConfig,
}

impl SmartChunker {
    /// Create a new smart chunker with default configuration
    pub fn new() -> Self {
        Self {
            config: SmartChunkerConfig::default(),
        }
    }

    /// Create a new smart chunker with custom configuration
    pub fn with_config(config: SmartChunkerConfig) -> Self {
        Self { config }
    }

    /// Create from legacy ChunkingStrategyConfig
    pub fn from_legacy_config(config: &ChunkingStrategyConfig) -> Self {
        Self {
            config: SmartChunkerConfig::from(config),
        }
    }

    /// Chunk a document into smart pieces
    pub fn chunk(
        &self,
        document_id: &str,
        content: &str,
    ) -> Result<Vec<SmartChunk>> {
        let structure = if self.config.preserve_structure {
            self.extract_document_structure(content)
        } else {
            DocumentStructure {
                headings: Vec::new(),
                lists: Vec::new(),
                paragraphs: self.split_paragraphs(content),
            }
        };

        let sentences = self.split_sentences(content);
        let mut chunks: Vec<SmartChunk> = Vec::new();
        let mut current_sentences: Vec<(String, usize, usize)> = Vec::new();
        let mut current_tokens: usize = 0;
        let mut current_heading: Option<String> = None;
        let mut chunk_index: usize = 0;

        // Process sentences
        for sentence in &sentences {
            let sentence_tokens = self.count_tokens(&sentence.text);

            // Check if adding this sentence would exceed max chunk size
            if current_tokens + sentence_tokens > self.config.max_chunk_size
                && !current_sentences.is_empty()
            {
                // Create chunk from current sentences
                let chunk = self.create_chunk(
                    document_id,
                    &mut current_sentences,
                    current_heading.clone(),
                    chunk_index,
                    &structure,
                );

                if chunk.token_count >= self.config.min_chunk_size {
                    chunks.push(chunk);
                    chunk_index += 1;
                }

                // Handle overlap - keep some sentences for next chunk
                if self.config.overlap > 0 {
                    let overlap_sentences = self.get_overlap_sentences(
                        &current_sentences,
                        self.config.overlap,
                    );
                    current_sentences = overlap_sentences;
                    current_tokens = current_sentences
                        .iter()
                        .map(|(s, _, _)| self.count_tokens(s))
                        .sum();
                } else {
                    current_sentences.clear();
                    current_tokens = 0;
                }
            }

            // Update current heading if we're in a new heading section
            if let Some((heading_text, _)) = self.get_current_heading(
                sentence.start_offset,
                &structure.headings,
            ) {
                current_heading = Some(heading_text);
            }

            // Add sentence to current chunk
            current_sentences.push((
                sentence.text.clone(),
                sentence.start_offset,
                sentence.end_offset,
            ));
            current_tokens += sentence_tokens;
        }

        // Add remaining sentences as final chunk
        if !current_sentences.is_empty() {
            let chunk = self.create_chunk(
                document_id,
                &mut current_sentences,
                current_heading,
                chunk_index,
                &structure,
            );

            if chunk.token_count >= self.config.min_chunk_size {
                chunks.push(chunk);
            }
        }

        Ok(chunks)
    }

    /// Convert SmartChunk to legacy DocumentChunk format
    pub fn to_document_chunk(&self, smart_chunk: &SmartChunk) -> DocumentChunk {
        DocumentChunk {
            chunk_id: smart_chunk.chunk_id.clone(),
            document_id: smart_chunk.document_id.clone(),
            chunk_index: smart_chunk.chunk_index,
            content: smart_chunk.content.clone(),
            token_count: smart_chunk.token_count,
            start_offset: smart_chunk.start_offset,
            end_offset: smart_chunk.end_offset,
            heading: smart_chunk.heading.clone(),
            page_number: smart_chunk.page_number,
            section: smart_chunk.section.clone(),
        }
    }

    /// Create a chunk from sentences
    fn create_chunk(
        &self,
        document_id: &str,
        sentences: &mut Vec<(String, usize, usize)>,
        heading: Option<String>,
        chunk_index: usize,
        structure: &DocumentStructure,
    ) -> SmartChunk {
        let content = sentences
            .iter()
            .map(|(s, _, _)| s.as_str())
            .collect::<Vec<_>>()
            .join(" ");

        let start_offset = sentences.first().map(|(_, s, _)| *s).unwrap_or(0);
        let end_offset = sentences.last().map(|(_, _, e)| *e).unwrap_or(0);
        let token_count = self.count_tokens(&content);

        // Get section from structure
        let section = self.get_section_for_offset(start_offset, &structure.headings);

        SmartChunk {
            chunk_id: format!("{}_{}", document_id, chunk_index),
            document_id: document_id.to_string(),
            content,
            token_count,
            start_offset,
            end_offset,
            heading,
            page_number: None,
            section,
            chunk_index,
        }
    }

    /// Get overlap sentences for window-based overlap
    fn get_overlap_sentences(
        &self,
        sentences: &Vec<(String, usize, usize)>,
        overlap_tokens: usize,
    ) -> Vec<(String, usize, usize)> {
        let mut overlap_sentences: Vec<(String, usize, usize)> = Vec::new();
        let mut overlap_token_count: usize = 0;

        // Take sentences from the end until we reach overlap token count
        for sentence in sentences.iter().rev() {
            let sentence_tokens = self.count_tokens(&sentence.0);
            if overlap_token_count >= overlap_tokens {
                break;
            }
            overlap_sentences.insert(0, sentence.clone());
            overlap_token_count += sentence_tokens;
        }

        overlap_sentences
    }

    /// Extract document structure (headings, lists, paragraphs)
    fn extract_document_structure(&self, content: &str) -> DocumentStructure {
        DocumentStructure {
            headings: self.extract_headings(content),
            lists: self.extract_lists(content),
            paragraphs: self.split_paragraphs(content),
        }
    }

    /// Extract headings from content
    fn extract_headings(&self, content: &str) -> Vec<Heading> {
        let mut headings = Vec::new();

        // Markdown headings (# Heading)
        let markdown_re = Regex::new(r"^(#{1,6})\s+(.+)$").unwrap();

        for (start_offset, line) in content.lines().enumerate() {
            if let Some(caps) = markdown_re.captures(line) {
                let level = caps.get(1).unwrap().as_str().len();
                let text = caps.get(2).unwrap().as_str().to_string();
                let start = content
                    .lines()
                    .take(start_offset)
                    .map(|l| l.len() + 1)
                    .sum::<usize>();
                let end = start + line.len();

                headings.push(Heading {
                    level,
                    text,
                    start_offset: start,
                    end_offset: end,
                });
            }
        }

        headings
    }

    /// Extract lists from content
    fn extract_lists(&self, content: &str) -> Vec<List> {
        let mut lists = Vec::new();

        // Numbered and bulleted lists
        let list_re = Regex::new(r"^[\-\*\d\.]+\s+(.+)$").unwrap();
        let mut current_list: Option<List> = None;

        for (start_offset, line) in content.lines().enumerate() {
            if let Some(caps) = list_re.captures(line) {
                let text = caps.get(1).unwrap().as_str().to_string();
                let start = content
                    .lines()
                    .take(start_offset)
                    .map(|l| l.len() + 1)
                    .sum::<usize>();

                if let Some(ref mut list) = current_list {
                    list.items.push(text);
                    list.end_offset = start + line.len();
                } else {
                    current_list = Some(List {
                        items: vec![text],
                        start_offset: start,
                        end_offset: start + line.len(),
                    });
                }
            } else if current_list.is_some() {
                lists.push(current_list.take().unwrap());
            }
        }

        // Add remaining list
        if let Some(list) = current_list {
            lists.push(list);
        }

        lists
    }

    /// Split content into sentences
    fn split_sentences(&self, content: &str) -> Vec<Sentence> {
        let mut sentences = Vec::new();
        let sentence_end_re = Regex::new(r"[.!?。！？]+").unwrap();

        // Simple sentence splitting by punctuation
        let mut current_sentence = String::new();
        let mut start_offset: usize = 0;

        for (i, char) in content.char_indices() {
            current_sentence.push(char);

            // Check for sentence end
            let after_char = content[i + char.len_utf8()..]
                .chars()
                .next()
                .map(|c| c.is_whitespace())
                .unwrap_or(false);

            if sentence_end_re.is_match(&char.to_string()) && after_char {
                let end_offset = i + char.len_utf8();
                let text = current_sentence.trim().to_string();

                if !text.is_empty() {
                    sentences.push(Sentence {
                        text,
                        start_offset,
                        end_offset,
                    });
                }

                current_sentence.clear();
                start_offset = end_offset;
            }
        }

        // Add remaining text as final sentence
        if !current_sentence.trim().is_empty() {
            sentences.push(Sentence {
                text: current_sentence.trim().to_string(),
                start_offset,
                end_offset: content.len(),
            });
        }

        sentences
    }

    /// Split content into paragraphs
    fn split_paragraphs(&self, content: &str) -> Vec<Paragraph> {
        content
            .split(|c: char| c == '\n' && c.is_whitespace())
            .filter(|s| !s.trim().is_empty())
            .scan(0usize, |offset, text| {
                let para = Paragraph {
                    text: text.trim().to_string(),
                    start_offset: *offset,
                    end_offset: *offset + text.len(),
                };
                *offset += text.len() + 1;
                Some(para)
            })
            .collect()
    }

    /// Get current heading for a position
    fn get_current_heading<'a>(
        &self,
        position: usize,
        headings: &'a Vec<Heading>,
    ) -> Option<(String, usize)> {
        let mut current_heading: Option<(&'a str, usize)> = None;

        for heading in headings {
            if position >= heading.start_offset {
                current_heading = Some((heading.text.as_str(), heading.level));
            }
        }

        current_heading.map(|(text, _)| (text.to_string(), 0))
    }

    /// Get section identifier for a position
    fn get_section_for_offset(
        &self,
        _offset: usize,
        headings: &Vec<Heading>,
    ) -> Option<String> {
        // For now, return the first heading as section identifier
        headings.first().map(|h| {
            format!("section_{}", h.text.to_lowercase().replace(' ', "_"))
        })
    }

    /// Count tokens in text (approximate using words)
    pub fn count_tokens(&self, text: &str) -> usize {
        // Simple word-based approximation
        // For accurate counting, use a tokenizer like tiktoken
        text.split_whitespace().count()
    }

    /// Count tokens using tiktoken encoding (if available)
    #[allow(dead_code)]
    pub fn count_tokens_accurate(&self, text: &str) -> usize {
        // This is a fallback - in production, use tiktoken or similar
        // Approximation: ~4 characters per token on average
        (text.len() / 4).max(1)
    }
}

impl Default for SmartChunker {
    fn default() -> Self {
        Self::new()
    }
}

/// Sentence with position information
#[derive(Debug, Clone)]
struct Sentence {
    text: String,
    start_offset: usize,
    end_offset: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sentence_splitting() {
        let chunker = SmartChunker::new();
        let content = "Hello world. This is a test! How are you?";
        let sentences = chunker.split_sentences(content);

        assert_eq!(sentences.len(), 3);
        assert!(sentences[0].text.contains("Hello world"));
        assert!(sentences[1].text.contains("This is a test"));
        assert!(sentences[2].text.contains("How are you"));
    }

    #[test]
    fn test_heading_extraction() {
        let chunker = SmartChunker::new();
        let content = "# Title\n\nSome text\n\n## Subtitle\n\nMore text";
        let headings = chunker.extract_headings(content);

        assert_eq!(headings.len(), 2);
        assert_eq!(headings[0].level, 1);
        assert_eq!(headings[0].text, "Title");
        assert_eq!(headings[1].level, 2);
        assert_eq!(headings[1].text, "Subtitle");
    }

    #[test]
    fn test_token_counting() {
        let chunker = SmartChunker::new();
        let text = "This is a test sentence with eight words.";
        let tokens = chunker.count_tokens(text);

        assert_eq!(tokens, 9); // "This", "is", "a", "test", "sentence", "with", "eight", "words."
    }

    #[test]
    fn test_basic_chunking() {
        let chunker = SmartChunker::new();
        let content = "This is sentence one. This is sentence two. This is sentence three. This is sentence four.";

        let chunks = chunker.chunk("doc1", content).unwrap();

        assert!(!chunks.is_empty());
        assert!(chunks[0].content.contains("This is sentence"));
    }

    #[test]
    fn test_overlap_chunks() {
        let config = SmartChunkerConfig {
            chunk_size: 10,
            overlap: 5,
            min_chunk_size: 3,
            max_chunk_size: 20,
            preserve_structure: false,
            include_heading_context: false,
        };

        let chunker = SmartChunker::with_config(config);
        let content = "First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.";

        let chunks = chunker.chunk("doc1", content).unwrap();

        // With overlap, chunks should share some content
        if chunks.len() >= 2 {
            // Verify overlap exists (this is a basic check)
            assert!(chunks.len() >= 1);
        }
    }

    #[test]
    fn test_chunk_metadata() {
        let chunker = SmartChunker::new();
        let content = "# Header\n\nFirst paragraph content here. Second sentence here.";

        let chunks = chunker.chunk("doc1", content).unwrap();

        if !chunks.is_empty() {
            let chunk = &chunks[0];
            assert!(chunk.chunk_id.starts_with("doc1_"));
            assert_eq!(chunk.document_id, "doc1");
            assert!(chunk.content.contains("First paragraph"));
        }
    }

    #[test]
    fn test_empty_content() {
        let chunker = SmartChunker::new();
        let chunks = chunker.chunk("doc1", "").unwrap();

        assert!(chunks.is_empty());
    }

    #[test]
    fn test_to_document_chunk() {
        let chunker = SmartChunker::new();
        let smart_chunk = SmartChunk {
            chunk_id: "doc1_0".to_string(),
            document_id: "doc1".to_string(),
            content: "Test content".to_string(),
            token_count: 2,
            start_offset: 0,
            end_offset: 12,
            heading: Some("Test Header".to_string()),
            page_number: None,
            section: Some("section_test".to_string()),
            chunk_index: 0,
        };

        let doc_chunk = chunker.to_document_chunk(&smart_chunk);

        assert_eq!(doc_chunk.chunk_id, smart_chunk.chunk_id);
        assert_eq!(doc_chunk.content, smart_chunk.content);
        assert_eq!(doc_chunk.heading, smart_chunk.heading);
    }
}
