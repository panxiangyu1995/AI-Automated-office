//! Orchestration Engine
//!
//! Implements parallel and sequential orchestration for cross-department tasks.

use std::sync::Arc;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::agent::subagent::manager::SubagentManager;
use super::config::OrchestratorConfig;

/// Orchestration errors
#[derive(Error, Debug)]
pub enum OrchestrationError {
    #[error("Task decomposition failed: {0}")]
    DecompositionFailed(String),
    
    #[error("Delegation failed: {0}")]
    DelegationFailed(String),
    
    #[error("Aggregation failed: {0}")]
    AggregationFailed(String),
    
    #[error("Timeout after {0}s")]
    Timeout(u64),
    
    #[error("Max depth exceeded: {0}")]
    MaxDepthExceeded(u32),
    
    #[error("No available subagents")]
    NoSubagents,
}

/// Orchestration mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OrchestrationMode {
    /// Parallel: Execute all delegations concurrently
    Parallel,
    /// Sequential: Execute in dependency order
    Sequential,
    /// Adaptive: Automatically choose based on task
    Adaptive,
}

impl Default for OrchestrationMode {
    fn default() -> Self {
        Self::Adaptive
    }
}

/// Orchestration task
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestrationTask {
    /// Original user request
    pub request: String,
    /// Required departments
    pub departments: Vec<String>,
    /// Orchestration mode
    pub mode: OrchestrationMode,
    /// Timeout duration
    pub timeout: Duration,
    /// Maximum depth
    pub max_depth: u32,
    /// Context data
    pub context: serde_json::Value,
}

impl Default for OrchestrationTask {
    fn default() -> Self {
        Self {
            request: String::new(),
            departments: Vec::new(),
            mode: OrchestrationMode::Adaptive,
            timeout: Duration::from_secs(300),
            max_depth: 3,
            context: serde_json::json!({}),
        }
    }
}

/// Execution step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionStep {
    /// Step number
    pub step_number: u32,
    /// Target subagent
    pub subagent: String,
    /// Target department
    pub department: Option<String>,
    /// Step status
    pub status: StepStatus,
    /// Started at
    pub started_at: i64,
    /// Completed at
    pub completed_at: Option<i64>,
    /// Result
    pub result: Option<SubagentResult>,
}

/// Step status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StepStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Skipped,
}

/// Subagent result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentResult {
    /// Subagent name
    pub subagent: String,
    /// Whether successful
    pub success: bool,
    /// Output content
    pub content: String,
    /// Error message
    pub error: Option<String>,
    /// Duration in milliseconds
    pub duration_ms: u64,
    /// Metadata
    pub metadata: serde_json::Value,
}

/// Orchestration result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestrationResult {
    /// Individual subagent results
    pub results: Vec<SubagentResult>,
    /// Aggregated result
    pub aggregated: AggregatedResult,
    /// Total elapsed time in milliseconds
    pub elapsed_ms: u64,
    /// Execution steps
    pub steps: Vec<ExecutionStep>,
    /// Success status
    pub success: bool,
}

/// Aggregated result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedResult {
    /// Combined text
    pub text: String,
    /// Structured data (if any)
    pub structured: Option<serde_json::Value>,
    /// Summary
    pub summary: String,
    /// Metadata
    pub metadata: AggregationMetadata,
}

/// Aggregation metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregationMetadata {
    /// Total results count
    pub total_results: usize,
    /// Successful count
    pub successful: usize,
    /// Failed count
    pub failed: usize,
}

/// Orchestration engine
pub struct OrchestrationEngine {
    config: OrchestratorConfig,
    subagent_manager: Arc<SubagentManager>,
}

impl OrchestrationEngine {
    /// Create a new orchestration engine
    pub fn new(config: OrchestratorConfig, subagent_manager: Arc<SubagentManager>) -> Self {
        Self {
            config,
            subagent_manager,
        }
    }

    /// Execute orchestration task
    pub async fn execute(&self, task: OrchestrationTask) -> Result<OrchestrationResult, OrchestrationError> {
        let start_time = Instant::now();
        
        // Choose mode based on task
        let mode = match task.mode {
            OrchestrationMode::Adaptive => self.choose_mode(&task),
            _ => task.mode,
        };

        tracing::info!("Orchestrating task with mode: {:?}", mode);

        match mode {
            OrchestrationMode::Parallel => self.execute_parallel(task).await,
            OrchestrationMode::Sequential => self.execute_sequential(task).await,
            OrchestrationMode::Adaptive => unreachable!(),
        }.map(|mut result| {
            result.elapsed_ms = start_time.elapsed().as_millis() as u64;
            result
        })
    }

    /// Choose orchestration mode based on task
    fn choose_mode(&self, task: &OrchestrationTask) -> OrchestrationMode {
        // Multi-department tasks without dependencies -> parallel
        if task.departments.len() > 1 {
            return OrchestrationMode::Parallel;
        }
        
        // Single department or complex task -> sequential
        OrchestrationMode::Sequential
    }

    /// Execute in parallel
    async fn execute_parallel(
        &self,
        task: OrchestrationTask,
    ) -> Result<OrchestrationResult, OrchestrationError> {
        let start_time = Instant::now();
        
        // Create delegations for each department
        let delegations = self.create_delegations(&task).await?;
        
        // Execute all in parallel
        let results = self.execute_delegations_parallel(delegations).await?;
        
        // Aggregate results
        let aggregated = self.aggregate_results(&results).await?;
        
        let success = results.iter().any(|r| r.success);
        
        Ok(OrchestrationResult {
            results: results.clone(),
            aggregated,
            elapsed_ms: start_time.elapsed().as_millis() as u64,
            steps: vec![],
            success,
        })
    }

