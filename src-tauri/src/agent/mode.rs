//! Agent Mode Classification Module
//!
//! Defines agent mode types for Primary/Subagent classification:
//! - Primary: Main agent handling general office tasks, can be default
//! - Subagent: Delegated by main agent for specific business domains
//!
//! Constraints:
//! - Subagent cannot be set as default agent
//! - Subagent cannot be directly selected by user (only via routing)
//! - Hidden agents are not shown in UI
//!
//! See spec: openspec/changes/subagent-architecture-alignment/specs/subagent-mode-classification/spec.md

use serde::{Deserialize, Serialize};

/// Agent mode classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentMode {
    /// Primary agent - handles general office tasks, can be default
    Primary,
    /// Subagent - delegated by main agent for specific business
    Subagent,
}

impl std::fmt::Display for AgentMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentMode::Primary => write!(f, "primary"),
            AgentMode::Subagent => write!(f, "subagent"),
        }
    }
}

impl Default for AgentMode {
    fn default() -> Self {
        AgentMode::Primary
    }
}

impl AgentMode {
    /// Check if this mode can be set as default agent
    pub fn can_be_default(&self) -> bool {
        matches!(self, AgentMode::Primary)
    }

    /// Check if this mode can be directly selected by user
    pub fn can_be_selected(&self) -> bool {
        matches!(self, AgentMode::Primary)
    }

    /// Parse from string
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "primary" => Some(AgentMode::Primary),
            "subagent" => Some(AgentMode::Subagent),
            _ => None,
        }
    }
}

/// Agent info for registry and routing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentInfo {
    /// Agent name (unique identifier)
    pub name: String,
    /// Agent mode (primary or subagent)
    pub mode: AgentMode,
    /// Whether this is a built-in agent
    pub native: bool,
    /// Whether this agent is hidden in UI
    pub hidden: bool,
    /// Human-readable description
    pub description: String,
    /// List of skills
    #[serde(default)]
    pub skills: Vec<String>,
    /// List of tools
    #[serde(default)]
    pub tools: Vec<String>,
}

impl AgentInfo {
    /// Create a new agent info
    pub fn new(name: &str, mode: AgentMode, description: &str) -> Self {
        Self {
            name: name.to_string(),
            mode,
            native: false,
            hidden: false,
            description: description.to_string(),
            skills: Vec::new(),
            tools: Vec::new(),
        }
    }

    /// Create a primary agent
    pub fn primary(name: &str, description: &str) -> Self {
        Self::new(name, AgentMode::Primary, description)
    }

    /// Create a subagent
    pub fn subagent(name: &str, description: &str) -> Self {
        Self::new(name, AgentMode::Subagent, description)
    }

    /// Check if this agent can be set as default
    pub fn can_be_default(&self) -> bool {
        self.mode.can_be_default() && !self.hidden
    }

    /// Check if this agent should be shown in UI
    pub fn is_visible(&self) -> bool {
        !self.hidden
    }

    /// Mark agent as hidden
    pub fn with_hidden(mut self, hidden: bool) -> Self {
        self.hidden = hidden;
        self
    }

    /// Mark agent as native
    pub fn with_native(mut self, native: bool) -> Self {
        self.native = native;
        self
    }

    /// Add skills
    pub fn with_skills(mut self, skills: Vec<String>) -> Self {
        self.skills = skills;
        self
    }

    /// Add tools
    pub fn with_tools(mut self, tools: Vec<String>) -> Self {
        self.tools = tools;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_mode_default() {
        assert!(AgentMode::Primary.can_be_default());
        assert!(!AgentMode::Subagent.can_be_default());
    }

    #[test]
    fn test_agent_mode_selection() {
        assert!(AgentMode::Primary.can_be_selected());
        assert!(!AgentMode::Subagent.can_be_selected());
    }

    #[test]
    fn test_agent_mode_parse() {
        assert_eq!(AgentMode::parse("primary"), Some(AgentMode::Primary));
        assert_eq!(AgentMode::parse("PRIMARY"), Some(AgentMode::Primary));
        assert_eq!(AgentMode::parse("subagent"), Some(AgentMode::Subagent));
        assert_eq!(AgentMode::parse("unknown"), None);
    }

    #[test]
    fn test_agent_info_creation() {
        let agent = AgentInfo::primary("test-agent", "A test agent");

        assert_eq!(agent.name, "test-agent");
        assert_eq!(agent.mode, AgentMode::Primary);
        assert!(!agent.hidden);
        assert!(!agent.native);
    }

    #[test]
    fn test_agent_info_subagent() {
        let agent = AgentInfo::subagent("specialist", "A specialist agent");

        assert_eq!(agent.mode, AgentMode::Subagent);
        assert!(!agent.can_be_default()); // Subagent cannot be default
    }

    #[test]
    fn test_agent_info_hidden() {
        let agent = AgentInfo::primary("hidden-agent", "A hidden agent")
            .with_hidden(true);

        assert!(!agent.is_visible());
        assert!(!agent.can_be_default()); // Hidden agents cannot be default
    }
}
