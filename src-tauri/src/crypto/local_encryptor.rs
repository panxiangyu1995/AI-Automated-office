//! Local encryptor using AES-256-GCM
//!
//! This module provides encryption and decryption for local data storage
//! using AES-256-GCM with machine-bound key derivation.

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use sha2::Sha256;

use super::CryptoError;

/// Nonce size for AES-GCM (96 bits)
const NONCE_SIZE: usize = 12;

/// Key size for AES-256 (256 bits)
const KEY_SIZE: usize = 32;

/// Salt for key derivation (application-specific)
const SALT: &[u8] = b"ai-automated-office-session-v1";

/// PBKDF2 iterations for key derivation
const ITERATIONS: u32 = 100_000;

/// Local encryptor using AES-256-GCM
///
/// This encryptor uses a key derived from a machine identifier
/// to encrypt and decrypt data. The key binding ensures that
/// encrypted data cannot be decrypted on a different machine.
pub struct LocalEncryptor {
    cipher: Aes256Gcm,
}

impl LocalEncryptor {
    /// Create a new encryptor from a machine ID
    ///
    /// # Arguments
    /// * `machine_id` - Unique identifier for the machine
    ///
    /// # Returns
    /// A new encryptor with a derived key
    pub fn from_machine_id(machine_id: &str) -> Result<Self, CryptoError> {
        let key = Self::derive_key(machine_id);
        let cipher = Aes256Gcm::new_from_slice(&key)
            .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
        Ok(Self { cipher })
    }

    /// Derive a 256-bit key from machine ID using PBKDF2
    fn derive_key(machine_id: &str) -> [u8; KEY_SIZE] {
        let mut key = [0u8; KEY_SIZE];
        pbkdf2_hmac::<Sha256>(
            machine_id.as_bytes(),
            SALT,
            ITERATIONS,
            &mut key,
        );
        key
    }

    /// Encrypt plaintext data
    ///
    /// # Arguments
    /// * `plaintext` - Data to encrypt
    ///
    /// # Returns
    /// Encrypted data in format: Nonce (12 bytes) + Ciphertext + Tag (16 bytes)
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, CryptoError> {
        // Generate random nonce
        let mut nonce_bytes = [0u8; NONCE_SIZE];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt
        let ciphertext = self.cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| CryptoError::Encryption(e.to_string()))?;

        // Combine nonce + ciphertext
        let mut result = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend(ciphertext);

        Ok(result)
    }

    /// Decrypt encrypted data
    ///
    /// # Arguments
    /// * `encrypted` - Data encrypted by `encrypt()`
    ///
    /// # Returns
    /// Original plaintext data
    ///
    /// # Errors
    /// Returns error if:
    /// - Data is too short
    /// - Authentication tag verification fails
    /// - Wrong key (different machine)
    pub fn decrypt(&self, encrypted: &[u8]) -> Result<Vec<u8>, CryptoError> {
        if encrypted.len() < NONCE_SIZE {
            return Err(CryptoError::InvalidData("Data too short".to_string()));
        }

        // Split nonce and ciphertext
        let (nonce_bytes, ciphertext) = encrypted.split_at(NONCE_SIZE);
        let nonce = Nonce::from_slice(nonce_bytes);

        // Decrypt
        self.cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| CryptoError::Decryption(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let encryptor = LocalEncryptor::from_machine_id("test-machine-id").unwrap();
        let plaintext = b"Hello, World!";
        
        let encrypted = encryptor.encrypt(plaintext).unwrap();
        let decrypted = encryptor.decrypt(&encrypted).unwrap();
        
        assert_eq!(plaintext.as_slice(), decrypted.as_slice());
    }

    #[test]
    fn test_different_machine_ids() {
        let encryptor1 = LocalEncryptor::from_machine_id("machine-1").unwrap();
        let encryptor2 = LocalEncryptor::from_machine_id("machine-2").unwrap();
        
        let plaintext = b"Secret data";
        let encrypted = encryptor1.encrypt(plaintext).unwrap();
        
        // Should fail to decrypt with different key
        let result = encryptor2.decrypt(&encrypted);
        assert!(result.is_err());
    }

    #[test]
    fn test_nonce_randomness() {
        let encryptor = LocalEncryptor::from_machine_id("test-machine").unwrap();
        let plaintext = b"Same data";
        
        let encrypted1 = encryptor.encrypt(plaintext).unwrap();
        let encrypted2 = encryptor.encrypt(plaintext).unwrap();
        
        // Different nonces should produce different ciphertexts
        assert_ne!(encrypted1, encrypted2);
    }

    #[test]
    fn test_decrypt_too_short() {
        let encryptor = LocalEncryptor::from_machine_id("test-machine").unwrap();
        let short_data = vec![0u8; 11];
        
        let result = encryptor.decrypt(&short_data);
        assert!(result.is_err());
    }
}
