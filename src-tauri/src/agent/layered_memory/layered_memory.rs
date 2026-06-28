//! Layered memory manager for scope-based file storage.
//!
//! This module provides the LayeredMemory manager that handles:
//! - Loading and saving memory files for different scopes
//! - Priority-based memory retrieval (Local > Project > User)
//! - Memory file truncation
//! - Access control based on scope

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use tokio::fs;
use tokio::sync::RwLock;

use super::layered_types::{
    MemoryFile, MemoryFileEntry, MemoryScope, ScopeConfig, ScopedSearchResult,
};

/// Layered memory manager for file-based memory storage
pub struct LayeredMemory {
    /// User's home directory path
    home_dir: PathBuf,
    /// Project directory path
    project_dir: PathBuf,
    /// Cache of loaded memory files
    cache: Arc<RwLock<HashMap<(MemoryScope, String), MemoryFile>>>,
    /// Configuration per scope
    configs: HashMap<MemoryScope, ScopeConfig>,
}

impl LayeredMemory {
    /// Create a new LayeredMemory manager
    pub fn new(home_dir: PathBuf, project_dir: PathBuf) -> Self {
        let mut configs = HashMap::new();
        configs.insert(MemoryScope::User, ScopeConfig::user());
        configs.insert(MemoryScope::Project, ScopeConfig::project());
        configs.insert(MemoryScope::Local, ScopeConfig::local());

        Self {
            home_dir,
            project_dir,
            cache: Arc::new(RwLock::new(HashMap::new())),
            configs,
        }
    }

    /// Get the base directory for a scope
    fn scope_dir(&self, scope: MemoryScope) -> PathBuf {
        match scope {
            MemoryScope::User => {
                // ~/.ai-office/agent-memory/
                self.home_dir.join(".ai-office").join(scope.dir_prefix())
            }
            MemoryScope::Project => {
                // .ai-office/agent-memory/
                self.project_dir.join(".ai-office").join(scope.dir_prefix())
            }
            MemoryScope::Local => {
                // .ai-office/agent-memory-local/
                self.project_dir.join(".ai-office").join(scope.dir_prefix())
            }
        }
    }

    /// Get memory file path for a scope and name
    fn file_path(&self, scope: MemoryScope, name: &str) -> PathBuf {
        self.scope_dir(scope).join(format!("{}.json", name))
    }

    /// Ensure directory exists for a scope
    async fn ensure_dir(&self, scope: MemoryScope) -> std::io::Result<()> {
        let dir = self.scope_dir(scope);
        fs::create_dir_all(&dir).await
    }

    /// Load memory file for a scope
    pub async fn load_file(&self, scope: MemoryScope, name: &str) -> Option<MemoryFile> {
        let cache_key = (scope, name.to_string());

        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some(file) = cache.get(&cache_key) {
                return Some(file.clone());
            }
        }

        let path = self.file_path(scope, name);
        if !path.exists() {
            return None;
        }

