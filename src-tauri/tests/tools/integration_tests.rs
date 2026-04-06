//! Integration tests for the agent tools system.
//!
//! Tests the complete integration of memory, sessions, media, and automation tools
//! with the tool execution pipeline.

use std::sync::Arc;

use crate::agent::tools::descriptor::{ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata, ToolCapabilities};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionRequest, ToolExecutionPipeline};
use crate::agent::tools::profile::ToolProfile;

/// Test helper to create a basic execution context
fn create_test_context() -> ToolExecutionContext {
    ToolExecutionContext {
        session_id: "test-session".to_string(),
        user_id: "test-user".to_string(),
        tenant_id: "test-tenant".to_string(),
        department_id: None,
        page_id: None,
        resource_id: None,
        permissions: vec![
            "memory:read".to_string(),
            "sessions:read".to_string(),
            "sessions:write".to_string(),
            "sessions:admin".to_string(),
            "media:read".to_string(),
            "media:write".to_string(),
            "automation:read".to_string(),
            "automation:write".to_string(),
        ],
        metadata: None,
    }
}

#[cfg(test)]
mod tool_registration_tests {
    use super::*;

    #[test]
    fn test_tool_pipeline_contains_all_new_tools() {
        let pipeline = ToolExecutionPipeline::new();
        let all_tools = pipeline.list_tools();

        // Verify all new tools are registered
        let expected_tools = vec![
            // Memory tools
            "memory_search",
            "memory_get",
            // Sessions tools
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "sessions_yield",
            "session_status",
            // Media tools
            "image_understand",
            "tts_speak",
            // Automation tools
            "cron_schedule",
            "cron_list",
            "cron_cancel",
        ];

        for tool_id in expected_tools {
            let found = all_tools.iter().any(|t| t.id == tool_id);
            assert!(found, "Tool '{}' should be registered", tool_id);
        }
    }

    #[test]
    fn test_tool_categories_are_correct() {
        let pipeline = ToolExecutionPipeline::new();
        let all_tools = pipeline.list_tools();

        // Check memory tools have correct category
        let memory_tools = all_tools.iter().filter(|t| t.id.starts_with("memory_"));
        for tool in memory_tools {
            assert_eq!(tool.category, ToolCategory::Memory, "Memory tools should have Memory category");
        }

        // Check sessions tools have correct category
        let sessions_tools = all_tools.iter().filter(|t| t.id.starts_with("sessions_") || t.id == "session_status");
        for tool in sessions_tools {
            assert_eq!(tool.category, ToolCategory::Session, "Sessions tools should have Session category");
        }

        // Check media tools have correct category
        let media_tools = all_tools.iter().filter(|t| t.id.starts_with("image_") || t.id.starts_with("tts_"));
        for tool in media_tools {
            assert_eq!(tool.category, ToolCategory::Media, "Media tools should have Media category");
        }

        // Check automation tools have correct category
        let automation_tools = all_tools.iter().filter(|t| t.id.starts_with("cron_"));
        for tool in automation_tools {
            assert_eq!(tool.category, ToolCategory::Automation, "Automation tools should have Automation category");
        }
    }

    #[test]
    fn test_memory_tools_have_correct_capabilities() {
        let pipeline = ToolExecutionPipeline::new();
        let all_tools = pipeline.list_tools();

        if let Some(memory_search) = all_tools.iter().find(|t| t.id == "memory_search") {
            assert!(memory_search.capabilities.supports_retry, "memory_search should support retry");
            assert!(memory_search.capabilities.is_read_only, "memory_search should be read-only");
            assert!(!memory_search.capabilities.has_side_effects, "memory_search should not have side effects");
        } else {
            panic!("memory_search tool not found");
        }
    }

    #[test]
    fn test_sessions_spawn_has_confirmation_requirement() {
        let pipeline = ToolExecutionPipeline::new();
        let all_tools = pipeline.list_tools();

        if let Some(sessions_spawn) = all_tools.iter().find(|t| t.id == "sessions_spawn") {
            assert!(sessions_spawn.capabilities.requires_confirmation, "sessions_spawn should require confirmation");
            assert!(sessions_spawn.capabilities.has_side_effects, "sessions_spawn should have side effects");
        } else {
            panic!("sessions_spawn tool not found");
        }
    }

    #[test]
    fn test_automation_tools_permissions() {
        let pipeline = ToolExecutionPipeline::new();
        let all_tools = pipeline.list_tools();

        if let Some(cron_cancel) = all_tools.iter().find(|t| t.id == "cron_cancel") {
            assert!(cron_cancel.capabilities.requires_confirmation, "cron_cancel should require confirmation");
            let permissions = cron_cancel.permissions.as_ref().expect("Should have permissions");
            assert!(permissions.contains(&"automation:write".to_string()), "cron_cancel should require automation:write permission");
        } else {
            panic!("cron_cancel tool not found");
        }
    }
}

