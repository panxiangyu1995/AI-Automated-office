//! Malicious pattern matching module.

use once_cell::sync::Lazy;
use regex::Regex;

/// Malicious pattern matcher
pub struct MaliciousPatternMatcher {
    /// Patterns to match
    patterns: Vec<MaliciousPattern>,
}

/// Malicious pattern definition
struct MaliciousPattern {
    /// Pattern name
    name: String,
    /// Regex pattern
    regex: Regex,
    /// Severity level
    severity: u8,
}

impl MaliciousPatternMatcher {
    /// Create a new pattern matcher
    pub fn new() -> Self {
        Self {
            patterns: Self::load_patterns(),
        }
    }

    /// Load known malicious patterns
    fn load_patterns() -> Vec<MaliciousPattern> {
        vec![
            // Command injection patterns
            MaliciousPattern {
                name: "command_injection_semicolon".to_string(),
                regex: Regex::new(r";\s*\w+\s*\(").unwrap(),
                severity: 9,
            },
            MaliciousPattern {
                name: "command_injection_pipe".to_string(),
                regex: Regex::new(r"\|\s*\w+").unwrap(),
                severity: 9,
            },
            MaliciousPattern {
                name: "command_injection_backtick".to_string(),
                regex: Regex::new(r"`[^`]+`").unwrap(),
                severity: 8,
            },
            MaliciousPattern {
                name: "command_injection_dollar".to_string(),
                regex: Regex::new(r"\$\([^)]+\)").unwrap(),
                severity: 8,
            },
            // Code execution patterns
            MaliciousPattern {
                name: "eval_usage".to_string(),
                regex: Regex::new(r"\beval\s*\(").unwrap(),
                severity: 7,
            },
            MaliciousPattern {
                name: "exec_usage".to_string(),
                regex: Regex::new(r"\bexec\s*\(").unwrap(),
                severity: 8,
            },
            MaliciousPattern {
                name: "system_call".to_string(),
                regex: Regex::new(r"\bsystem\s*\(").unwrap(),
                severity: 7,
            },
            // File system patterns
            MaliciousPattern {
                name: "path_traversal".to_string(),
                regex: Regex::new(r"\.\./").unwrap(),
                severity: 6,
            },
            MaliciousPattern {
                name: "sensitive_file_access".to_string(),
                regex: Regex::new(r"(/etc/passwd|/etc/shadow|\.ssh/|\.aws/)").unwrap(),
                severity: 8,
            },
            // Network patterns
            MaliciousPattern {
                name: "suspicious_url".to_string(),
                regex: Regex::new(r"https?://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+").unwrap(),
                severity: 5,
            },
            MaliciousPattern {
                name: "dns_tunneling".to_string(),
                regex: Regex::new(r"[a-zA-Z0-9]{50,}\.(com|org|net|io)").unwrap(),
                severity: 6,
            },
        ]
    }

    /// Scan data for malicious patterns
    pub fn scan(&self, data: &[u8]) -> Vec<String> {
        let mut matches = Vec::new();

        // Convert to string (lossy for binary data)
        let content = String::from_utf8_lossy(data);

        for pattern in &self.patterns {
            if pattern.regex.is_match(&content) {
                matches.push(pattern.name.clone());
            }
        }

        matches
    }
}

impl Default for MaliciousPatternMatcher {
    fn default() -> Self {
        Self::new()
    }
}
