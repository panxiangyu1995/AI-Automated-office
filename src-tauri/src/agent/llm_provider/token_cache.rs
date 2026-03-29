//! Official API Token Cache
//!
//! Manages caching and auto-refresh of official API tokens.
//! For simple API keys, tokens are cached indefinitely.
//! For OAuth tokens, this service handles automatic refresh when expired.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::sync::RwLock;

/// Token information with expiration tracking
#[derive(Debug, Clone)]
pub struct TokenInfo {
    /// The actual token (API key or OAuth access token)
    pub token: String,
    /// Token type (api_key, oauth, etc.)
    pub token_type: TokenType,
    /// When this token was acquired
    pub acquired_at: Instant,
    /// When this token expires (None for permanent tokens)
    pub expires_at: Option<Instant>,
    /// Original API key (for OAuth refresh)
    pub refresh_token: Option<String>,
}

impl TokenInfo {
    /// Check if token is expired
    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            Instant::now() >= expires_at
        } else {
            false
        }
    }

    /// Check if token should be refreshed (refresh before actual expiry)
    pub fn should_refresh(&self, refresh_before_seconds: u64) -> bool {
        if let Some(expires_at) = self.expires_at {
            Instant::now() + Duration::from_secs(refresh_before_seconds) >= expires_at
        } else {
            false
        }
    }

    /// Time remaining until expiry
    pub fn time_remaining(&self) -> Option<Duration> {
        self.expires_at.map(|exp| {
            let now = Instant::now();
            if exp > now {
                exp - now
            } else {
                Duration::ZERO
            }
        })
    }
}

/// Token type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenType {
    /// Simple API key (permanent)
    ApiKey,
    /// OAuth access token (may expire)
    OAuth,
    /// Bearer token
    Bearer,
}

/// Official token cache for managing platform API tokens
#[derive(Debug, Default)]
pub struct OfficialTokenCache {
    /// Tokens by provider type: provider_type -> TokenInfo
    tokens: HashMap<String, TokenInfo>,
}

impl OfficialTokenCache {
    /// Create a new token cache
    pub fn new() -> Self {
        Self {
            tokens: HashMap::new(),
        }
    }

    /// Store a token
    pub fn set_token(&mut self, provider_type: &str, token_info: TokenInfo) {
        self.tokens.insert(provider_type.to_string(), token_info);
    }

    /// Get a token (returns None if expired)
    pub fn get_token(&self, provider_type: &str) -> Option<String> {
        self.tokens.get(provider_type).and_then(|info| {
            if info.is_expired() {
                None
            } else {
                Some(info.token.clone())
            }
        })
    }

    /// Get token info
    pub fn get_token_info(&self, provider_type: &str) -> Option<&TokenInfo> {
        self.tokens.get(provider_type)
    }

    /// Check if a token exists and is valid
    pub fn has_valid_token(&self, provider_type: &str) -> bool {
        self.get_token(provider_type).is_some()
    }

    /// Remove a token
    pub fn remove_token(&mut self, provider_type: &str) {
        self.tokens.remove(provider_type);
    }

    /// Get all providers with valid tokens
    pub fn valid_providers(&self) -> Vec<String> {
        self.tokens
            .iter()
            .filter(|(_, info)| !info.is_expired())
            .map(|(provider, _)| provider.clone())
            .collect()
    }

    /// Get all tokens that need refresh
    pub fn tokens_needing_refresh(&self, refresh_before_seconds: u64) -> Vec<String> {
        self.tokens
            .iter()
            .filter(|(_, info)| info.should_refresh(refresh_before_seconds))
            .map(|(provider, _)| provider.clone())
            .collect()
    }
}

/// Thread-safe official token cache wrapper
#[derive(Debug, Clone, Default)]
pub struct OfficialTokenCacheService {
    cache: Arc<RwLock<OfficialTokenCache>>,
}

impl OfficialTokenCacheService {
    /// Create a new token cache service
    pub fn new() -> Self {
        Self {
            cache: Arc::new(RwLock::new(OfficialTokenCache::new())),
        }
    }

    /// Store a permanent API key token
    pub async fn set_api_key(&self, provider_type: &str, api_key: String) {
        let token_info = TokenInfo {
            token: api_key,
            token_type: TokenType::ApiKey,
            acquired_at: Instant::now(),
            expires_at: None,
            refresh_token: None,
        };
        let mut cache = self.cache.write().await;
        cache.set_token(provider_type, token_info);
    }

    /// Store an OAuth token with expiration
    pub async fn set_oauth_token(
        &self,
        provider_type: &str,
        access_token: String,
        expires_in_seconds: u64,
        refresh_token: Option<String>,
    ) {
        let token_info = TokenInfo {
            token: access_token,
            token_type: TokenType::OAuth,
            acquired_at: Instant::now(),
            expires_at: Some(Instant::now() + Duration::from_secs(expires_in_seconds)),
            refresh_token,
        };
        let mut cache = self.cache.write().await;
        cache.set_token(provider_type, token_info);
    }

    /// Get a valid token
    pub async fn get_token(&self, provider_type: &str) -> Option<String> {
        let cache = self.cache.read().await;
        cache.get_token(provider_type)
    }

    /// Get token info
    pub async fn get_token_info(&self, provider_type: &str) -> Option<TokenInfo> {
        let cache = self.cache.read().await;
        cache.get_token_info(provider_type).cloned()
    }

    /// Check if provider has a valid token
    pub async fn has_valid_token(&self, provider_type: &str) -> bool {
        let cache = self.cache.read().await;
        cache.has_valid_token(provider_type)
    }

    /// Get all providers that need token refresh
    pub async fn get_providers_needing_refresh(&self, refresh_before_seconds: u64) -> Vec<String> {
        let cache = self.cache.read().await;
        cache.tokens_needing_refresh(refresh_before_seconds)
    }

    /// Remove a token
    pub async fn remove_token(&self, provider_type: &str) {
        let mut cache = self.cache.write().await;
        cache.remove_token(provider_type);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_key_never_expires() {
        let token_info = TokenInfo {
            token: "test-key".to_string(),
            token_type: TokenType::ApiKey,
            acquired_at: Instant::now(),
            expires_at: None,
            refresh_token: None,
        };

        assert!(!token_info.is_expired());
        assert!(!token_info.should_refresh(60));
    }

    #[test]
    fn test_oauth_token_expires() {
        let token_info = TokenInfo {
            token: "oauth-token".to_string(),
            token_type: TokenType::OAuth,
            acquired_at: Instant::now(),
            expires_at: Some(Instant::now() + Duration::from_secs(3600)),
            refresh_token: Some("refresh".to_string()),
        };

        assert!(!token_info.is_expired());
        assert!(!token_info.should_refresh(60));
    }

    #[tokio::test]
    async fn test_token_cache() {
        let cache_service = OfficialTokenCacheService::new();

        // Set API key
        cache_service.set_api_key("zhipu", "test-key".to_string()).await;
        assert_eq!(cache_service.get_token("zhipu").await, Some("test-key".to_string()));
        assert!(cache_service.has_valid_token("zhipu").await);

        // Remove token
        cache_service.remove_token("zhipu").await;
        assert!(cache_service.get_token("zhipu").await.is_none());
    }
}
