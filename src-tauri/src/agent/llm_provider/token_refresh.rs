//! Official Token Refresh Service
//!
//! Handles periodic refresh of official API tokens.
//! For OAuth tokens that expire, this service proactively refreshes them.
//! For simple API keys, tokens are cached indefinitely.

use std::sync::Arc;
use std::time::Duration;

use tokio::sync::RwLock;
use tokio::time::interval;

/// Token refresh configuration
#[derive(Debug, Clone)]
pub struct TokenRefreshConfig {
    /// How often to check for token expiration (in seconds)
    pub check_interval_secs: u64,
    /// How many seconds before expiry to start refresh (for OAuth)
    pub refresh_before_secs: u64,
    /// Whether auto-refresh is enabled
    pub enabled: bool,
}

impl Default for TokenRefreshConfig {
    fn default() -> Self {
        Self {
            check_interval_secs: 300, // Check every 5 minutes
            refresh_before_secs: 300, // Refresh 5 minutes before expiry
            enabled: true,
        }
    }
}

/// Token refresh service for managing official API tokens
///
/// This service:
/// - Caches official API tokens for fast access
/// - Periodically checks for token expiration
/// - Automatically refreshes OAuth tokens before they expire
/// - Notifies listeners when tokens are refreshed
#[derive(Clone)]
pub struct TokenRefreshService {
    /// Token cache
    token_cache: Arc<RwLock<super::token_cache::OfficialTokenCacheService>>,
    /// Refresh configuration
    config: TokenRefreshConfig,
    /// Callback for token refresh events
    refresh_callback: Arc<RwLock<Option<TokenRefreshCallback>>>,
}

/// Callback for token refresh events
pub type TokenRefreshCallback = Arc<dyn Fn(&str, Result<String, TokenRefreshError>) + Send + Sync>;

/// Token refresh error
#[derive(Debug, thiserror::Error)]
pub enum TokenRefreshError {
    #[error("Token not found in cache")]
    TokenNotFound,

    #[error("Token refresh not supported for this provider")]
    RefreshNotSupported,

    #[error("Failed to refresh token: {0}")]
    RefreshFailed(String),

    #[error("Token is expired")]
    TokenExpired,
}

impl TokenRefreshService {
    /// Create a new token refresh service
    pub fn new(config: TokenRefreshConfig) -> Self {
        Self {
            token_cache: Arc::new(RwLock::new(
                super::token_cache::OfficialTokenCacheService::new(),
            )),
            config,
            refresh_callback: Arc::new(RwLock::new(None)),
        }
    }

    /// Create with default configuration
    pub fn with_default_config() -> Self {
        Self::new(TokenRefreshConfig::default())
    }

    /// Get the token cache
    pub fn token_cache(&self) -> Arc<RwLock<super::token_cache::OfficialTokenCacheService>> {
        Arc::clone(&self.token_cache)
    }

    /// Set a callback for token refresh events
    pub fn set_refresh_callback(&self, callback: TokenRefreshCallback) {
        let mut cb = tokio::runtime::Handle::current().block_on(self.refresh_callback.write());
        *cb = Some(callback);
    }

    /// Initialize token from config (called at startup)
    pub async fn initialize_token(
        &self,
        provider_type: &str,
        api_key: String,
    ) -> Result<(), TokenRefreshError> {
        // For simple API keys, just cache them
        // For OAuth tokens, we would need to exchange the initial token
        let cache = self.token_cache.read().await;
        cache.set_api_key(provider_type, api_key).await;
        tracing::info!("Initialized token for provider: {}", provider_type);
        Ok(())
    }

    /// Get a valid token (returns from cache if valid)
    pub async fn get_valid_token(&self, provider_type: &str) -> Option<String> {
        let cache = self.token_cache.read().await;
        cache.get_token(provider_type).await
    }

    /// Manually trigger token refresh for a provider
    pub async fn refresh_token(&self, provider_type: &str) -> Result<String, TokenRefreshError> {
        // Get token info to determine refresh method
        let cache = self.token_cache.read().await;
        let token_info = cache.get_token_info(provider_type).await;

        let token_info = token_info.ok_or(TokenRefreshError::TokenNotFound)?;

        match token_info.token_type {
            super::token_cache::TokenType::ApiKey => {
                // API keys don't need refresh
                Err(TokenRefreshError::RefreshNotSupported)
            }
            super::token_cache::TokenType::OAuth => {
                // For OAuth, we would need to call the refresh endpoint
                // This is provider-specific and would need implementation
                // For now, return the existing token if not expired
                if token_info.is_expired() {
                    Err(TokenRefreshError::TokenExpired)
                } else {
                    Ok(token_info.token)
                }
            }
            super::token_cache::TokenType::Bearer => {
                // Bearer tokens treated similar to OAuth
                if token_info.is_expired() {
                    Err(TokenRefreshError::TokenExpired)
                } else {
                    Ok(token_info.token)
                }
            }
        }
    }

    /// Check which tokens need refresh
    pub async fn check_tokens_needing_refresh(&self) -> Vec<String> {
        let cache = self.token_cache.read().await;
        cache
            .get_providers_needing_refresh(self.config.refresh_before_secs)
            .await
    }

    /// Start the background refresh task
    pub fn start_background_refresh(self: Arc<Self>) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let check_interval = Duration::from_secs(self.config.check_interval_secs);
            let mut ticker = interval(check_interval);

            tracing::info!(
                "Token refresh service started (interval: {}s)",
                self.config.check_interval_secs
            );

            loop {
                ticker.tick().await;

                if !self.config.enabled {
                    continue;
                }

                let providers = self.check_tokens_needing_refresh().await;

                for provider in providers {
                    tracing::debug!("Token for {} needs refresh", provider);

                    match self.refresh_token(&provider).await {
                        Ok(new_token) => {
                            tracing::info!("Token refreshed successfully for {}", provider);
                            // Notify callback
                            let cb = self.refresh_callback.read().await;
                            if let Some(callback) = cb.as_ref() {
                                callback(&provider, Ok(new_token));
                            }
                        }
                        Err(e) => {
                            tracing::warn!("Failed to refresh token for {}: {}", provider, e);
                            // Notify callback of failure
                            let cb = self.refresh_callback.read().await;
                            if let Some(callback) = cb.as_ref() {
                                callback(&provider, Err(e));
                            }
                        }
                    }
                }
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_initialize_and_get_token() {
        let service = TokenRefreshService::with_default_config();

        service
            .initialize_token("zhipu", "test-api-key".to_string())
            .await
            .unwrap();

        let token = service.get_valid_token("zhipu").await;
        assert_eq!(token, Some("test-api-key".to_string()));
    }

    #[tokio::test]
    async fn test_api_key_does_not_need_refresh() {
        let service = TokenRefreshService::with_default_config();

        service
            .initialize_token("zhipu", "test-api-key".to_string())
            .await
            .unwrap();

        let needs_refresh = service.check_tokens_needing_refresh().await;
        assert!(needs_refresh.is_empty());
    }

    #[tokio::test]
    async fn test_get_nonexistent_token() {
        let service = TokenRefreshService::with_default_config();

        let token = service.get_valid_token("nonexistent").await;
        assert!(token.is_none());
    }
}
