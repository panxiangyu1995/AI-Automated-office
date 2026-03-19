//! Session cache manager
//!
//! This module manages the secure storage and retrieval of session metadata
//! using encrypted file storage.

use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::session::{SessionError, SessionMetadata, SecurityChecker};
use crate::crypto::LocalEncryptor;

/// Session cache for storing encrypted session metadata
pub struct SessionCache {
    /// Path to the cache file
    cache_path: PathBuf,
    /// Local encryptor for encryption/decryption
    encryptor: Arc<LocalEncryptor>,
    /// In-memory cache for fast access
    memory_cache: Arc<Mutex<Option<SessionMetadata>>>,
}

impl SessionCache {
    /// Create a new session cache
    ///
    /// # Arguments
    /// * `base_path` - Base directory for cache storage
    ///
    /// # Errors
    /// Returns an error if machine ID cannot be obtained or encryptor creation fails
    pub async fn new(base_path: PathBuf) -> Result<Self, SessionError> {
        // Get machine ID for encryption key derivation
        let machine_id = crate::utils::machine_id::get_machine_id()
            .map_err(|e| SessionError::MachineIdError(e.to_string()))?;

        // Create encryptor with machine-bound key
        let encryptor = LocalEncryptor::from_machine_id(&machine_id)
            .map_err(|e| SessionError::EncryptionError(e.to_string()))?;

        // Ensure cache directory exists
        let cache_dir = base_path.join("session");
        tokio::fs::create_dir_all(&cache_dir).await?;

        let cache_path = cache_dir.join("metadata.enc");

        Ok(Self {
            cache_path,
            encryptor: Arc::new(encryptor),
            memory_cache: Arc::new(Mutex::new(None)),
        })
    }

    /// Save session metadata to encrypted cache
    ///
    /// # Arguments
    /// * `metadata` - Session metadata to save
    ///
    /// # Security
    /// - Performs security check before saving
    /// - Encrypts data with AES-256-GCM
    /// - Machine-bound key prevents data theft
    pub async fn save(&self, metadata: SessionMetadata) -> Result<(), SessionError> {
        // Security check
        let check = metadata.security_check();
        if !check.is_valid {
            SecurityChecker::log_security_event(
                "session.cache.security_violation",
                &check.violations.join(", "),
            );
            return Err(SessionError::SecurityViolation(check.violations.join(", ")));
        }

        // Additional security check for forbidden fields
        if let Err(e) = SecurityChecker::validate_metadata(&metadata) {
            SecurityChecker::log_security_event(
                "session.cache.forbidden_field_attempt",
                &e,
            );
            return Err(SessionError::SecurityViolation(e));
        }

        // Serialize metadata
        let json = serde_json::to_string(&metadata)
            .map_err(|e| SessionError::SerializationError(e.to_string()))?;

        // Encrypt data
        let encrypted = self.encryptor
            .encrypt(json.as_bytes())
            .map_err(|e| SessionError::EncryptionError(e.to_string()))?;

        // Write to file
        tokio::fs::write(&self.cache_path, &encrypted).await?;

        // Update memory cache
        let mut cache = self.memory_cache.lock().await;
        *cache = Some(metadata);

        tracing::info!(
            event_type = "session.cache.save",
            result = "success",
            "Session metadata saved successfully"
        );

        Ok(())
    }

