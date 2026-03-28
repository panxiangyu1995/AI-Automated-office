//! HEARTBEAT.md parser for checklist extraction and skip directive recognition.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// HEARTBEAT.md parse result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatMdContent {
    /// Whether to skip heartbeat
    pub skip: bool,
    /// List of check items
    pub check_items: Vec<CheckItem>,
    /// Raw content
    pub raw_content: String,
}

/// A single check item in HEARTBEAT.md
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckItem {
    /// Unique identifier
    pub id: String,
    /// Description of the check
    pub description: String,
    /// Priority level
    pub priority: CheckPriority,
    /// Current status
    pub status: CheckItemStatus,
}

/// Check item priority
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CheckPriority {
    Critical,
    High,
    Medium,
    Low,
}

impl Default for CheckPriority {
    fn default() -> Self {
        CheckPriority::Medium
    }
}

/// Check item status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CheckItemStatus {
    Pending,
    Running,
    Passed,
    Warning,
    Failed,
    Skipped,
}

impl Default for CheckItemStatus {
    fn default() -> Self {
        CheckItemStatus::Pending
    }
}

/// Parser for HEARTBEAT.md files
pub struct HeartbeatMdParser;

impl HeartbeatMdParser {
    /// Parse HEARTBEAT.md content from string
    pub fn parse(content: &str) -> HeartbeatMdContent {
        let skip = Self::check_skip_directive(content);
        let check_items = Self::parse_check_items(content);

        HeartbeatMdContent {
            skip,
            check_items,
            raw_content: content.to_string(),
        }
    }

    /// Check if the content contains skip directive
    fn check_skip_directive(content: &str) -> bool {
        content.contains("<!-- SKIP_HEARTBEAT -->")
            || content.contains("HEARTBEAT_SKIP")
            || content.contains("<!-- SKIP -->")
    }

    /// Parse check items from markdown content
    fn parse_check_items(content: &str) -> Vec<CheckItem> {
        let mut items = Vec::new();

        for line in content.lines() {
            let trimmed = line.trim();

            if trimmed.starts_with("- [") && trimmed.len() > 4 {
                let checked = trimmed.starts_with("- [x]") || trimmed.starts_with("- [X]");
                let description = trimmed
                    .trim_start_matches("- [ ]")
                    .trim_start_matches("- [x]")
                    .trim_start_matches("- [X]")
                    .trim();

                if !description.is_empty() {
                    let priority = Self::extract_priority(description);
                    let status = if checked {
                        CheckItemStatus::Passed
                    } else {
                        CheckItemStatus::Pending
                    };

                    items.push(CheckItem {
                        id: format!("check-{}", items.len() + 1),
                        description: description.to_string(),
                        priority,
                        status,
                    });
                }
            }

            if let Some(item) = items.last_mut() {
                if let Some(priority) = Self::parse_priority_tag(trimmed) {
                    item.priority = priority;
                }
            }
        }

        items
    }

    /// Extract priority from description
    fn extract_priority(description: &str) -> CheckPriority {
        Self::parse_priority_tag(description).unwrap_or_default()
    }

    /// Parse priority tag from text
    fn parse_priority_tag(text: &str) -> Option<CheckPriority> {
        let upper = text.to_uppercase();
        if upper.contains("[CRITICAL]") {
            Some(CheckPriority::Critical)
        } else if upper.contains("[HIGH]") {
            Some(CheckPriority::High)
        } else if upper.contains("[MEDIUM]") {
            Some(CheckPriority::Medium)
        } else if upper.contains("[LOW]") {
            Some(CheckPriority::Low)
        } else {
            None
        }
    }

    /// Find HEARTBEAT.md file path in workspace
    pub fn find_heartbeat_md(workspace_path: &PathBuf) -> Option<PathBuf> {
        let heartbeat_path = workspace_path.join("HEARTBEAT.md");
        if heartbeat_path.exists() {
            Some(heartbeat_path)
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_skip_directive() {
        let content = "<!-- SKIP_HEARTBEAT -->";
        let result = HeartbeatMdParser::parse(content);
        assert!(result.skip);
    }

    #[test]
    fn test_parse_check_items() {
        let content = r#"
- [ ] Check email
- [x] Review notifications
"#;
        let result = HeartbeatMdParser::parse(content);
        assert_eq!(result.check_items.len(), 2);
        assert_eq!(result.check_items[0].status, CheckItemStatus::Pending);
        assert_eq!(result.check_items[1].status, CheckItemStatus::Passed);
    }
}