    /// Execute sequentially
    async fn execute_sequential(
        &self,
        task: OrchestrationTask,
    ) -> Result<OrchestrationResult, OrchestrationError> {
        let start_time = Instant::now();
        let mut all_results = Vec::new();
        let mut steps = Vec::new();
        
        // Create delegations
        let delegations = self.create_delegations(&task).await?;
        
        for (idx, delegation) in delegations.into_iter().enumerate() {
            let step_start = chrono::Utc::now().timestamp_millis();
            
            steps.push(ExecutionStep {
                step_number: idx as u32,
                subagent: delegation.subagent.clone(),
                department: delegation.department.clone(),
                status: StepStatus::Running,
                started_at: step_start,
                completed_at: None,
                result: None,
            });
            
            // Execute delegation
            let result = self.execute_delegation(delegation).await?;
            
            all_results.push(result.clone());
            
            // Update step
            if let Some(step) = steps.last_mut() {
                step.status = if result.success {
                    StepStatus::Completed
                } else {
                    StepStatus::Failed
                };
                step.completed_at = Some(chrono::Utc::now().timestamp_millis());
                step.result = Some(result);
            }
        }
        
        // Aggregate results
        let aggregated = self.aggregate_results(&all_results).await?;
        let success = all_results.iter().any(|r| r.success);
        
        Ok(OrchestrationResult {
            results: all_results,
            aggregated,
            elapsed_ms: start_time.elapsed().as_millis() as u64,
            steps,
            success,
        })
    }

    /// Create delegations from task
    async fn create_delegations(
        &self,
        task: &OrchestrationTask,
    ) -> Result<Vec<Delegation>, OrchestrationError> {
        let mut delegations = Vec::new();
        
        for dept in &task.departments {
            delegations.push(Delegation {
                subagent: format!("{}-agent", dept),
                department: Some(dept.clone()),
                request: task.request.clone(),
                timeout: task.timeout,
            });
        }
        
        if delegations.is_empty() {
            return Err(OrchestrationError::NoSubagents);
        }
        
        Ok(delegations)
    }

    /// Execute delegations in parallel
    async fn execute_delegations_parallel(
        &self,
        delegations: Vec<Delegation>,
    ) -> Result<Vec<SubagentResult>, OrchestrationError> {
        use tokio::sync::Semaphore;
        
        let semaphore = Arc::new(Semaphore::new(self.config.max_parallel as usize));
        
        let futures = delegations.into_iter().map(|delegation| {
            let sem = semaphore.clone();
            let engine = self;
            async move {
                let _permit = sem.acquire().await.map_err(|e| {
                    OrchestrationError::DelegationFailed(e.to_string())
                })?;
                engine.execute_delegation(delegation).await
            }
        });
        
        let results: Vec<Result<SubagentResult, OrchestrationError>> = 
            tokio::future::join_all(futures).await;
        
        results.into_iter().collect()
    }

    /// Execute single delegation
    async fn execute_delegation(
        &self,
        delegation: Delegation,
    ) -> Result<SubagentResult, OrchestrationError> {
        let start = Instant::now();
        
        // Simulate delegation (in real impl, would call subagent)
        tracing::info!("Delegating to {} for department {:?}", delegation.subagent, delegation.department);
        
        // For now, return placeholder result
        Ok(SubagentResult {
            subagent: delegation.subagent,
            success: true,
            content: format!("Completed for department: {:?}", delegation.department),
            error: None,
            duration_ms: start.elapsed().as_millis() as u64,
            metadata: serde_json::json!({}),
        })
    }

    /// Aggregate results from multiple subagents
    async fn aggregate_results(
        &self,
        results: &[SubagentResult],
    ) -> Result<AggregatedResult, OrchestrationError> {
        let successful = results.iter().filter(|r| r.success).count();
        let failed = results.len() - successful;
        
        // Combine text results
        let text = results
            .iter()
            .filter(|r| r.success)
            .map(|r| r.content.clone())
            .collect::<Vec<_>>()
            .join("\n\n");
        
        // Generate summary
        let summary = if successful > 0 {
            format!("Completed {}/{} tasks successfully", successful, results.len())
        } else {
            "All tasks failed".to_string()
        };
        
        Ok(AggregatedResult {
            text,
            structured: None,
            summary,
            metadata: AggregationMetadata {
                total_results: results.len(),
                successful,
                failed,
            },
        })
    }
}

/// Delegation struct
struct Delegation {
    subagent: String,
    department: Option<String>,
    request: String,
    timeout: Duration,
}

impl Default for OrchestrationEngine {
    fn default() -> Self {
        Self::new(OrchestratorConfig::default(), Arc::new(SubagentManager::default()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_parallel_orchestration() {
        let config = OrchestratorConfig::default();
        let manager = Arc::new(SubagentManager::default());
        let engine = OrchestrationEngine::new(config, manager);

        let task = OrchestrationTask {
            request: "Analyze department expenses".to_string(),
            departments: vec!["finance".to_string(), "sales".to_string(), "hr".to_string()],
            mode: OrchestrationMode::Parallel,
            ..Default::default()
        };

        let result = engine.execute(task).await.unwrap();
        assert_eq!(result.results.len(), 3);
        assert!(result.success);
    }

    #[tokio::test]
    async fn test_sequential_orchestration() {
        let config = OrchestratorConfig::default();
        let manager = Arc::new(SubagentManager::default());
        let engine = OrchestrationEngine::new(config, manager);

        let task = OrchestrationTask {
            request: "Process onboarding".to_string(),
            departments: vec!["hr".to_string(), "it".to_string()],
            mode: OrchestrationMode::Sequential,
            ..Default::default()
        };

        let result = engine.execute(task).await.unwrap();
        assert_eq!(result.results.len(), 2);
        assert_eq!(result.steps.len(), 2);
    }
}
