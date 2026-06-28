//! Layered memory module for scope-based file storage.
//!
//! This module provides a layered memory architecture that supports different
//! scopes of memory persistence and access:
//!
//! - **User**: Cross-project user memories stored in `~/.ai-office/agent-memory/`
//! - **Project**: Project-level memories stored in `.ai-office/agent-memory/`
//! - **Local**: Session-level memories stored in `.ai-office/agent-memory-local/`
//!
//! # Features
//!
//! - Priority-based memory retrieval (Local > Project > User)
//! - Memory file truncation (max 200 lines, 25KB per file)
//! - Access control based on scope
//! - Memory search with scope ranking
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::agent::layered_memory::{LayeredMemory, MemoryScope, MemoryFileEntry};
//!
//! let memory = LayeredMemory::new(
//!     home_dir,
//!     project_dir,
//! );
//!
//! // Add memory entry
//! let entry = MemoryFileEntry::new("Remember that...".to_string());
//! memory.add_entry(MemoryScope::User, "user_id", entry).await;
//!
//! // Build memory prompt
//! let prompt = memory.build_memory_prompt(user_id, project_id, session_id).await;
//! ```
//!
//! # File Truncation
//!
//! Memory files are automatically truncated if they exceed:
//! - 200 lines per file
//! - 25KB per file
//!
//! Older non-pinned entries are removed first.

pub mod layered_types;
pub mod layered_memory;

pub use layered_types::{
    MemoryFileEntry, MemoryScope,
};

pub use layered_memory::LayeredMemory;
