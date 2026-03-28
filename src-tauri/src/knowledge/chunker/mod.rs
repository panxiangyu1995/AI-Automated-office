//! Document chunker module.

mod chunker;

pub use chunker::{DocumentChunker, Chunk};
pub use crate::knowledge::types::{ChunkingStrategyType, ChunkingStrategyConfig};
