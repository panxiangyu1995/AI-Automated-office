//! Office Agent Templates
//!
//! Provides pre-defined agent templates for office scenarios:
//! - `general`: Primary agent for general office tasks
//! - `specialist`: Subagent for specialized business domains
//!
//! See spec: openspec/changes/subagent-architecture-alignment/specs/subagent-template-system/spec.md

use std::collections::HashMap;

use super::config::AgentConfig;
use super::mode::AgentMode;
use super::permission::{PermissionAction, PermissionRule, Ruleset};

/// Agent template type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AgentTemplate {
    /// General office assistant (primary mode)
    General,
    /// Specialist agent (subagent mode)
    Specialist,
}

impl AgentTemplate {
    /// Get the template config
    pub fn config(&self) -> AgentTemplateInfo {
        match self {
            AgentTemplate::General => AgentTemplateInfo {
                template_type: AgentTemplate::General,
                name: "office-general".to_string(),
                display_name: "通用助手".to_string(),
                description: "适用于日常办公咨询和跨部门协调".to_string(),
                mode: AgentMode::Primary,
                default_role: "通用办公 AI 助手，负责日常对话、信息查询和跨部门协调".to_string(),
                suggested_skills: vec![
                    "对话".to_string(),
                    "搜索".to_string(),
                    "总结".to_string(),
                    "协作".to_string(),
                ],
                suggested_tools: vec![
                    "department_query".to_string(),
                    "document_read".to_string(),
                ],
                suggested_permissions: vec![
                    PermissionRule::new("department", "*", PermissionAction::Ask),
                    PermissionRule::new("document", "*", PermissionAction::Allow),
                ],
            },
            AgentTemplate::Specialist => AgentTemplateInfo {
                template_type: AgentTemplate::Specialist,
                name: "office-specialist".to_string(),
                display_name: "领域专家".to_string(),
                description: "专注特定业务领域的高级 Agent".to_string(),
                mode: AgentMode::Subagent,
                default_role: "业务领域专家，提供专业知识和深度分析".to_string(),
                suggested_skills: vec![
                    "专业知识".to_string(),
                    "领域分析".to_string(),
                    "报告生成".to_string(),
                ],
                suggested_tools: vec![
                    "full_department_access".to_string(),
                    "approval_submit".to_string(),
                ],
                suggested_permissions: vec![
                    PermissionRule::new("department", "*", PermissionAction::Allow),
                    PermissionRule::new("approval", "*", PermissionAction::Allow),
                    PermissionRule::new("document", "*", PermissionAction::Allow),
                    PermissionRule::new("employee", "*", PermissionAction::Allow),
                    PermissionRule::new("finance", "*", PermissionAction::Allow),
                    PermissionRule::new("warehouse", "*", PermissionAction::Allow),
                ],
            },
        }
    }

    /// Create an AgentConfig from this template
    pub fn to_agent_config(&self) -> AgentConfig {
        let info = self.config();

        // Build permissions HashMap from rules
        let mut permissions = HashMap::new();
        for rule in &info.suggested_permissions {
            let entry = permissions.entry(rule.operation.clone()).or_insert_with(HashMap::new);
            entry.insert(rule.pattern.clone(), format!("{:?}", rule.action).to_lowercase());
        }

        AgentConfig {
            name: info.name,
            mode: format!("{:?}", info.mode).to_lowercase(),
            description: info.description.clone(),
            prompt: info.default_role.clone(),
            skills: info.suggested_skills.clone(),
            tools: info.suggested_tools.clone(),
            mcp_tools: vec![],
            permissions,
            options: Default::default(),
        }
    }

    /// Parse from string
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "general" | "office-general" => Some(AgentTemplate::General),
            "specialist" | "office-specialist" => Some(AgentTemplate::Specialist),
            _ => None,
        }
    }
}

/// Template info for UI display
#[derive(Debug, Clone)]
pub struct AgentTemplateInfo {
    pub template_type: AgentTemplate,
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub mode: AgentMode,
    pub default_role: String,
    pub suggested_skills: Vec<String>,
    pub suggested_tools: Vec<String>,
    pub suggested_permissions: Vec<PermissionRule>,
}

/// Get all available templates
pub fn get_all_templates() -> Vec<AgentTemplate> {
    vec![AgentTemplate::General, AgentTemplate::Specialist]
}

/// Get template by name
pub fn get_template_by_name(name: &str) -> Option<AgentTemplate> {
    AgentTemplate::parse(name)
}

/// Create default office-general config
pub fn create_office_general_config() -> AgentConfig {
    AgentTemplate::General.to_agent_config()
}

/// Create default office-specialist config
pub fn create_office_specialist_config() -> AgentConfig {
    AgentTemplate::Specialist.to_agent_config()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_general_template() {
        let config = AgentTemplate::General.to_agent_config();
        assert_eq!(config.name, "office-general");
        assert_eq!(config.mode, "primary");
        assert!(!config.skills.is_empty());
    }

    #[test]
    fn test_specialist_template() {
        let config = AgentTemplate::Specialist.to_agent_config();
        assert_eq!(config.name, "office-specialist");
        assert_eq!(config.mode, "subagent");
    }

    #[test]
    fn test_template_parse() {
        assert_eq!(AgentTemplate::parse("general"), Some(AgentTemplate::General));
        assert_eq!(AgentTemplate::parse("office-specialist"), Some(AgentTemplate::Specialist));
        assert_eq!(AgentTemplate::parse("unknown"), None);
    }
}
