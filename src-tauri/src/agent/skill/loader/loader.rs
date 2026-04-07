//! Progressive skill loader implementation.

use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

use tokio::sync::RwLock;

use super::{SkillLoaderTrait, super::{
    Skill, SkillError, SkillLoadResult, LoadingProgress, LoadingStage,
}};
use super::super::parser::{SkillParser, SkillParserTrait};
use std::collections::HashMap;

/// Progressive skill loader
pub struct SkillLoader {
    parser: Arc<SkillParser>,
    progress: Arc<RwLock<LoadingProgress>>,
    /// Per-skill progress tracking
    skill_progress: Arc<RwLock<HashMap<String, LoadingProgress>>>,
    /// Loaded skills cache
    loaded_skills: Arc<RwLock<Vec<Skill>>>,
}

impl SkillLoader {
    /// Create a new loader
    pub fn new() -> Self {
        Self {
            parser: Arc::new(SkillParser::new()),
            progress: Arc::new(RwLock::new(LoadingProgress {
                stage: LoadingStage::Discovery,
                progress: 0,
                message: String::new(),
                skills_loaded: 0,
                total_skills: 0,
            })),
            skill_progress: Arc::new(RwLock::new(HashMap::new())),
            loaded_skills: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Update loading progress
    async fn update_progress(&self, stage: LoadingStage, progress: u8, message: &str) {
        let mut p = self.progress.write().await;
        p.stage = stage;
        p.progress = progress;
        p.message = message.to_string();
    }

    /// Get progress for a specific skill
    pub async fn get_progress(&self, skill_id: &str) -> Option<LoadingProgress> {
        let progress_map = self.skill_progress.read().await;
        progress_map.get(skill_id).cloned()
    }

    /// Load multiple skills with priority
    pub async fn load_skills(&self, skills: Vec<Skill>) -> Vec<Skill> {
        let total = skills.len();
        self.update_progress(LoadingStage::Discovery, 0, "Starting skill loading...").await;

        let mut loaded = Vec::new();

        for (index, skill) in skills.into_iter().enumerate() {
            let progress = ((index as u8 * 100) / total as u8).min(99);
            self.update_progress(LoadingStage::Loading, progress, &format!("Loading {}...", skill.id)).await;

            // Simulate successful load
            let skill_progress = LoadingProgress {
                stage: LoadingStage::Ready,
                progress: 100,
                message: "Loaded successfully".to_string(),
                skills_loaded: index + 1,
                total_skills: total,
            };

            {
                let mut sp = self.skill_progress.write().await;
                sp.insert(skill.id.clone(), skill_progress);
            }

            loaded.push(skill);
        }

        self.update_progress(LoadingStage::Ready, 100, "All skills loaded").await;

        let mut cache = self.loaded_skills.write().await;
        *cache = loaded.clone();

        loaded
    }
}

impl Default for SkillLoader {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl SkillLoaderTrait for SkillLoader {
    async fn load(&self, path: &Path) -> Result<SkillLoadResult, SkillError> {
        let start = Instant::now();
        let skill_id = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Stage 1: Discovery
        self.update_progress(LoadingStage::Discovery, 10, "Discovering skill...").await;

        // Stage 2: Parsing
        self.update_progress(LoadingStage::Parsing, 30, "Parsing SKILL.md...").await;
        let skill = match self.parser.parse_file(path).await {
            Ok(s) => s,
            Err(e) => {
                return Ok(SkillLoadResult {
                    skill_id: skill_id.clone(),
                    success: false,
                    error: Some(e.to_string()),
                    load_time_ms: start.elapsed().as_millis() as u64,
                });
            }
        };

        // Stage 3: Dependencies
        self.update_progress(LoadingStage::Dependencies, 50, "Resolving dependencies...").await;
        // Dependency resolution would happen here

        // Stage 4: Resources
        self.update_progress(LoadingStage::Resources, 80, "Loading resources...").await;
        // Resource loading would happen here

        // Stage 5: Ready
        self.update_progress(LoadingStage::Ready, 100, "Skill loaded successfully").await;

        Ok(SkillLoadResult {
            skill_id: skill.id,
            success: true,
            error: None,
            load_time_ms: start.elapsed().as_millis() as u64,
        })
    }

    async fn progress(&self) -> LoadingProgress {
        self.progress.read().await.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_loader_progress() {
        let loader = SkillLoader::new();
        let progress = loader.progress().await;

        assert_eq!(progress.stage, LoadingStage::Discovery);
        assert_eq!(progress.progress, 0);
    }
}
