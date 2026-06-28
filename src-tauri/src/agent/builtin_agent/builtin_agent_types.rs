//! Built-in Agent Types Module
//!
//! Defines the built-in agent types for the main generic agent:
//! - general-purpose: Full access to all tools
//! - explore: Read-only search tools only
//! - plan: Search tools with write prohibition
//! - verification: Read-only with adversarial testing

use serde::{Deserialize, Serialize};

/// Built-in agent type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BuiltinAgentType {
    /// General purpose agent with full tool access
    GeneralPurpose,
    /// Explore agent with read-only search tools
    Explore,
    /// Plan agent for architecture design
    Plan,
    /// Verification agent for adversarial testing
    Verification,
}

impl BuiltinAgentType {
    /// Get the name of this agent type
    pub fn name(&self) -> &'static str {
        match self {
            BuiltinAgentType::GeneralPurpose => "general-purpose",
            BuiltinAgentType::Explore => "explore",
            BuiltinAgentType::Plan => "plan",
            BuiltinAgentType::Verification => "verification",
        }
    }

    /// Get a human-readable description of this agent type
    pub fn description(&self) -> &'static str {
        match self {
            BuiltinAgentType::GeneralPurpose => {
                "Full-featured agent with access to all available tools"
            }
            BuiltinAgentType::Explore => {
                "Read-only exploration agent for quick codebase searches"
            }
            BuiltinAgentType::Plan => {
                "Planning agent for software architecture design without execution"
            }
            BuiltinAgentType::Verification => {
                "Verification agent for adversarial testing and fix validation"
            }
        }
    }

    /// Get the recommended model for this agent type
    pub fn recommended_model(&self) -> &'static str {
        match self {
            BuiltinAgentType::GeneralPurpose => "inherit",
            BuiltinAgentType::Explore => "haiku",
            BuiltinAgentType::Plan => "sonnet",
            BuiltinAgentType::Verification => "sonnet",
        }
    }

    /// Check if this agent type allows tool execution (non-read-only)
    pub fn allows_execution(&self) -> bool {
        match self {
            BuiltinAgentType::GeneralPurpose => true,
            BuiltinAgentType::Explore => false,
            BuiltinAgentType::Plan => false,
            BuiltinAgentType::Verification => false,
        }
    }

    /// Check if this agent type allows write operations
    pub fn allows_write(&self) -> bool {
        match self {
            BuiltinAgentType::GeneralPurpose => true,
            BuiltinAgentType::Explore => false,
            BuiltinAgentType::Plan => false,
            BuiltinAgentType::Verification => false,
        }
    }

    /// Check if this agent type allows search operations
    pub fn allows_search(&self) -> bool {
        match self {
            BuiltinAgentType::GeneralPurpose => true,
            BuiltinAgentType::Explore => true,
            BuiltinAgentType::Plan => true,
            BuiltinAgentType::Verification => true,
        }
    }

    /// Get the priority level for this agent type (higher = more capable)
    pub fn priority(&self) -> u8 {
        match self {
            BuiltinAgentType::Verification => 1,
            BuiltinAgentType::Explore => 2,
            BuiltinAgentType::Plan => 3,
            BuiltinAgentType::GeneralPurpose => 4,
        }
    }

    /// Parse from string name
    pub fn from_name(name: &str) -> Option<Self> {
        match name {
            "general-purpose" | "general_purpose" | "generalpurpose" => {
                Some(BuiltinAgentType::GeneralPurpose)
            }
            "explore" => Some(BuiltinAgentType::Explore),
            "plan" => Some(BuiltinAgentType::Plan),
            "verification" => Some(BuiltinAgentType::Verification),
            _ => None,
        }
    }

    /// Get all available agent types
    pub fn all() -> Vec<Self> {
        vec![
            BuiltinAgentType::GeneralPurpose,
            BuiltinAgentType::Explore,
            BuiltinAgentType::Plan,
            BuiltinAgentType::Verification,
        ]
    }
}

impl std::fmt::Display for BuiltinAgentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name())
    }
}

impl Default for BuiltinAgentType {
    fn default() -> Self {
        BuiltinAgentType::GeneralPurpose
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_builtin_agent_type_name() {
        assert_eq!(BuiltinAgentType::GeneralPurpose.name(), "general-purpose");
        assert_eq!(BuiltinAgentType::Explore.name(), "explore");
        assert_eq!(BuiltinAgentType::Plan.name(), "plan");
        assert_eq!(BuiltinAgentType::Verification.name(), "verification");
    }

    #[test]
    fn test_builtin_agent_type_permissions() {
        assert!(BuiltinAgentType::GeneralPurpose.allows_execution());
        assert!(BuiltinAgentType::GeneralPurpose.allows_write());
        assert!(BuiltinAgentType::GeneralPurpose.allows_search());

        assert!(!BuiltinAgentType::Explore.allows_execution());
        assert!(!BuiltinAgentType::Explore.allows_write());
        assert!(BuiltinAgentType::Explore.allows_search());

        assert!(!BuiltinAgentType::Plan.allows_execution());
        assert!(!BuiltinAgentType::Plan.allows_write());
        assert!(BuiltinAgentType::Plan.allows_search());

        assert!(!BuiltinAgentType::Verification.allows_execution());
        assert!(!BuiltinAgentType::Verification.allows_write());
        assert!(BuiltinAgentType::Verification.allows_search());
    }

    #[test]
    fn test_builtin_agent_type_from_name() {
        assert_eq!(
            BuiltinAgentType::from_name("general-purpose"),
            Some(BuiltinAgentType::GeneralPurpose)
        );
        assert_eq!(
            BuiltinAgentType::from_name("explore"),
            Some(BuiltinAgentType::Explore)
        );
        assert_eq!(
            BuiltinAgentType::from_name("plan"),
            Some(BuiltinAgentType::Plan)
        );
        assert_eq!(
            BuiltinAgentType::from_name("verification"),
            Some(BuiltinAgentType::Verification)
        );
        assert_eq!(BuiltinAgentType::from_name("unknown"), None);
    }

    #[test]
    fn test_builtin_agent_type_priority() {
        assert!(BuiltinAgentType::GeneralPurpose.priority()
            > BuiltinAgentType::Plan.priority());
        assert!(BuiltinAgentType::Plan.priority() > BuiltinAgentType::Explore.priority());
        assert!(BuiltinAgentType::Explore.priority()
            > BuiltinAgentType::Verification.priority());
    }

    #[test]
    fn test_builtin_agent_type_serde() {
        let agent_type = BuiltinAgentType::Explore;
        let json = serde_json::to_string(&agent_type).unwrap();
        assert_eq!(json, "\"explore\"");
        let parsed: BuiltinAgentType = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, agent_type);
    }
}
