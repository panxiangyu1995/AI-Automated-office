//! LLM Provider Pool
//!
//! Provides automatic failover and health checking for multiple LLM providers.

use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::interval as time_interval;

use crate::agent::llm_provider::provider_trait::{LlmProvider, LlmRequest, LlmResponse};
use crate::agent::llm_provider::LlmProviderError;

/// Provider pool for automatic failover
pub struct ProviderPool {
    /// Primary providers in priority order
    providers: Arc<RwLock<Vec<ProviderEntry>>>,
    /// Health check interval
    health_check_interval: Duration,
    /// Is health check running
    is_running: Arc<RwLock<bool>>,
}

/// A single provider entry with health status
#[derive(Clone)]
pub struct ProviderEntry {
    /// Provider name/id
    pub name: String,
    /// The provider instance (not debug-printed)
    #[doc(hidden)]
    pub provider: Arc<dyn LlmProvider>,
    /// Is currently healthy
    pub is_healthy: bool,
    /// Last health check timestamp
    pub last_check: Option<i64>,
    /// Consecutive failures
    pub failures: u32,
    /// Priority (lower = higher priority)
    pub priority: u32,
}

impl ProviderEntry {
    pub fn new(name: String, provider: Arc<dyn LlmProvider>, priority: u32) -> Self {
        Self {
            name,
            provider,
            is_healthy: true,
            last_check: None,
            failures: 0,
            priority,
        }
    }

    /// Record a successful call
    pub fn record_success(&mut self) {
        self.failures = 0;
        self.is_healthy = true;
        self.last_check = Some(chrono::Utc::now().timestamp());
    }

    /// Record a failed call
    pub fn record_failure(&mut self) {
        self.failures += 1;
        if self.failures >= 3 {
            self.is_healthy = false;
        }
    }
}

impl ProviderPool {
    /// Create a new provider pool
    pub fn new(health_check_interval: Duration) -> Self {
        Self {
            providers: Arc::new(RwLock::new(Vec::new())),
            health_check_interval,
            is_running: Arc::new(RwLock::new(false)),
        }
    }

    /// Add a provider to the pool
    pub async fn add_provider(&self, entry: ProviderEntry) {
        let mut providers = self.providers.write().await;
        providers.push(entry);
        // Sort by priority
        providers.sort_by(|a, b| a.priority.cmp(&b.priority));
    }

    /// Remove a provider from the pool
    pub async fn remove_provider(&self, name: &str) {
        let mut providers = self.providers.write().await;
        providers.retain(|p| p.name != name);
    }

    /// Get the best available provider
    pub async fn get_provider(&self) -> Option<Arc<dyn LlmProvider>> {
        let providers = self.providers.read().await;
        providers.iter().find(|p| p.is_healthy).map(|p| p.provider.clone())
    }

    /// Execute with automatic failover
    pub async fn execute_with_failover(
        &self,
        request: LlmRequest,
    ) -> Result<LlmResponse, LlmProviderError> {
        // First collect healthy providers
        let healthy_providers: Vec<(String, Arc<dyn LlmProvider>)> = {
            let providers = self.providers.read().await;
            providers.iter()
                .filter(|p| p.is_healthy)
                .map(|p| (p.name.clone(), p.provider.clone()))
                .collect()
        };
        
        let mut last_error = LlmProviderError::ProviderUnavailable("No providers available".to_string());
        
        // Try each healthy provider in order
        for (name, provider) in healthy_providers {
            match provider.complete(request.clone()).await {
                Ok(response) => {
                    // Success - record it (fire and forget)
                    let providers = self.providers.clone();
                    let name_clone = name.clone();
                    tokio::spawn(async move {
                        if let Ok(mut p) = providers.try_write() {
                            if let Some(entry) = p.iter_mut().find(|e| e.name == name_clone) {
                                entry.record_success();
                            }
                        }
                    });
                    return Ok(response);
                }
                Err(e) => {
                    // Failure - record it and try next
                    last_error = e;
                    let providers = self.providers.clone();
                    let name_clone = name.clone();
                    tokio::spawn(async move {
                        if let Ok(mut p) = providers.try_write() {
                            if let Some(entry) = p.iter_mut().find(|e| e.name == name_clone) {
                                entry.record_failure();
                            }
                        }
                    });
                    continue;
                }
            }
        }
        
        Err(last_error)
    }

    /// Record successful call for a provider
    async fn record_success(&self, name: &str) {
        let mut providers = self.providers.write().await;
        if let Some(entry) = providers.iter_mut().find(|p| p.name == name) {
            entry.record_success();
        }
    }

    /// Record failed call for a provider
    async fn record_failure(&self, name: &str) {
        let mut providers = self.providers.write().await;
        if let Some(entry) = providers.iter_mut().find(|p| p.name == name) {
            entry.record_failure();
        }
    }

    /// Perform health check on all providers
    pub async fn health_check(&self) {
        let mut providers = self.providers.write().await;
        for entry in providers.iter_mut() {
            match entry.provider.health_check().await {
                Ok(true) => {
                    entry.is_healthy = true;
                    entry.failures = 0;
                    entry.last_check = Some(chrono::Utc::now().timestamp());
                }
                Ok(false) | Err(_) => {
                    entry.record_failure();
                }
            }
        }
    }

    /// Get status of all providers
    pub async fn get_status(&self) -> Vec<ProviderStatus> {
        let providers = self.providers.read().await;
        providers.iter().map(|p| ProviderStatus {
            name: p.name.clone(),
            is_healthy: p.is_healthy,
            last_check: p.last_check,
            failures: p.failures,
            priority: p.priority,
        }).collect()
    }

    /// Start background health check
    pub async fn start_health_check(&self) {
        let mut running = self.is_running.write().await;
        if *running {
            return;
        }
        *running = true;
        drop(running);

        let providers = self.providers.clone();
        let check_interval = self.health_check_interval;
        let is_running = self.is_running.clone();

        tokio::spawn(async move {
            let mut timer = time_interval(check_interval);
            loop {
                timer.tick().await;
                
                let should_run = {
                    let r = is_running.read().await;
                    *r
                };
                
                if !should_run {
                    break;
                }

                let mut pool = providers.write().await;
                for entry in pool.iter_mut() {
                    match entry.provider.health_check().await {
                        Ok(true) => {
                            entry.is_healthy = true;
                            entry.failures = 0;
                            entry.last_check = Some(chrono::Utc::now().timestamp());
                        }
                        Ok(false) | Err(_) => {
                            entry.record_failure();
                        }
                    }
                }
            }
        });
    }

    /// Stop background health check
    pub async fn stop_health_check(&self) {
        let mut running = self.is_running.write().await;
        *running = false;
    }
}

/// Provider status for monitoring
#[derive(Debug, Clone, serde::Serialize)]
pub struct ProviderStatus {
    pub name: String,
    pub is_healthy: bool,
    pub last_check: Option<i64>,
    pub failures: u32,
    pub priority: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_provider_pool_add_remove() {
        let pool = ProviderPool::new(Duration::from_secs(60));
        
        // Note: Can't easily test without mock providers
        // This is just a structural test
        let _ = pool;
    }
}
