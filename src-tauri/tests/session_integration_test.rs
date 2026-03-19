//! Integration tests for session cache flow
//!
//! These tests verify the complete session cache functionality including:
//! - Save and load flow
//! - Cache clearing
//! - Expiry handling
//! - Security checks

use ai_automated_office_lib::session::{SessionCache, SessionMetadata};
use tempfile::tempdir;

/// Create a valid session metadata for testing
fn create_test_metadata() -> SessionMetadata {
    SessionMetadata::new(
        "test-user-123".to_string(),
        "testuser".to_string(),
        "test-tenant-456".to_string(),
        "test-refresh-token-xyz".to_string(),
        3600, // 1 hour expiry
    )
}

#[tokio::test]
async fn test_save_and_load_roundtrip() {
    let dir = tempdir().expect("Failed to create temp dir");
    let cache = SessionCache::new(dir.path().to_path_buf())
        .await
        .expect("Failed to create cache");

    let metadata = create_test_metadata();
    let original_user_id = metadata.user_id.clone();
    let original_username = metadata.username.clone();

    // Save
    cache.save(metadata).await.expect("Failed to save");

    // Load
    let loaded = cache.load().await.expect("Failed to load");
    assert!(loaded.is_some());

    let loaded = loaded.unwrap();
    assert_eq!(loaded.user_id, original_user_id);
    assert_eq!(loaded.username, original_username);
}

#[tokio::test]
async fn test_clear_removes_cache() {
    let dir = tempdir().expect("Failed to create temp dir");
    let cache = SessionCache::new(dir.path().to_path_buf())
        .await
        .expect("Failed to create cache");

    // Save and verify exists
    let metadata = create_test_metadata();
    cache.save(metadata).await.expect("Failed to save");
    assert!(cache.exists().await);

    // Clear
    cache.clear().await.expect("Failed to clear");
    assert!(!cache.exists().await);

    // Verify load returns None
    let loaded = cache.load().await.expect("Failed to load");
    assert!(loaded.is_none());
}

#[tokio::test]
async fn test_expired_session_is_cleared() {
    let dir = tempdir().expect("Failed to create temp dir");
    let cache = SessionCache::new(dir.path().to_path_buf())
        .await
        .expect("Failed to create cache");

    // Create metadata that's already expired
    let mut metadata = create_test_metadata();
    metadata.expires_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
        - 1; // 1 second in the past

    // This should fail security check
    let result = cache.save(metadata).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("expired"));
}

#[tokio::test]
async fn test_multiple_saves_overwrite() {
    let dir = tempdir().expect("Failed to create temp dir");
    let cache = SessionCache::new(dir.path().to_path_buf())
        .await
        .expect("Failed to create cache");

    // First save
    let mut metadata1 = create_test_metadata();
    metadata1.username = "user1".to_string();
    cache.save(metadata1).await.expect("Failed to save first");

    // Second save (should overwrite)
    let mut metadata2 = create_test_metadata();
    metadata2.username = "user2".to_string();
    cache.save(metadata2).await.expect("Failed to save second");

    // Load should return second metadata
    let loaded = cache.load().await.expect("Failed to load").unwrap();
    assert_eq!(loaded.username, "user2");
}

#[tokio::test]
async fn test_memory_cache_fast_access() {
    let dir = tempdir().expect("Failed to create temp dir");
    let cache = SessionCache::new(dir.path().to_path_buf())
        .await
        .expect("Failed to create cache");

    let metadata = create_test_metadata();
    cache.save(metadata).await.expect("Failed to save");

    // First load reads from file
    let loaded1 = cache.load().await.expect("Failed to load first").unwrap();

    // Second load should be from memory
    let loaded2 = cache.load().await.expect("Failed to load second").unwrap();

    assert_eq!(loaded1.user_id, loaded2.user_id);
}

#[tokio::test]
async fn test_security_violation_empty_user_id() {
    let dir = tempdir().expect("Failed to create temp dir");
    let cache = SessionCache::new(dir.path().to_path_buf())
        .await
        .expect("Failed to create cache");

    let mut metadata = create_test_metadata();
    metadata.user_id = String::new();

    let result = cache.save(metadata).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("user_id"));
}

#[tokio::test]
async fn test_security_violation_empty_refresh_token() {
    let dir = tempdir().expect("Failed to create temp dir");
    let cache = SessionCache::new(dir.path().to_path_buf())
        .await
        .expect("Failed to create cache");

    let mut metadata = create_test_metadata();
    metadata.refresh_token = String::new();

    let result = cache.save(metadata).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("refresh_token"));
}

#[tokio::test]
async fn test_corrupted_file_handling() {
    let dir = tempdir().expect("Failed to create temp dir");
    let cache = SessionCache::new(dir.path().to_path_buf())
        .await
        .expect("Failed to create cache");

    // Write corrupted data directly to the cache file
    let cache_path = cache.cache_path().clone();
    tokio::fs::write(&cache_path, b"corrupted data that is not valid encrypted content")
        .await
        .expect("Failed to write corrupted data");

    // Load should handle corruption gracefully
    let loaded = cache.load().await.expect("Failed to load");
    assert!(loaded.is_none());

    // Corrupted file should be cleaned up
    assert!(!cache.exists().await);
}
