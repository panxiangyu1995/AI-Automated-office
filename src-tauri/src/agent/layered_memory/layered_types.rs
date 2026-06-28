//! Layered memory types for scope-based memory management.
//!
//! This module defines types for managing memory across different scopes:
//! - User: Cross-project user memories
//! - Project: Project-level memories accessible by all members
//! - Local: Session-level memories not persisted to VCS

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Memory scope for file-based storage
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryScope {
    /// User-private memories stored in `~/.ai-office/agent-memory/`
    User,
    /// Project-level memories stored in `.ai-office/agent-memory/`
    Project,
    /// Session-level memories stored in `.ai-office/agent-memory-local/`
    Local,
}

impl Default for MemoryScope {
    fn default() -> Self {
        Self::Local
    }
}

impl MemoryScope {
    /// Get the directory path prefix for this scope
    pub fn dir_prefix(&self) -> &'static str {
        match self {
            MemoryScope::User => "agent-memory",
            MemoryScope::Project => "agent-memory",
            MemoryScope::Local => "agent-memory-local",
        }
    }

    /// Check if this scope is persisted across sessions
    pub fn is_persistent(&self) -> bool {
        matches!(self, MemoryScope::User | MemoryScope::Project)
    }

    /// Check if this scope is version controlled
    pub fn is_vcs_compatible(&self) -> bool {
        matches!(self, MemoryScope::Project)
    }

    /// Get priority for search (lower = higher priority)
    pub fn search_priority(&self) -> u8 {
        match self {
            MemoryScope::Local => 0,
            MemoryScope::Project => 1,
            MemoryScope::User => 2,
        }
    }
}

/// Memory file entry for file-based storage
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryFileEntry {
    /// Entry ID
    pub id: String,
    /// Memory scope
    pub scope: MemoryScope,
    /// Content of the memory entry
    pub content: String,
    /// Optional key for lookup
    pub key: Option<String>,
    /// When this entry was created
    pub created_at: DateTime<Utc>,
    /// When this entry was last modified
    pub updated_at: DateTime<Utc>,
    /// Number of times accessed
    pub access_count: u64,
    /// Whether this entry is pinned (not auto-cleaned)
    pub pinned: bool,
    /// Optional tags for categorization
    pub tags: Vec<String>,
}

impl MemoryFileEntry {
    /// Create a new memory entry
    pub fn new(content: String) -> Self {
        let now = Utc::now();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            scope: MemoryScope::default(),
            content,
            key: None,
            created_at: now,
            updated_at: now,
            access_count: 0,
            pinned: false,
            tags: Vec::new(),
        }
    }

    /// Create with specific scope
    pub fn with_scope(content: String, scope: MemoryScope) -> Self {
        Self {
            scope,
            ..Self::new(content)
        }
    }

    /// Record an access
    pub fn record_access(&mut self) {
        self.access_count += 1;
    }

    /// Update content
    pub fn update_content(&mut self, content: String) {
        self.content = content;
        self.updated_at = Utc::now();
    }
}

/// Memory file for storing entries
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryFile {
    /// File name (without path)
    pub name: String,
    /// All entries in this file
    pub entries: Vec<MemoryFileEntry>,
    /// File metadata
    pub metadata: MemoryFileMetadata,
}

impl MemoryFile {
    /// Create a new memory file
    pub fn new(name: String) -> Self {
        Self {
            name,
            entries: Vec::new(),
            metadata: MemoryFileMetadata::default(),
        }
    }

    /// Add an entry
    pub fn add_entry(&mut self, entry: MemoryFileEntry) {
        self.entries.push(entry);
        self.metadata.updated_at = Utc::now();
        self.metadata.entry_count = self.entries.len() as u64;
    }

    /// Get entry by ID
    pub fn get_entry(&self, id: &str) -> Option<&MemoryFileEntry> {
        self.entries.iter().find(|e| e.id == id)
    }

    /// Get mutable entry by ID
    pub fn get_entry_mut(&mut self, id: &str) -> Option<&mut MemoryFileEntry> {
        self.metadata.updated_at = Utc::now();
        self.entries.iter_mut().find(|e| e.id == id)
    }

    /// Remove entry by ID
    pub fn remove_entry(&mut self, id: &str) -> Option<MemoryFileEntry> {
        if let Some(pos) = self.entries.iter().position(|e| e.id == id) {
            self.metadata.updated_at = Utc::now();
            self.metadata.entry_count = (self.entries.len() - 1) as u64;
            Some(self.entries.remove(pos))
        } else {
            None
        }
    }

    /// Truncate entries to fit limits
    pub fn truncate(&mut self, max_lines: u64, max_size_bytes: u64) -> Vec<MemoryFileEntry> {
        let mut removed = Vec::new();

        // Count lines and size
        let total_lines: u64 = self.entries.iter().map(|e| e.content.lines().count() as u64).sum();
        let total_size: u64 = self.entries.iter().map(|e| e.content.len() as u64).sum();

        // If within limits, nothing to do
        if total_lines <= max_lines && total_size <= max_size_bytes {
            return removed;
        }

        // Remove non-pinned entries from the beginning (oldest first)
        while self.entries.iter().any(|e| !e.pinned) {
            if let Some(pos) = self.entries.iter().position(|e| !e.pinned) {
                removed.push(self.entries.remove(pos));
            } else {
                break;
            }

            // Recalculate
            let total_lines: u64 = self.entries.iter().map(|e| e.content.lines().count() as u64).sum();
            let total_size: u64 = self.entries.iter().map(|e| e.content.len() as u64).sum();

            if total_lines <= max_lines && total_size <= max_size_bytes {
                break;
            }
        }

        self.metadata.updated_at = Utc::now();
        self.metadata.truncated = true;
        removed
    }
}

