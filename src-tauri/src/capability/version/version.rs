//! Semantic version management.

use std::str::FromStr;

use super::super::types::*;

/// Version parsing error
#[derive(Debug, thiserror::Error)]
pub enum VersionError {
    #[error("Invalid version string: {0}")]
    InvalidVersion(String),

    #[error("Invalid version constraint: {0}")]
    InvalidConstraint(String),
}

impl SemanticVersion {
    /// Parse a version string (e.g., "1.2.3", "1.0.0-alpha", "2.1.0+build.123")
    pub fn parse(version: &str) -> Result<Self, VersionError> {
        let mut parts = version.split('+');
        let (version_part, build) = match (parts.next(), parts.next()) {
            (Some(v), Some(b)) => (v, Some(b.to_string())),
            (Some(v), None) => (v, None),
            (None, _) => return Err(VersionError::InvalidVersion(version.to_string())),
        };

        let mut pre_parts = version_part.split('-');
        let (version_part, pre_release) = match (pre_parts.next(), pre_parts.next()) {
            (Some(v), Some(p)) => (v, Some(p.to_string())),
            (Some(v), None) => (v, None),
            (None, _) => return Err(VersionError::InvalidVersion(version.to_string())),
        };

        let segments: Vec<&str> = version_part.split('.').collect();
        if segments.len() < 3 {
            return Err(VersionError::InvalidVersion(version.to_string()));
        }

        let major = segments[0]
            .parse()
            .map_err(|_| VersionError::InvalidVersion(version.to_string()))?;
        let minor = segments[1]
            .parse()
            .map_err(|_| VersionError::InvalidVersion(version.to_string()))?;
        let patch = segments[2]
            .parse()
            .map_err(|_| VersionError::InvalidVersion(version.to_string()))?;

        Ok(Self {
            major,
            minor,
            patch,
            pre_release,
            build,
        })
    }

    /// Check if this version satisfies a constraint
    pub fn is_compatible(&self, constraint: &VersionConstraint) -> bool {
        for comparator in &constraint.comparators {
            if !self.satisfies_comparator(&comparator) {
                return false;
            }
        }
        true
    }

    /// Check if version satisfies a single comparator
    fn satisfies_comparator(&self, comparator: &VersionComparator) -> bool {
        match comparator.op {
            ComparatorOp::Exact => self == &comparator.version,
            ComparatorOp::GreaterThan => *self > comparator.version,
            ComparatorOp::GreaterThanOrEqual => *self >= comparator.version,
            ComparatorOp::LessThan => *self < comparator.version,
            ComparatorOp::LessThanOrEqual => *self <= comparator.version,
            ComparatorOp::Compatible => self.is_compatible_with(&comparator.version),
            ComparatorOp::Range | ComparatorOp::Wildcard => {
                // Range and Wildcard are handled at constraint level
                true
            }
        }
    }

    /// Check caret compatibility (^1.2.3 means >=1.2.3 and <2.0.0)
    fn is_compatible_with(&self, baseline: &SemanticVersion) -> bool {
        if self.major != baseline.major {
            return self.major > baseline.major;
        }
        if self.minor != baseline.minor {
            return self.minor > baseline.minor;
        }
        self.patch >= baseline.patch
    }

    /// Bump major version
    pub fn bump_major(&self) -> Self {
        Self {
            major: self.major + 1,
            minor: 0,
            patch: 0,
            pre_release: None,
            build: None,
        }
    }

    /// Bump minor version
    pub fn bump_minor(&self) -> Self {
        Self {
            major: self.major,
            minor: self.minor + 1,
            patch: 0,
            pre_release: None,
            build: None,
        }
    }

    /// Bump patch version
    pub fn bump_patch(&self) -> Self {
        Self {
            major: self.major,
            minor: self.minor,
            patch: self.patch + 1,
            pre_release: None,
            build: None,
        }
    }

    /// Convert to string
    pub fn to_string(&self) -> String {
        let mut result = format!("{}.{}.{}", self.major, self.minor, self.patch);
        if let Some(ref pre) = self.pre_release {
            result.push('-');
            result.push_str(pre);
        }
        if let Some(ref build) = self.build {
            result.push('+');
            result.push_str(build);
        }
        result
    }
}

impl FromStr for SemanticVersion {
    type Err = VersionError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::parse(s)
    }
}

