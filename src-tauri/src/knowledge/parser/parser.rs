//! Document parser implementation.

use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;

use super::super::types::*;

/// Document parser trait
#[async_trait]
pub trait DocumentParser: Send + Sync {
    /// Get supported document types
    fn supported_types(&self) -> Vec<DocumentType>;

    /// Parse document content
    async fn parse(&self, content: &[u8], metadata: &DocumentMetadata) -> Result<ParsedDocument, ParseError>;
}

/// Parse error
#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("Unsupported document type: {0}")]
    UnsupportedType(String),

    #[error("Parse failed: {0}")]
    ParseFailed(String),

    #[error("Invalid content: {0}")]
    InvalidContent(String),
}

/// Parser registry
pub struct ParserRegistry {
    parsers: HashMap<DocumentType, Arc<dyn DocumentParser>>,
}

impl ParserRegistry {
    /// Create a new registry
    pub fn new() -> Self {
        let mut registry = Self {
            parsers: HashMap::new(),
        };
        registry.register(Arc::new(TxtParser::new()));
        registry.register(Arc::new(MarkdownParser::new()));
        // Would register more parsers
        registry
    }

    /// Register a parser
    pub fn register(&mut self, parser: Arc<dyn DocumentParser>) {
        let types = parser.supported_types();
        for doc_type in types {
            self.parsers.insert(doc_type, parser.clone());
        }
    }

    /// Parse document
    pub async fn parse(&self, content: &[u8], metadata: &DocumentMetadata) -> Result<ParsedDocument, ParseError> {
        let parser = self.parsers
            .get(&metadata.document_type)
            .ok_or_else(|| ParseError::UnsupportedType(format!("{:?}", metadata.document_type)))?;

        parser.parse(content, metadata).await
    }
}

impl Default for ParserRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Txt parser
pub struct TxtParser;

impl TxtParser {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl DocumentParser for TxtParser {
    fn supported_types(&self) -> Vec<DocumentType> {
        vec![DocumentType::Txt]
    }

    async fn parse(&self, content: &[u8], metadata: &DocumentMetadata) -> Result<ParsedDocument, ParseError> {
        let text = String::from_utf8(content.to_vec())
            .map_err(|e| ParseError::InvalidContent(e.to_string()))?;

        Ok(ParsedDocument {
            document_id: metadata.document_id.clone(),
            title: None,
            content: text.clone(),
            metadata: metadata.clone(),
            raw_content: content.to_vec(),
        })
    }
}

/// Markdown parser
pub struct MarkdownParser {
    extract_frontmatter: bool,
}

impl MarkdownParser {
    pub fn new() -> Self {
        Self {
            extract_frontmatter: true,
        }
    }
}

#[async_trait]
impl DocumentParser for MarkdownParser {
    fn supported_types(&self) -> Vec<DocumentType> {
        vec![DocumentType::Markdown]
    }

    async fn parse(&self, content: &[u8], metadata: &DocumentMetadata) -> Result<ParsedDocument, ParseError> {
        let text = String::from_utf8(content.to_vec())
            .map_err(|e| ParseError::InvalidContent(e.to_string()))?;

        let (title, body) = if self.extract_frontmatter {
            extract_markdown_title(&text)
        } else {
            (None, text)
        };

        Ok(ParsedDocument {
            document_id: metadata.document_id.clone(),
            title,
            content: body,
            metadata: metadata.clone(),
            raw_content: content.to_vec(),
        })
    }
}

/// Extract title from markdown content
fn extract_markdown_title(content: &str) -> (Option<String>, String) {
    let lines: Vec<&str> = content.lines().collect();

    for line in &lines {
        let trimmed = line.trim();
        if trimmed.starts_with("# ") {
            return (Some(trimmed[2..].to_string()), content.to_string());
        }
    }

    (None, content.to_string())
}