/// Metadata for a memory file
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryFileMetadata {
    /// When the file was created
    pub created_at: DateTime<Utc>,
    /// When the file was last modified
    pub updated_at: DateTime<Utc>,
    /// Number of entries
    pub entry_count: u64,
    /// Total size in bytes
    pub total_size_bytes: u64,
    /// Whether file was truncated
    pub truncated: bool,
    /// Version for conflict resolution
    pub version: u64,
}

impl Default for MemoryFileMetadata {
    fn default() -> Self {
        Self {
            created_at: Utc::now(),
            updated_at: Utc::now(),
            entry_count: 0,
            total_size_bytes: 0,
            truncated: false,
            version: 1,
        }
    }
}

/// Memory scope configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScopeConfig {
    /// Memory scope
    pub scope: MemoryScope,
    /// Maximum entries per file
    pub max_entries: u64,
    /// Maximum lines per file
    pub max_lines: u64,
    /// Maximum size per file in bytes
    pub max_size_bytes: u64,
    /// Whether to persist this scope
    pub persistent: bool,
    /// Whether this scope is VCS compatible
    pub vcs_compatible: bool,
}

impl Default for ScopeConfig {
    fn default() -> Self {
        match MemoryScope::default() {
            MemoryScope::Local => Self {
                scope: MemoryScope::Local,
                max_entries: 100,
                max_lines: 200,
                max_size_bytes: 25 * 1024, // 25KB
                persistent: false,
                vcs_compatible: false,
            },
            _ => Self {
                scope: MemoryScope::default(),
                max_entries: 500,
                max_lines: 200,
                max_size_bytes: 25 * 1024, // 25KB
                persistent: true,
                vcs_compatible: true,
            },
        }
    }
}

impl ScopeConfig {
    /// Default config for User scope
    pub fn user() -> Self {
        Self {
            scope: MemoryScope::User,
            max_entries: 500,
            max_lines: 200,
            max_size_bytes: 25 * 1024,
            persistent: true,
            vcs_compatible: false,
        }
    }

    /// Default config for Project scope
    pub fn project() -> Self {
        Self {
            scope: MemoryScope::Project,
            max_entries: 500,
            max_lines: 200,
            max_size_bytes: 25 * 1024,
            persistent: true,
            vcs_compatible: true,
        }
    }

    /// Default config for Local scope
    pub fn local() -> Self {
        Self {
            scope: MemoryScope::Local,
            max_entries: 100,
            max_lines: 200,
            max_size_bytes: 25 * 1024,
            persistent: false,
            vcs_compatible: false,
        }
    }
}

/// Search result with scope ranking
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScopedSearchResult {
    /// Search result
    pub entry: MemoryFileEntry,
    /// Scope where result was found
    pub scope: MemoryScope,
    /// Search score
    pub score: f64,
    /// Scope priority (for ranking)
    pub scope_priority: u8,
}

impl ScopedSearchResult {
    /// Calculate combined score (search score + scope priority boost)
    pub fn combined_score(&self) -> f64 {
        // Local gets 100 point boost, Project 50, User 0
        let scope_boost = match self.scope {
            MemoryScope::Local => 100.0,
            MemoryScope::Project => 50.0,
            MemoryScope::User => 0.0,
        };
        self.score + scope_boost
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_scope_properties() {
        assert!(MemoryScope::User.is_persistent());
        assert!(MemoryScope::Project.is_persistent());
        assert!(!MemoryScope::Local.is_persistent());

        assert!(!MemoryScope::User.is_vcs_compatible());
        assert!(MemoryScope::Project.is_vcs_compatible());
        assert!(!MemoryScope::Local.is_vcs_compatible());
    }

    #[test]
    fn test_memory_scope_search_priority() {
        assert_eq!(MemoryScope::Local.search_priority(), 0);
        assert_eq!(MemoryScope::Project.search_priority(), 1);
        assert_eq!(MemoryScope::User.search_priority(), 2);
    }

    #[test]
    fn test_memory_file_entry() {
        let mut entry = MemoryFileEntry::new("test content".to_string());
        assert!(entry.id.len() > 0);

        entry.record_access();
        assert_eq!(entry.access_count, 1);

        entry.update_content("new content".to_string());
        assert_eq!(entry.content, "new content");
    }

    #[test]
    fn test_memory_file_truncate() {
        let mut file = MemoryFile::new("test.md".to_string());

        // Add entries
        for i in 0..5 {
            file.add_entry(MemoryFileEntry::new(format!("entry {}", i)));
        }

        // Truncate to max 2 entries
        let removed = file.truncate(2, 1000);
        assert_eq!(removed.len(), 3);
        assert_eq!(file.entries.len(), 2);
    }

    #[test]
    fn test_scoped_search_result_score() {
        let entry = MemoryFileEntry::new("test".to_string());
        let result = ScopedSearchResult {
            entry,
            scope: MemoryScope::Local,
            score: 0.5,
            scope_priority: 0,
        };

        // Local scope should get 100 point boost
        assert_eq!(result.combined_score(), 100.5);
    }
}
