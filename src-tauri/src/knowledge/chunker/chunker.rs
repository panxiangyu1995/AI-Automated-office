//! Document chunker implementation.

use super::super::types::{ChunkingStrategyType, ChunkingStrategyConfig};

/// Document chunker
pub struct DocumentChunker {
    config: ChunkingStrategyConfig,
}

impl DocumentChunker {
    /// Create a new chunker
    pub fn new(config: ChunkingStrategyConfig) -> Self {
        Self { config }
    }

    /// Chunk text content
    pub async fn chunk(&self, content: &str) -> Result<Vec<Chunk>, ChunkError> {
        match self.config.strategy_type {
            ChunkingStrategyType::FixedSize => self.chunk_fixed_size(content),
            ChunkingStrategyType::Sentence => self.chunk_by_sentence(content),
            ChunkingStrategyType::Paragraph => self.chunk_by_paragraph(content),
            ChunkingStrategyType::Recursive => self.chunk_recursive(content),
            ChunkingStrategyType::Semantic => self.chunk_fixed_size(content), // Fallback to fixed
        }
    }

    /// Fixed size chunking
    fn chunk_fixed_size(&self, content: &str) -> Result<Vec<Chunk>, ChunkError> {
        let mut chunks = Vec::new();
        let chars: Vec<char> = content.chars().collect();
        let chunk_size = self.config.chunk_size;
        let overlap = self.config.overlap;

        let mut start = 0;
        let mut chunk_index = 0;

        while start < chars.len() {
            let end = (start + chunk_size).min(chars.len());
            let chunk_text: String = chars[start..end].iter().collect();

            let token_count = estimate_tokens(&chunk_text);
            if token_count >= self.config.min_chunk_size {
                chunks.push(Chunk {
                    chunk_id: format!("chunk_{}", chunk_index),
                    chunk_index,
                    content: chunk_text,
                    token_count,
                    start_offset: start,
                    end_offset: end,
                    heading: None,
                    page_number: None,
                    section: None,
                });
            }

            start += chunk_size - overlap;
            chunk_index += 1;
        }

        Ok(chunks)
    }

    /// Chunk by sentence boundaries
    fn chunk_by_sentence(&self, content: &str) -> Result<Vec<Chunk>, ChunkError> {
        let sentences: Vec<&str> = content.split(|c| c == '.' || c == '!' || c == '?')
            .filter(|s| !s.trim().is_empty())
            .collect();

        let mut chunks = Vec::new();
        let mut current_chunk = String::new();
        let mut current_tokens = 0;
        let mut chunk_index = 0;
        let mut start_offset = 0;

        for sentence in sentences {
            let sentence_tokens = estimate_tokens(sentence);

            if current_tokens + sentence_tokens > self.config.chunk_size && !current_chunk.is_empty() {
                chunks.push(Chunk {
                    chunk_id: format!("chunk_{}", chunk_index),
                    chunk_index,
                    content: current_chunk.clone(),
                    token_count: current_tokens,
                    start_offset,
                    end_offset: start_offset + current_chunk.len(),
                    heading: None,
                    page_number: None,
                    section: None,
                });

                chunk_index += 1;
                current_chunk.clear();
                current_tokens = 0;
                start_offset += current_chunk.len();
            }

            current_chunk.push_str(sentence);
            current_chunk.push('.');
            current_tokens += sentence_tokens;
        }

        if !current_chunk.is_empty() {
            let end_offset = start_offset + current_chunk.len();
            chunks.push(Chunk {
                chunk_id: format!("chunk_{}", chunk_index),
                chunk_index,
                content: current_chunk,
                token_count: current_tokens,
                start_offset,
                end_offset,
                heading: None,
                page_number: None,
                section: None,
            });
        }

        Ok(chunks)
    }

    /// Chunk by paragraph boundaries
    fn chunk_by_paragraph(&self, content: &str) -> Result<Vec<Chunk>, ChunkError> {
        let paragraphs: Vec<&str> = content.split("\n\n")
            .filter(|p| !p.trim().is_empty())
            .collect();

        let mut chunks = Vec::new();
        let mut current_chunk = String::new();
        let mut current_tokens = 0;
        let mut chunk_index = 0;
        let mut start_offset = 0;

        for paragraph in paragraphs {
            let paragraph_tokens = estimate_tokens(paragraph);

            if current_tokens + paragraph_tokens > self.config.chunk_size && !current_chunk.is_empty() {
                chunks.push(Chunk {
                    chunk_id: format!("chunk_{}", chunk_index),
                    chunk_index,
                    content: current_chunk.clone(),
                    token_count: current_tokens,
                    start_offset,
                    end_offset: start_offset + current_chunk.len(),
                    heading: None,
                    page_number: None,
                    section: None,
                });

                chunk_index += 1;
                current_chunk.clear();
                current_tokens = 0;
                start_offset += current_chunk.len();
            }

            if !current_chunk.is_empty() {
                current_chunk.push_str("\n\n");
            }
            current_chunk.push_str(paragraph);
            current_tokens += paragraph_tokens;
        }

        if !current_chunk.is_empty() {
            let end_offset = start_offset + current_chunk.len();
            chunks.push(Chunk {
                chunk_id: format!("chunk_{}", chunk_index),
                chunk_index,
                content: current_chunk,
                token_count: current_tokens,
                start_offset,
                end_offset,
                heading: None,
                page_number: None,
                section: None,
            });
        }

        Ok(chunks)
    }

    /// Recursive chunking with separators
    fn chunk_recursive(&self, content: &str) -> Result<Vec<Chunk>, ChunkError> {
        let separators = vec!["\n\n", "\n", ". ", " "];
        let mut chunks = Vec::new();

        let mut start = 0;
        let chars: Vec<char> = content.chars().collect();
        let chunk_size = self.config.chunk_size;
        let overlap = self.config.overlap;

        while start < chars.len() {
            let mut end = (start + chunk_size).min(chars.len());

            // Try to split at a separator
            for sep in &separators {
                let sep_chars: Vec<char> = sep.chars().collect();
                for i in (start..end).rev() {
                    if i + sep_chars.len() <= chars.len() {
                        let slice = &chars[i..i + sep_chars.len()];
                        if slice.iter().eq(sep_chars.iter()) {
                            end = i;
                            break;
                        }
                    }
                }
            }

            let chunk_text: String = chars[start..end].iter().collect();
            let token_count = estimate_tokens(&chunk_text);

            if token_count >= self.config.min_chunk_size {
                chunks.push(Chunk {
                    chunk_id: format!("chunk_{}", chunks.len()),
                    chunk_index: chunks.len(),
                    content: chunk_text,
                    token_count,
                    start_offset: start,
                    end_offset: end,
                    heading: None,
                    page_number: None,
                    section: None,
                });
            }

            start += chunk_size - overlap;
            if start >= chars.len() {
                break;
            }
        }

        Ok(chunks)
    }
}

/// Chunk
#[derive(Debug, Clone)]
pub struct Chunk {
    pub chunk_id: String,
    pub chunk_index: usize,
    pub content: String,
    pub token_count: usize,
    pub start_offset: usize,
    pub end_offset: usize,
    pub heading: Option<String>,
    pub page_number: Option<usize>,
    pub section: Option<String>,
}

/// Chunk error
#[derive(Debug, thiserror::Error)]
pub enum ChunkError {
    #[error("Chunking failed: {0}")]
    ChunkingFailed(String),
}

/// Estimate token count (simple heuristic: ~4 chars per token for English)
fn estimate_tokens(text: &str) -> usize {
    text.chars().count() / 4
}
