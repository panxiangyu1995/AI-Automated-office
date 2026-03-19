//! Cryptography module for local data encryption
//!
//! This module provides AES-256-GCM encryption for secure local storage.

mod local_encryptor;

pub use local_encryptor::LocalEncryptor;

#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("Key derivation error: {0}")]
    KeyDerivation(String),

    #[error("Encryption error: {0}")]
    Encryption(String),

    #[error("Decryption error: {0}")]
    Decryption(String),

    #[error("Invalid data: {0}")]
    InvalidData(String),
}