    /// Load session metadata from encrypted cache
    ///
    /// # Returns
    /// - `Ok(Some(metadata))` - Valid metadata found
    /// - `Ok(None)` - No cache or expired
    /// - `Err` - Decryption or read error
    pub async fn load(&self) -> Result<Option<SessionMetadata>, SessionError> {
        // Check memory cache first
        let mut cache = self.memory_cache.lock().await;
        if let Some(ref metadata) = *cache {
            if !metadata.is_expired() {
                return Ok(Some(metadata.clone()));
            }
        }

        // Check if file exists
        if !self.cache_path.exists() {
            return Ok(None);
        }

        // Read encrypted data
        let encrypted = tokio::fs::read(&self.cache_path).await?;

        if encrypted.is_empty() {
            return Ok(None);
        }

        // Decrypt data
        let decrypted = match self.encryptor.decrypt(&encrypted) {
            Ok(data) => data,
            Err(e) => {
                // Decryption failed - file may be corrupted or machine changed
                tracing::warn!(
                    event_type = "session.cache.decrypt_failed",
                    error = %e,
                    "Failed to decrypt session cache, clearing"
                );
                // Clear corrupted cache
                let _ = tokio::fs::remove_file(&self.cache_path).await;
                return Ok(None);
            }
        };

        // Deserialize metadata
        let metadata: SessionMetadata = match serde_json::from_slice(&decrypted) {
            Ok(m) => m,
            Err(e) => {
                tracing::warn!(
                    event_type = "session.cache.deserialize_failed",
                    error = %e,
                    "Failed to deserialize session cache, clearing"
                );
                let _ = tokio::fs::remove_file(&self.cache_path).await;
                return Ok(None);
            }
        };

        // Check if expired
        if metadata.is_expired() {
            tracing::info!(
                event_type = "session.cache.expired",
                "Session cache expired, clearing"
            );
            let _ = tokio::fs::remove_file(&self.cache_path).await;
            return Ok(None);
        }

        // Update memory cache
        *cache = Some(metadata.clone());

        Ok(Some(metadata))
    }

    /// Clear session cache
    ///
    /// Securely removes all cached session data
    pub async fn clear(&self) -> Result<(), SessionError> {
        // Clear memory cache
        let mut cache = self.memory_cache.lock().await;
        *cache = None;

        // Remove cache file
        if self.cache_path.exists() {
            // Overwrite with zeros before deleting (basic secure delete)
            let file_size = tokio::fs::metadata(&self.cache_path).await?.len();
            if file_size > 0 {
                let zeros = vec![0u8; file_size as usize];
                let _ = tokio::fs::write(&self.cache_path, &zeros).await;
            }
            tokio::fs::remove_file(&self.cache_path).await?;
        }

        tracing::info!(
            event_type = "session.cache.clear",
            result = "success",
            reason = "user_logout",
            "Session cache cleared"
        );

        Ok(())
    }

    /// Check if cache exists
    pub async fn exists(&self) -> bool {
        self.cache_path.exists()
    }

    /// Get cache file path
    pub fn cache_path(&self) -> &PathBuf {
        &self.cache_path
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_save_and_load() {
        let dir = tempdir().expect("Failed to create temp dir");
        let cache = SessionCache::new(dir.path().to_path_buf())
            .await
            .expect("Failed to create cache");

        let metadata = SessionMetadata::new(
            "user-123".to_string(),
            "testuser".to_string(),
            "tenant-456".to_string(),
            "refresh-token-xyz".to_string(),
            3600,
        );

        cache.save(metadata.clone()).await.expect("Failed to save");

        let loaded = cache.load().await.expect("Failed to load");
        assert!(loaded.is_some());
        let loaded = loaded.unwrap();
        assert_eq!(loaded.user_id, metadata.user_id);
        assert_eq!(loaded.username, metadata.username);
    }

    #[tokio::test]
    async fn test_clear() {
        let dir = tempdir().expect("Failed to create temp dir");
        let cache = SessionCache::new(dir.path().to_path_buf())
            .await
            .expect("Failed to create cache");

        let metadata = SessionMetadata::new(
            "user-123".to_string(),
            "testuser".to_string(),
            "tenant-456".to_string(),
            "refresh-token-xyz".to_string(),
            3600,
        );

        cache.save(metadata).await.expect("Failed to save");
        assert!(cache.exists().await);

        cache.clear().await.expect("Failed to clear");
        assert!(!cache.exists().await);

        let loaded = cache.load().await.expect("Failed to load");
        assert!(loaded.is_none());
    }
}