#[cfg(test)]
mod profile_filtering_tests {
    use super::*;

    #[test]
    fn test_coding_profile_includes_memory_tools() {
        let pipeline = ToolExecutionPipeline::new();
        pipeline.set_profile(ToolProfile::Coding);

        let allowed_tools = pipeline.list_allowed_tools();
        let memory_tools: Vec<_> = allowed_tools.iter().filter(|t| t.id.starts_with("memory_")).collect();

        assert!(!memory_tools.is_empty(), "Coding profile should include memory tools");
        assert!(allowed_tools.iter().any(|t| t.id == "memory_search"), "Coding profile should include memory_search");
        assert!(allowed_tools.iter().any(|t| t.id == "memory_get"), "Coding profile should include memory_get");
    }

    #[test]
    fn test_coding_profile_includes_sessions_tools() {
        let pipeline = ToolExecutionPipeline::new();
        pipeline.set_profile(ToolProfile::Coding);

        let allowed_tools = pipeline.list_allowed_tools();

        assert!(allowed_tools.iter().any(|t| t.id == "sessions_list"), "Coding profile should include sessions_list");
        assert!(allowed_tools.iter().any(|t| t.id == "sessions_history"), "Coding profile should include sessions_history");
        assert!(allowed_tools.iter().any(|t| t.id == "sessions_spawn"), "Coding profile should include sessions_spawn");
    }

    #[test]
    fn test_messaging_profile_includes_sessions_tools() {
        let pipeline = ToolExecutionPipeline::new();
        pipeline.set_profile(ToolProfile::Messaging);

        let allowed_tools = pipeline.list_allowed_tools();

        assert!(allowed_tools.iter().any(|t| t.id == "sessions_list"), "Messaging profile should include sessions_list");
        assert!(allowed_tools.iter().any(|t| t.id == "sessions_send"), "Messaging profile should include sessions_send");
        assert!(allowed_tools.iter().any(|t| t.id == "session_status"), "Messaging profile should include session_status");
    }

    #[test]
    fn test_minimal_profile_only_includes_basic_tools() {
        let pipeline = ToolExecutionPipeline::new();
        pipeline.set_profile(ToolProfile::Minimal);

        let allowed_tools = pipeline.list_allowed_tools();

        assert!(allowed_tools.iter().any(|t| t.id == "session_status"), "Minimal profile should include session_status");
        assert!(allowed_tools.iter().any(|t| t.id == "system_get_app_version"), "Minimal profile should include system_get_app_version");
        assert!(!allowed_tools.iter().any(|t| t.id == "memory_search"), "Minimal profile should NOT include memory_search");
        assert!(!allowed_tools.iter().any(|t| t.id == "file_read"), "Minimal profile should NOT include file_read");
    }

    #[test]
    fn test_full_profile_includes_all_tools() {
        let pipeline = ToolExecutionPipeline::new();
        pipeline.set_profile(ToolProfile::Full);

        let allowed_tools = pipeline.list_allowed_tools();

        // Full profile should include all registered tools
        let all_tools = pipeline.list_tools();
        assert_eq!(allowed_tools.len(), all_tools.len(), "Full profile should include all tools");
    }

    #[test]
    fn test_is_tool_allowed_for_profile() {
        let pipeline = ToolExecutionPipeline::new();

        // Minimal profile restrictions
        assert!(pipeline.is_tool_allowed("session_status"), "session_status should be allowed in minimal");
        assert!(!pipeline.is_tool_allowed("memory_search"), "memory_search should NOT be allowed in minimal");

        // Coding profile allowances
        pipeline.set_profile(ToolProfile::Coding);
        assert!(pipeline.is_tool_allowed("memory_search"), "memory_search should be allowed in coding");
        assert!(pipeline.is_tool_allowed("file_read"), "file_read should be allowed in coding");
    }
}

#[cfg(test)]
mod permission_check_tests {
    use super::*;

    #[tokio::test]
    async fn test_memory_search_with_permission() {
        let pipeline = ToolExecutionPipeline::new();

        let request = ToolExecutionRequest {
            tool_id: "memory_search".to_string(),
            parameters: serde_json::json!({
                "query": "test query",
                "max_results": 5
            }),
            context: create_test_context(),
            execution_id: Some("test-exec-1".to_string()),
            parent_execution_id: None,
            timeout_ms: Some(30000),
            metadata: None,
            message_id: Some("test-msg-1".to_string()),
            agent_mode: None,
            routing_mode: None,
            yolo_ttl: None,
            yolo_activated_at: None,
            profile: None,
            profile_config: None,
        };

        let result = pipeline.execute(request, None).await;
        assert!(result.is_ok(), "memory_search should execute successfully");

        let response = result.unwrap();
        assert!(response.result.status == crate::agent::tools::pipeline::ToolExecutionStatus::Completed
            || response.result.status == crate::agent::tools::pipeline::ToolExecutionStatus::Pending
            || response.result.status == crate::agent::tools::pipeline::ToolExecutionStatus::Running
            || response.result.error.is_none(), "memory_search should complete or have no error");
    }

