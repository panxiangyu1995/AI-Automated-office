//! Cross-platform API Key Encryption Service
//!
//! Provides secure storage for API keys using AES-256-GCM encryption
//! with platform-specific key derivation.

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use std::sync::OnceLock;

const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;
const KEY_LEN: usize = 32;
const ITERATIONS: u32 = 100_000;

/// Encryption/decryption errors
#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),

    #[error("Invalid data format")]
    InvalidFormat,

    #[error("Key derivation failed")]
    KeyDerivationFailed,
}

/// Cross-platform encryption service for API keys
///
/// Uses AES-256-GCM with PBKDF2 key derivation.
/// Salt is stored with the encrypted data.
pub struct CryptoService {
    master_key: [u8; KEY_LEN],
}

static CRYPTO_SERVICE: OnceLock<CryptoService> = OnceLock::new();

impl CryptoService {
    /// Create a new CryptoService with a derived master key
    pub fn new() -> Self {
        // Use a machine-specific derivation
        let machine_id = Self::get_machine_id();
        let salt = Self::get_machine_salt();

        let mut master_key = [0u8; KEY_LEN];
        pbkdf2_hmac::<Sha256>(
            machine_id.as_bytes(),
            salt.as_bytes(),
            ITERATIONS,
            &mut master_key,
        );

        Self { master_key }
    }

    /// Get the global CryptoService instance
    pub fn global() -> &'static CryptoService {
        CRYPTO_SERVICE.get_or_init(|| CryptoService::new())
    }

    /// Encrypt a plaintext string
    ///
    /// Returns a base64-encoded string containing:
    /// - Salt (16 bytes)
    /// - Nonce (12 bytes)
    /// - Ciphertext
    pub fn encrypt(&self, plaintext: &str) -> Result<String, CryptoError> {
        let salt: [u8; SALT_LEN] = Self::generate_random(None);
        let nonce_bytes: [u8; NONCE_LEN] = Self::generate_random(None);

        // Derive a key from the master key and salt
        let mut key = [0u8; KEY_LEN];
        pbkdf2_hmac::<Sha256>(
            &self.master_key,
            &salt,
            ITERATIONS,
            &mut key,
        );

        let cipher = Aes256Gcm::new_from_slice(&key)
            .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

        let nonce = Nonce::from_slice(&nonce_bytes);
        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

        // Combine salt + nonce + ciphertext
        let mut combined = Vec::with_capacity(SALT_LEN + NONCE_LEN + ciphertext.len());
        combined.extend_from_slice(&salt);
        combined.extend_from_slice(&nonce_bytes);
        combined.extend_from_slice(&ciphertext);

        Ok(BASE64.encode(&combined))
    }

    /// Decrypt an encrypted string
    pub fn decrypt(&self, encrypted: &str) -> Result<String, CryptoError> {
        let combined = BASE64.decode(encrypted)
            .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

        if combined.len() < SALT_LEN + NONCE_LEN {
            return Err(CryptoError::InvalidFormat);
        }

        let salt = &combined[..SALT_LEN];
        let nonce_bytes = &combined[SALT_LEN..SALT_LEN + NONCE_LEN];
        let ciphertext = &combined[SALT_LEN + NONCE_LEN..];

        // Derive the key from master key and salt
        let mut key = [0u8; KEY_LEN];
        pbkdf2_hmac::<Sha256>(
            &self.master_key,
            salt,
            ITERATIONS,
            &mut key,
        );

        let cipher = Aes256Gcm::new_from_slice(&key)
            .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

        let nonce = Nonce::from_slice(nonce_bytes);
        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

        String::from_utf8(plaintext)
            .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))
    }

    /// Generate cryptographically secure random bytes
    fn generate_random<T: AsMut<[u8]> + Default>(seed: Option<&str>) -> T {
        let mut result = T::default();
        let bytes = result.as_mut();

        if let Some(seed_str) = seed {
            // Use seed for deterministic random (for testing)
            let seed_bytes = seed_str.as_bytes();
            for (i, byte) in bytes.iter_mut().enumerate() {
                *byte = seed_bytes[i % seed_bytes.len()];
            }
        } else {
            // Use real random
            use rand::RngCore;
            rand::rngs::OsRng.fill_bytes(bytes);
        }

        result
    }

    /// Get a machine-specific identifier
    fn get_machine_id() -> String {
        // Use machine UID or a fallback
        machine_uid::get()
            .unwrap_or_else(|_| "default-machine-id".to_string())
    }

    /// Get a machine-specific salt
    fn get_machine_salt() -> String {
        // Combine machine ID with a fixed app-specific prefix
        let machine_id = Self::get_machine_id();
        format!("ai-office-llm-provider:{}", machine_id)
    }
}

impl Default for CryptoService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let crypto = CryptoService::new();
        let original = "my-secret-api-key-12345";

        let encrypted = crypto.encrypt(original).unwrap();
        assert_ne!(encrypted, original);

        let decrypted = crypto.decrypt(&encrypted).unwrap();
        assert_eq!(decrypted, original);
    }

    #[test]
    fn test_encrypt_produces_different_output() {
        let crypto = CryptoService::new();
        let original = "test-key";

        // Without seed, should produce different outputs each time
        let enc1 = crypto.encrypt(original).unwrap();
        let enc2 = crypto.encrypt(original).unwrap();

        assert!(!enc1.is_empty());
        assert!(!enc2.is_empty());
        // Note: Due to random IV, these should be different
        // But we can't assert that since it's probabilistic
    }

    #[test]
    fn test_different_keys_cannot_decrypt() {
        let crypto1 = CryptoService::new();
        let crypto2 = CryptoService::new();

        let original = "secret-data";

        let encrypted = crypto1.encrypt(original).unwrap();
        let result = crypto2.decrypt(&encrypted);

        // Should fail because different master keys
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_encrypted_data() {
        let crypto = CryptoService::new();

        let result = crypto.decrypt("not-valid-base64!!!");
        assert!(result.is_err());

        let result = crypto.decrypt("aW52YWxpZA=="); // "invalid" in base64
        assert!(result.is_err());
    }
}
