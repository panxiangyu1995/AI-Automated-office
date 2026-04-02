//! Integration tests for Profile system.
//!
//! Tests the profile-based tool filtering mechanism.

#[cfg(test)]
mod tests {
    use crate::agent::tools::profile::{
        get_tools_for_profile, is_tool_allowed_for_profile, filter_tools_by_profile,
        check_tool_access, resolve_allowed_tools, ToolProfile, ToolProfileConfig, ProfileManager,
        get_all_profile_infos,
    };
    use crate::agent::tools::descriptor::{
        ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
    };

    fn create_test_tool(id: &str) -> ToolDescriptor {
        ToolDescriptor {
            id: id.to_string(),
            name: id.to_string(),
            description: format!("Test tool: {}", id),
            category: ToolCategory::Core,
            parameters: vec![],
            return_type: None,
            execution_mode: ToolExecutionMode::Sync,
            capabilities: ToolCapabilities {
                supports_streaming: false,
                supports_cancellation: false,
                requires_permission: false,
                requires_confirmation: false,
                is_read_only: true,
                has_side_effects: false,
                supports_retry: false,
                estimated_duration: None,
            },
            permissions: None,
            dependencies: None,
            context_requirements: None,
            metadata: ToolMetadata {
                author: None,
                version: "1.0.0".to_string(),
                license: None,
                homepage: None,
                repository: None,
                tags: vec![],
                category: "test".to_string(),
                subcategory: None,
            },
            enabled: true,
            deprecated: None,
            deprecation_message: None,
            handler_module: None,
            handler_function: None,
        }
    }

    #[test]
    fn test_profile_tools_mappings() {
        // Test Minimal profile
        let minimal = get_tools_for_profile(ToolProfile::Minimal);
        assert!(minimal.contains(&"session_status"));
        assert!(minimal.contains(&"system_get_app_version"));
        assert!(!minimal.contains(&"file_read"));

        // Test Coding profile
        let coding = get_tools_for_profile(ToolProfile::Coding);
        assert!(coding.contains(&"file_read"));
        assert!(coding.contains(&"browser_interact"));
        assert!(coding.contains(&"memory_search"));
        assert!(coding.contains(&"sessions_list"));

        // Test Messaging profile
        let messaging = get_tools_for_profile(ToolProfile::Messaging);
        assert!(messaging.contains(&"sessions_list"));
        assert!(!messaging.contains(&"file_read"));

        // Test Full profile (no restrictions)
        let full = get_tools_for_profile(ToolProfile::Full);
        assert!(full.is_empty()); // Empty = allow all
    }

    #[test]
    fn test_is_tool_allowed() {
        assert!(is_tool_allowed_for_profile("session_status", ToolProfile::Minimal));
        assert!(!is_tool_allowed_for_profile("file_read", ToolProfile::Minimal));
        assert!(is_tool_allowed_for_profile("file_read", ToolProfile::Coding));
        assert!(is_tool_allowed_for_profile("file_read", ToolProfile::Full));
        assert!(is_tool_allowed_for_profile("any_tool", ToolProfile::Full)); // Full allows all
    }

    #[test]
    fn test_filter_tools_by_profile() {
        let tools = vec![
            create_test_tool("session_status"),
            create_test_tool("file_read"),
            create_test_tool("browser_interact"),
        ];

        let minimal = filter_tools_by_profile(&tools, ToolProfile::Minimal);
        assert_eq!(minimal.len(), 1);
        assert_eq!(minimal[0].id, "session_status");

        let coding = filter_tools_by_profile(&tools, ToolProfile::Coding);
        assert_eq!(coding.len(), 3); // All tools in coding profile

        let full = filter_tools_by_profile(&tools, ToolProfile::Full);
        assert_eq!(full.len(), 3); // All tools allowed in full
    }

    #[test]
    fn test_resolve_allowed_tools_with_config() {
        // Basic resolution
        let tools = resolve_allowed_tools(ToolProfile::Minimal, None);
        assert!(!tools.is_empty());
        assert!(tools.contains(&"session_status".to_string()));

        // With also_allow
        let config = ToolProfileConfig {
            also_allow: vec!["custom_tool".to_string()],
            deny: vec![],
        };
        let tools = resolve_allowed_tools(ToolProfile::Minimal, Some(&config));
        assert!(tools.contains(&"custom_tool".to_string()));
        assert!(tools.contains(&"session_status".to_string()));

        // Full profile with also_allow
        let full_tools = resolve_allowed_tools(ToolProfile::Full, Some(&config));
        assert!(full_tools.contains(&"custom_tool".to_string()));

        // Full without config
        let full_empty = resolve_allowed_tools(ToolProfile::Full, None);
        assert!(full_empty.is_empty()); // Allow all
    }

    #[test]
    fn test_check_tool_access() {
        // Basic check
        assert!(check_tool_access("session_status", ToolProfile::Minimal, None));
        assert!(!check_tool_access("file_read", ToolProfile::Minimal, None));

        // Deny takes precedence
        let config = ToolProfileConfig {
            also_allow: vec![],
            deny: vec!["session_status".to_string()],
        };
        assert!(!check_tool_access("session_status", ToolProfile::Minimal, Some(&config)));

        // Full allows all unless denied
        let config = ToolProfileConfig {
            also_allow: vec![],
            deny: vec!["secret_tool".to_string()],
        };
        assert!(check_tool_access("file_read", ToolProfile::Full, Some(&config)));
        assert!(!check_tool_access("secret_tool", ToolProfile::Full, Some(&config)));
    }

    #[test]
    fn test_profile_manager() {
        let manager = ProfileManager::new();

        // Default profile
        assert_eq!(manager.get_current_profile(), ToolProfile::Coding);

        // Set profile
        manager.set_profile(ToolProfile::Minimal);
        assert_eq!(manager.get_current_profile(), ToolProfile::Minimal);

        // Check access
        assert!(manager.check_access("session_status"));
        assert!(!manager.check_access("file_read"));

        // Get allowed tools
        let allowed = manager.get_allowed_tools();
        assert!(allowed.contains(&"session_status".to_string()));
        assert!(!allowed.contains(&"file_read".to_string()));
    }

    #[test]
    fn test_profile_info() {
        let infos = get_all_profile_infos();
        assert_eq!(infos.len(), 4);

        let coding = infos.iter().find(|i| i.id == "coding").unwrap();
        assert_eq!(coding.label, "Coding");
        assert!(coding.tool_count > 0);
    }

    #[test]
    fn test_profile_serialization() {
        // Test JSON serialization
        let profile = ToolProfile::Coding;
        let json = serde_json::to_string(&profile).unwrap();
        assert_eq!(json, "\"coding\"");

        let parsed: ToolProfile = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, ToolProfile::Coding);
    }
}
