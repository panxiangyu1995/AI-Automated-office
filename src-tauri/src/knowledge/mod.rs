//! Knowledge 知识库模块

pub mod types;
pub mod embedding_cache;
pub mod pipeline;
pub mod context_builder;
pub mod parser;
pub mod chunker;
pub mod crud;
pub mod document_crud;
pub mod segment;
pub mod audit;
pub mod permission;
pub mod bm25;
pub mod metadata_filter;
pub mod retrieval_config;
pub mod smart_chunker;
pub mod commands;

pub use types::*;
pub use embedding_cache::*;
pub use pipeline::DocumentPipeline;
pub use context_builder::RagContextBuilder;