impl VersionConstraint {
    /// Parse a version constraint string (e.g., "^1.0.0", ">=2.0.0", "1.0.0 - 2.0.0")
    pub fn parse(constraint: &str) -> Result<Self, VersionError> {
        let raw = constraint.to_string();
        let mut comparators = Vec::new();

        let constraint_trimmed = constraint.trim();

        // Handle range syntax "1.0.0 - 2.0.0"
        if constraint_trimmed.contains(" - ") {
            let parts: Vec<&str> = constraint_trimmed.split(" - ").collect();
            if parts.len() == 2 {
                let start = Self::parse(parts[0].trim())?;
                let end = Self::parse(parts[1].trim())?;
                comparators.extend(start.comparators);
                comparators.extend(end.comparators);
                return Ok(Self { raw, comparators });
            }
        }

        // Handle wildcard "*"
        if constraint_trimmed == "*" {
            return Ok(Self {
                raw,
                comparators: vec![VersionComparator {
                    op: ComparatorOp::Wildcard,
                    version: SemanticVersion {
                        major: 0,
                        minor: 0,
                        patch: 0,
                        pre_release: None,
                        build: None,
                    },
                }],
            });
        }

        // Handle caret ^ prefix
        if constraint_trimmed.starts_with('^') {
            let version_str = &constraint_trimmed[1..];
            if let Ok(version) = SemanticVersion::parse(version_str) {
                comparators.push(VersionComparator {
                    op: ComparatorOp::Compatible,
                    version,
                });
                return Ok(Self { raw, comparators });
            }
        }

        // Handle tilde ~ prefix
        if constraint_trimmed.starts_with('~') {
            let version_str = &constraint_trimmed[1..];
            if let Ok(version) = SemanticVersion::parse(version_str) {
                comparators.push(VersionComparator {
                    op: ComparatorOp::GreaterThanOrEqual,
                    version: version.clone(),
                });
                comparators.push(VersionComparator {
                    op: ComparatorOp::LessThan,
                    version: version.bump_minor(),
                });
                return Ok(Self { raw, comparators });
            }
        }

        // Handle comparison operators
        for op_str in [">=", "<=", ">", "<", "=", "~"] {
            if let Some(rest) = constraint_trimmed.strip_prefix(op_str) {
                if let Ok(version) = SemanticVersion::parse(rest.trim()) {
                    let op = match op_str {
                        ">=" => ComparatorOp::GreaterThanOrEqual,
                        "<=" => ComparatorOp::LessThanOrEqual,
                        ">" => ComparatorOp::GreaterThan,
                        "<" => ComparatorOp::LessThan,
                        "=" => ComparatorOp::Exact,
                        "~" => ComparatorOp::Compatible,
                        _ => ComparatorOp::Exact,
                    };
                    comparators.push(VersionComparator { op, version });
                    return Ok(Self { raw, comparators });
                }
            }
        }

        // Try exact version
        if let Ok(version) = SemanticVersion::parse(constraint_trimmed) {
            comparators.push(VersionComparator {
                op: ComparatorOp::Exact,
                version,
            });
            return Ok(Self { raw, comparators });
        }

        Err(VersionError::InvalidConstraint(constraint.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_version() {
        let v = SemanticVersion::parse("1.2.3").unwrap();
        assert_eq!(v.major, 1);
        assert_eq!(v.minor, 2);
        assert_eq!(v.patch, 3);
        assert_eq!(v.pre_release, None);
        assert_eq!(v.build, None);
    }

    #[test]
    fn test_parse_version_with_pre_release() {
        let v = SemanticVersion::parse("1.0.0-alpha").unwrap();
        assert_eq!(v.major, 1);
        assert_eq!(v.pre_release, Some("alpha".to_string()));
    }

    #[test]
    fn test_bump_versions() {
        let v = SemanticVersion::parse("1.2.3").unwrap();
        assert_eq!(v.bump_major().to_string(), "2.0.0");
        assert_eq!(v.bump_minor().to_string(), "1.3.0");
        assert_eq!(v.bump_patch().to_string(), "1.2.4");
    }

    #[test]
    fn test_constraint_compatible() {
        let v = SemanticVersion::parse("1.2.0").unwrap();
        let constraint = VersionConstraint::parse("^1.0.0").unwrap();
        assert!(v.is_compatible(&constraint));
    }
}
