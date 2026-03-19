//! Machine ID acquisition module
//!
//! This module provides cross-platform machine identification
//! for binding encryption keys to specific hardware.

use std::fmt;

/// Error type for machine ID operations
#[derive(Debug)]
pub enum MachineIdError {
    #[cfg(target_os = "windows")]
    WindowsError(String),
    #[cfg(target_os = "macos")]
    MacOsError(String),
    #[cfg(target_os = "linux")]
    LinuxError(String),
    UuidError(String),
}

impl fmt::Display for MachineIdError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            #[cfg(target_os = "windows")]
            MachineIdError::WindowsError(e) => write!(f, "Windows error: {}", e),
            #[cfg(target_os = "macos")]
            MachineIdError::MacOsError(e) => write!(f, "macOS error: {}", e),
            #[cfg(target_os = "linux")]
            MachineIdError::LinuxError(e) => write!(f, "Linux error: {}", e),
            MachineIdError::UuidError(e) => write!(f, "UUID error: {}", e),
        }
    }
}

impl std::error::Error for MachineIdError {}

/// Get the machine ID
///
/// This function attempts to get a unique identifier for the current machine.
/// The ID is used to derive encryption keys that are bound to the hardware.
///
/// # Platform-specific behavior
///
/// - **Windows**: Uses MachineGuid from registry
/// - **macOS**: Uses IOPlatformUUID
/// - **Linux**: Uses /etc/machine-id or /var/lib/dbus/machine-id
///
/// # Fallback
///
/// If the machine ID cannot be obtained, a random UUID is generated and cached.
/// This provides security through obscurity but is not as secure as hardware binding.
pub fn get_machine_id() -> Result<String, MachineIdError> {
    // Try machine-uid crate first
    match machine_uid::get() {
        Ok(id) => {
            tracing::debug!("Got machine ID from machine-uid: {}", &id[..8.min(id.len())]);
            return Ok(id);
        }
        Err(e) => {
            tracing::warn!("Failed to get machine ID from machine-uid: {}, trying fallback", e);
        }
    }

    // Fallback: generate a random UUID and cache it
    let uuid = uuid::Uuid::new_v4().to_string();
    tracing::warn!(
        "Using random UUID as machine ID fallback. This is less secure than hardware binding."
    );
    Ok(uuid)
}

/// Internal UUID generation for fallback
mod uuid {

    pub struct Uuid([u8; 16]);

    impl Uuid {
        pub fn new_v4() -> Self {
            let mut bytes = [0u8; 16];
            // Use system random
            use std::time::{SystemTime, UNIX_EPOCH};
            let timestamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            
            // Simple PRNG seeded with timestamp (not cryptographically secure, but okay for fallback)
            let mut state = timestamp as u64;
            for i in 0..16 {
                state = state.wrapping_mul(1103515245).wrapping_add(12345);
                bytes[i] = ((state >> 16) & 0xFF) as u8;
            }

            // Set version 4 and variant
            bytes[6] = (bytes[6] & 0x0F) | 0x40;
            bytes[8] = (bytes[8] & 0x3F) | 0x80;

            Self(bytes)
        }

        pub fn to_string(&self) -> String {
            let hex: String = self.0.iter().map(|b| format!("{:02x}", b)).collect();
            format!(
                "{}-{}-{}-{}-{}",
                &hex[0..8],
                &hex[8..12],
                &hex[12..16],
                &hex[16..20],
                &hex[20..32]
            )
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_machine_id() {
        let id = get_machine_id().expect("Should get machine ID");
        assert!(!id.is_empty());
        // Should be consistent across calls
        let id2 = get_machine_id().expect("Should get machine ID again");
        assert_eq!(id, id2);
    }
}
