//! Skill version management.

use semver::Version;

/// Version manager for skill compatibility
pub struct VersionManager;

impl VersionManager {
    /// Create a new version manager
    pub fn new() -> Self {
        Self
    }

    /// Check if a version satisfies a constraint
    pub fn satisfies_constraint(&self, version: &str, constraint: &str) -> bool {
        // Parse version
        let version = match Version::parse(version) {
            Ok(v) => v,
            Err(_) => return false,
        };

        // Simple constraint parsing
        if constraint == "*" {
            return true;
        }

        if constraint.starts_with("^") {
            // Caret - compatible versions
            if let Ok(constraint_version) = Version::parse(&constraint[1..]) {
                return version.major == constraint_version.major
                    && version.minor >= constraint_version.minor;
            }
        }

        if constraint.starts_with("~") {
            // Tilde - patch-level changes
            if let Ok(constraint_version) = Version::parse(&constraint[1..]) {
                return version.major == constraint_version.major
                    && version.minor == constraint_version.minor
                    && version.patch >= constraint_version.patch;
            }
        }

        // Exact version
        if let Ok(constraint_version) = Version::parse(constraint) {
            return version == constraint_version;
        }

        false
    }

    /// Get latest compatible version from a list
    pub fn latest_compatible<'a>(
        &self,
        versions: &'a [&str],
        constraint: &str,
    ) -> Option<&'a str> {
        versions
            .iter()
            .filter(|v| self.satisfies_constraint(v, constraint))
            .max_by(|a, b| {
                let va = Version::parse(a).ok();
                let vb = Version::parse(b).ok();
                match (va, vb) {
                    (Some(v1), Some(v2)) => v1.cmp(&v2),
                    (Some(_), None) => std::cmp::Ordering::Less,
                    (None, Some(_)) => std::cmp::Ordering::Greater,
                    (None, None) => std::cmp::Ordering::Equal,
                }
            })
            .copied()
    }

    /// Compare two versions
    pub fn compare(&self, v1: &str, v2: &str) -> std::cmp::Ordering {
        match (Version::parse(v1), Version::parse(v2)) {
            (Ok(v1), Ok(v2)) => v1.cmp(&v2),
            (Ok(_), Err(_)) => std::cmp::Ordering::Less,
            (Err(_), Ok(_)) => std::cmp::Ordering::Greater,
            (Err(_), Err(_)) => std::cmp::Ordering::Equal,
        }
    }
}

impl Default for VersionManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exact_version() {
        let manager = VersionManager::new();
        assert!(manager.satisfies_constraint("1.0.0", "1.0.0"));
        assert!(!manager.satisfies_constraint("1.0.0", "1.0.1"));
    }

    #[test]
    fn test_caret_constraint() {
        let manager = VersionManager::new();
        assert!(manager.satisfies_constraint("1.0.0", "^1.0.0"));
        assert!(manager.satisfies_constraint("1.5.0", "^1.0.0"));
        assert!(!manager.satisfies_constraint("2.0.0", "^1.0.0"));
    }

    #[test]
    fn test_tilde_constraint() {
        let manager = VersionManager::new();
        assert!(manager.satisfies_constraint("1.0.0", "~1.0.0"));
        assert!(manager.satisfies_constraint("1.0.5", "~1.0.0"));
        assert!(!manager.satisfies_constraint("1.1.0", "~1.0.0"));
    }

    #[test]
    fn test_wildcard_constraint() {
        let manager = VersionManager::new();
        assert!(manager.satisfies_constraint("1.0.0", "*"));
        assert!(manager.satisfies_constraint("2.5.0", "*"));
    }
}