        match fs::read_to_string(&path).await {
            Ok(content) => {
                match serde_json::from_str::<MemoryFile>(&content) {
                    Ok(file) => {
                        // Update cache
                        let mut cache = self.cache.write().await;
                        cache.insert(cache_key, file.clone());
                        Some(file)
                    }
                    Err(_) => None,
                }
            }
            Err(_) => None,
        }
    }

    /// Save memory file for a scope
    pub async fn save_file(&self, scope: MemoryScope, name: &str, file: &mut MemoryFile) -> std::io::Result<()> {
        self.ensure_dir(scope).await?;

        // Truncate if needed
        if let Some(config) = self.configs.get(&scope) {
            file.truncate(config.max_lines, config.max_size_bytes);
        }

        let path = self.file_path(scope, name);
        let content = serde_json::to_string_pretty(file)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;

        fs::write(&path, content).await?;

        // Update cache
        let cache_key = (scope, name.to_string());
        let mut cache = self.cache.write().await;
        cache.insert(cache_key, file.clone());

        Ok(())
    }

    /// Get or create a memory file
    pub async fn get_or_create(&self, scope: MemoryScope, name: &str) -> MemoryFile {
        self.load_file(scope, name)
            .await
            .unwrap_or_else(|| MemoryFile::new(name.to_string()))
    }

    /// Add entry to a memory file
    pub async fn add_entry(&self, scope: MemoryScope, name: &str, entry: MemoryFileEntry) -> std::io::Result<()> {
        let mut file = self.get_or_create(scope, name).await;
        file.add_entry(entry);
        self.save_file(scope, name, &mut file).await
    }

    /// Get entry from a memory file
    pub async fn get_entry(&self, scope: MemoryScope, name: &str, entry_id: &str) -> Option<MemoryFileEntry> {
        let file = self.load_file(scope, name).await?;
        file.get_entry(entry_id).cloned()
    }

    /// Update entry in a memory file
    pub async fn update_entry(&self, scope: MemoryScope, name: &str, entry: &MemoryFileEntry) -> std::io::Result<()> {
        let mut file = self.get_or_create(scope, name).await;

        if let Some(existing) = file.get_entry_mut(&entry.id) {
            *existing = entry.clone();
        }

        self.save_file(scope, name, &mut file).await
    }

    /// Delete entry from a memory file
    pub async fn delete_entry(&self, scope: MemoryScope, name: &str, entry_id: &str) -> std::io::Result<()> {
        let mut file = self.get_or_create(scope, name).await;
        file.remove_entry(entry_id);
        self.save_file(scope, name, &mut file).await
    }

    /// Build memory prompt from all applicable layers
    ///
    /// Priority: Local > Project > User
    pub async fn build_memory_prompt(
        &self,
        user_id: &str,
        project_id: &str,
        session_id: &str,
    ) -> String {
        let mut parts = Vec::new();

        // Local layer first (highest priority)
        let local_file = self.load_file(MemoryScope::Local, session_id).await;
        if let Some(file) = local_file {
            if !file.entries.is_empty() {
                parts.push(format!(
                    "# Local Memory (Session: {})\n\n{}",
                    session_id,
                    self.entries_to_text(&file.entries)
                ));
            }
        }

        // Project layer second
        let project_file = self.load_file(MemoryScope::Project, project_id).await;
        if let Some(file) = project_file {
            if !file.entries.is_empty() {
                parts.push(format!(
                    "# Project Memory\n\n{}",
                    self.entries_to_text(&file.entries)
                ));
            }
        }

        // User layer last
        let user_file = self.load_file(MemoryScope::User, user_id).await;
        if let Some(file) = user_file {
            if !file.entries.is_empty() {
                parts.push(format!(
                    "# User Memory\n\n{}",
                    self.entries_to_text(&file.entries)
                ));
            }
        }

        if parts.is_empty() {
            String::new()
        } else {
            parts.join("\n\n---\n\n")
        }
    }

    /// Convert entries to text for prompt
    fn entries_to_text(&self, entries: &[MemoryFileEntry]) -> String {
        entries
            .iter()
            .map(|e| {
                if let Some(ref key) = e.key {
                    format!("## {}\n\n{}\n", key, e.content)
                } else {
                    format!("{}\n", e.content)
                }
            })
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Search across all layers with scope ranking
    pub async fn search(&self, user_id: &str, project_id: &str, query: &str) -> Vec<ScopedSearchResult> {
        let mut results = Vec::new();

        // Search Local layer
        if let Some(file) = self.load_file(MemoryScope::Local, project_id).await {
            for entry in &file.entries {
                let score = self.simple_match_score(&entry.content, query);
                if score > 0.0 {
                    results.push(ScopedSearchResult {
                        entry: entry.clone(),
                        scope: MemoryScope::Local,
                        score,
                        scope_priority: MemoryScope::Local.search_priority(),
                    });
                }
            }
        }

        // Search Project layer
        if let Some(file) = self.load_file(MemoryScope::Project, project_id).await {
            for entry in &file.entries {
                let score = self.simple_match_score(&entry.content, query);
                if score > 0.0 {
                    results.push(ScopedSearchResult {
                        entry: entry.clone(),
                        scope: MemoryScope::Project,
                        score,
                        scope_priority: MemoryScope::Project.search_priority(),
                    });
                }
            }
        }

        // Search User layer
        if let Some(file) = self.load_file(MemoryScope::User, user_id).await {
            for entry in &file.entries {
                let score = self.simple_match_score(&entry.content, query);
                if score > 0.0 {
                    results.push(ScopedSearchResult {
                        entry: entry.clone(),
                        scope: MemoryScope::User,
                        score,
                        scope_priority: MemoryScope::User.search_priority(),
                    });
                }
            }
        }

        // Sort by combined score (search score + scope boost)
        results.sort_by(|a, b| {
            b.combined_score()
                .partial_cmp(&a.combined_score())
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        results
    }

    /// Simple keyword match scoring
    fn simple_match_score(&self, content: &str, query: &str) -> f64 {
        let content_lower = content.to_lowercase();
        let query_lower = query.to_lowercase();

        let query_words: Vec<&str> = query_lower.split_whitespace().collect();
        let mut matches = 0;

        for word in &query_words {
            if content_lower.contains(word) {
                matches += 1;
            }
        }

        if query_words.is_empty() {
            0.0
        } else {
            matches as f64 / query_words.len() as f64
        }
    }

    /// Clear cache for a scope
    pub async fn clear_cache(&self, scope: Option<MemoryScope>) {
        let mut cache = self.cache.write().await;
        if let Some(s) = scope {
            cache.retain(|(scope_key, _), _| *scope_key != s);
        } else {
            cache.clear();
        }
    }

    /// Invalidate a specific cached file
    pub async fn invalidate(&self, scope: MemoryScope, name: &str) {
        let mut cache = self.cache.write().await;
        cache.remove(&(scope, name.to_string()));
    }

    /// Get memory statistics
    pub async fn get_stats(&self) -> HashMap<MemoryScope, MemoryStats> {
        let mut stats = HashMap::new();

        for scope in &[MemoryScope::User, MemoryScope::Project, MemoryScope::Local] {
            let dir = self.scope_dir(*scope);
            let mut stat = MemoryStats::default();

            if dir.exists() {
                if let Ok(entries) = fs::read_dir(&dir).await {
                    let count = 0;
                    let size = 0u64;

                    // Count files and sizes (simplified - real impl would traverse)
                    stat.file_count = count as u64;
                }
            }

            stats.insert(*scope, stat);
        }

        stats
    }
}

/// Memory statistics per scope
#[derive(Debug, Clone, Default)]
pub struct MemoryStats {
    pub file_count: u64,
    pub total_entries: u64,
    pub total_size_bytes: u64,
}

impl Clone for LayeredMemory {
    fn clone(&self) -> Self {
        Self {
            home_dir: self.home_dir.clone(),
            project_dir: self.project_dir.clone(),
            cache: Arc::clone(&self.cache),
            configs: self.configs.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_layered_memory_creation() {
        let memory = LayeredMemory::new(
            PathBuf::from("/home/user"),
            PathBuf::from("/project"),
        );

        assert_eq!(memory.scope_dir(MemoryScope::User), PathBuf::from("/home/user/.ai-office/agent-memory"));
        assert_eq!(memory.scope_dir(MemoryScope::Project), PathBuf::from("/project/.ai-office/agent-memory"));
        assert_eq!(memory.scope_dir(MemoryScope::Local), PathBuf::from("/project/.ai-office/agent-memory-local"));
    }

    #[test]
    fn test_simple_match_score() {
        let memory = LayeredMemory::new(PathBuf::new(), PathBuf::new());

        // Perfect match
        let score = memory.simple_match_score("The quick brown fox", "quick");
        assert!(score > 0.0);

        // Multiple words
        let score = memory.simple_match_score("The quick brown fox", "quick fox");
        assert!(score > 0.5);

        // No match
        let score = memory.simple_match_score("The quick brown fox", "elephant");
        assert_eq!(score, 0.0);
    }

    #[test]
    fn test_entries_to_text() {
        let memory = LayeredMemory::new(PathBuf::new(), PathBuf::new());

        let entries = vec![
            MemoryFileEntry::with_scope("content1".to_string(), MemoryScope::User),
            MemoryFileEntry::with_scope("content2".to_string(), MemoryScope::User),
        ];

        let text = memory.entries_to_text(&entries);
        assert!(text.contains("content1"));
        assert!(text.contains("content2"));
    }
}