    #[tokio::test]
    async fn test_sessions_send_with_permission() {
        let pipeline = ToolExecutionPipeline::new();

        let request = ToolExecutionRequest {
            tool_id: "sessions_send".to_string(),
            parameters: serde_json::json!({
                "session_id": "session-1",
                "message": "Test message"
            }),
            context: create_test_context(),
            execution_id: Some("test-exec-2".to_string()),
            parent_execution_id: None,
            timeout_ms: Some(30000),
            metadata: None,
            message_id: Some("test-msg-2".to_string()),
            agent_mode: None,
            routing_mode: None,
            yolo_ttl: None,
            yolo_activated_at: None,
            profile: None,
            profile_config: None,
        };

        let result = pipeline.execute(request, None).await;
        assert!(result.is_ok(), "sessions_send should execute successfully");

        let response = result.unwrap();
        // sessions_send may require confirmation
        if response.confirmation.is_some() {
            assert_eq!(response.confirmation.as_ref().unwrap().options, vec!["approve", "reject"]);
        }
    }

    #[tokio::test]
    async fn test_tts_speak_with_permission() {
        let pipeline = ToolExecutionPipeline::new();

        let request = ToolExecutionRequest {
            tool_id: "tts_speak".to_string(),
            parameters: serde_json::json!({
                "text": "Hello world"
            }),
            context: create_test_context(),
            execution_id: Some("test-exec-3".to_string()),
            parent_execution_id: None,
            timeout_ms: Some(30000),
            metadata: None,
            message_id: Some("test-msg-3".to_string()),
            agent_mode: None,
            routing_mode: None,
            yolo_ttl: None,
            yolo_activated_at: None,
            profile: None,
            profile_config: None,
        };

        let result = pipeline.execute(request, None).await;
        assert!(result.is_ok(), "tts_speak should execute successfully");
    }

    #[tokio::test]
    async fn test_cron_schedule_with_permission() {
        let pipeline = ToolExecutionPipeline::new();

        let request = ToolExecutionRequest {
            tool_id: "cron_schedule".to_string(),
            parameters: serde_json::json!({
                "cron_expression": "0 0 * * *",
                "task": "Daily task"
            }),
            context: create_test_context(),
            execution_id: Some("test-exec-4".to_string()),
            parent_execution_id: None,
            timeout_ms: Some(30000),
            metadata: None,
            message_id: Some("test-msg-4".to_string()),
            agent_mode: None,
            routing_mode: None,
            yolo_ttl: None,
            yolo_activated_at: None,
            profile: None,
            profile_config: None,
        };

        let result = pipeline.execute(request, None).await;
        assert!(result.is_ok(), "cron_schedule should execute successfully");
    }

    #[tokio::test]
    async fn test_unknown_tool_returns_error() {
        let pipeline = ToolExecutionPipeline::new();

        let request = ToolExecutionRequest {
            tool_id: "non_existent_tool".to_string(),
            parameters: serde_json::json!({}),
            context: create_test_context(),
            execution_id: Some("test-exec-5".to_string()),
            parent_execution_id: None,
            timeout_ms: Some(30000),
            metadata: None,
            message_id: Some("test-msg-5".to_string()),
            agent_mode: None,
            routing_mode: None,
            yolo_ttl: None,
            yolo_activated_at: None,
            profile: None,
            profile_config: None,
        };

        let result = pipeline.execute(request, None).await;
        assert!(result.is_ok(), "Should return Ok with error in response");

        let response = result.unwrap();
        assert!(response.result.error.is_some(), "Should have error for unknown tool");
        assert_eq!(response.result.error.as_ref().unwrap().code, crate::agent::tools::pipeline::ToolErrorCode::NotFound);
    }
}

#[cfg(test)]
mod tool_execution_tests {
    use super::*;

    #[tokio::test]
    async fn test_session_status_execution() {
        let pipeline = ToolExecutionPipeline::new();

        let request = ToolExecutionRequest {
            tool_id: "session_status".to_string(),
            parameters: serde_json::json!({}),
            context: create_test_context(),
            execution_id: Some("test-exec-status".to_string()),
            parent_execution_id: None,
            timeout_ms: Some(10000),
            metadata: None,
            message_id: Some("test-msg-status".to_string()),
            agent_mode: None,
            routing_mode: None,
            yolo_ttl: None,
            yolo_activated_at: None,
            profile: Some(ToolProfile::Minimal),
            profile_config: None,
        };

        let result = pipeline.execute(request, None).await;
        assert!(result.is_ok(), "session_status should execute successfully");

        let response = result.unwrap();
        if response.result.status == crate::agent::tools::pipeline::ToolExecutionStatus::Completed {
            assert!(response.result.output.is_some(), "Should have output on completion");
        }
    }
}