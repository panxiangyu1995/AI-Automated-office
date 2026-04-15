//! Security scanner implementation.

use sha2::{Sha256, Digest};
use super::{MaliciousPatternMatcher, ScanResultCache, SecurityConfig};
use anyhow::Result;

/// Security scan result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SecurityScanResult {
    /// Whether the scan passed
    pub passed: bool,
    /// Security score (0-100)
    pub score: u32,
    /// Warnings found
    pub warnings: Vec<SecurityWarning>,
    /// Errors found
    pub errors: Vec<SecurityError>,
    /// Scan duration in milliseconds
    pub scan_duration_ms: u64,
    /// Scan timestamp
    pub scanned_at: i64,
}

/// Security warning types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SecurityWarning {
    /// Network access detected
    NetworkAccess { path: String },
    /// File system access detected
    FileSystemAccess { path: String },
    /// Sensitive API call
    SensitiveApi { api: String },
    /// Dynamic code execution
    DynamicCode { method: String },
}

/// Security error types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SecurityError {
    /// Malicious code pattern detected
    MaliciousPattern { pattern: String, location: String },
    /// Signature has been tampered
    TamperedSignature,
    /// Unknown source
    UnknownSource,
    /// Excessive permissions required
    ExcessivePermissions { required: Vec<String> },
    /// Suspicious behavior detected
    SuspiciousBehavior { behavior: String },
}

/// Security scanner
pub struct SecurityScanner {
    config: SecurityConfig,
    pattern_matcher: MaliciousPatternMatcher,
    cache: ScanResultCache,
}

impl SecurityScanner {
    /// Create a new security scanner
    pub fn new(config: SecurityConfig) -> Self {
        Self {
            config,
            pattern_matcher: MaliciousPatternMatcher::new(),
            cache: ScanResultCache::new(3600),
        }
    }

    /// Scan a package
    pub async fn scan(&mut self, data: &[u8], package_id: &str) -> Result<SecurityScanResult> {
        let start = std::time::Instant::now();
        let mut warnings = Vec::new();
        let mut errors = Vec::new();

        // Check cache first
        let mut hasher = Sha256::new();
        hasher.update(data);
        let content_hash = hasher.finalize();
        let hash_hex = format!("{:x}", content_hash);

        if let Some(cached) = self.cache.get(&hash_hex) {
            return Ok(cached);
        }

        // Scan for malicious patterns
        let patterns_found = self.pattern_matcher.scan(data);
        for pattern in patterns_found {
            errors.push(SecurityError::MaliciousPattern {
                pattern: pattern.clone(),
                location: "code".to_string(),
            });
        }

        // Check for suspicious strings
        let suspicious = self.check_suspicious_strings(data);
        for s in suspicious {
            warnings.push(SecurityWarning::SensitiveApi { api: s });
        }

        // Calculate score
        let score = self.calculate_score(&warnings, &errors);

        let result = SecurityScanResult {
            passed: errors.is_empty(),
            score,
            warnings,
            errors,
            scan_duration_ms: start.elapsed().as_millis() as u64,
            scanned_at: chrono::Utc::now().timestamp(),
        };

        // Cache result
        self.cache.set(hash_hex, &result);

        Ok(result)
    }

    /// Check for suspicious strings in code
    fn check_suspicious_strings(&self, data: &[u8]) -> Vec<String> {
        let mut suspicious = Vec::new();

        // Look for common suspicious patterns
        let suspicious_patterns: &[&[u8]] = &[
            b"eval(",
            b"exec(",
            b"system(",
            b"shell_exec",
            b"passthru",
            b"popen",
            b"proc_open",
        ];

        for pattern in suspicious_patterns.iter() {
            if data.windows(pattern.len()).any(|w| w == *pattern) {
                suspicious.push(String::from_utf8_lossy(pattern).to_string());
            }
        }

        suspicious
    }

    /// Calculate security score
    fn calculate_score(&self, warnings: &[SecurityWarning], errors: &[SecurityError]) -> u32 {
        let mut score: i32 = 100;

        // Deduct for warnings
        score -= warnings.len() as i32 * 5;

        // Deduct for errors
        score -= errors.len() as i32 * 20;

        score.max(0) as u32
    }
}

impl Default for SecurityScanner {
    fn default() -> Self {
        Self::new(SecurityConfig::default())
    }
}
