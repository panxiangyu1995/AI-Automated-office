//! Sessions tools module.
//!
//! Provides session management capabilities including listing, history, spawning, and yield.
//!
//! # Tools
//!
//! - `sessions_list`: List available sessions
//! - `sessions_history`: Get session history
//! - `sessions_send`: Send message to a session
//! - `sessions_spawn`: Spawn a sub-agent
//! - `sessions_yield`: Yield control to another session
//! - `session_status`: Get session status
//!
//! # Architecture
//!
//! Sessions are the primary unit of work for the Agent runtime.
//! Each session can have parent-child relationships and supports delegation.

pub mod session_status;
pub mod sessions_history;
pub mod sessions_list;
pub mod sessions_send;
pub mod sessions_spawn;
pub mod sessions_yield;

use std::collections::HashMap;
use std::sync::Arc;

use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
};
use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;

/// Register all sessions tools to the registry and executor map
pub fn register_sessions_tools(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    // === sessions_list ===
    let descriptor = ToolDescriptor {
        id: "sessions_list".to_string(),
        name: "Sessions List".to_string(),
        description: "List available sessions with optional visibility filtering.".to_string(),
        category: ToolCategory::Session,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: true,
            has_side_effects: false,
            supports_retry: false,
            estimated_duration: Some(50),
        },
        permissions: Some(vec![crate::agent::tools::descriptor::ToolPermissionRequirement {
            permission_type: "sessions:read".to_string(),
            resource: "sessions".to_string(),
            description: "Read session information".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec!["sessions".to_string(), "list".to_string()],
            category: "sessions".to_string(),
            subcategory: Some("list".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::sessions".to_string()),
        handler_function: Some("sessions_list".to_string()),
    };
    let _ = registry.register(descriptor);
    executors.insert(
        "sessions_list".to_string(),
        Arc::new(sessions_list::SessionsListExecutor::new()),
    );

    // === sessions_history ===
    let descriptor = ToolDescriptor {
        id: "sessions_history".to_string(),
        name: "Sessions History".to_string(),
        description: "Get the message history for a specific session.".to_string(),
        category: ToolCategory::Session,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: true,
            has_side_effects: false,
            supports_retry: true,
            estimated_duration: Some(100),
        },
        permissions: Some(vec![crate::agent::tools::descriptor::ToolPermissionRequirement {
            permission_type: "sessions:read".to_string(),
            resource: "sessions".to_string(),
            description: "Read session history".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec!["sessions".to_string(), "history".to_string()],
            category: "sessions".to_string(),
            subcategory: Some("history".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::sessions".to_string()),
        handler_function: Some("sessions_history".to_string()),
    };
    let _ = registry.register(descriptor);
    executors.insert(
        "sessions_history".to_string(),
        Arc::new(sessions_history::SessionsHistoryExecutor::new()),
    );

    // === sessions_send ===
    let descriptor = ToolDescriptor {
        id: "sessions_send".to_string(),
        name: "Sessions Send".to_string(),
        description: "Send a message to a specific session. Supports A2A messaging.".to_string(),
        category: ToolCategory::Session,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: true,
            is_read_only: false,
            has_side_effects: true,
            supports_retry: true,
            estimated_duration: Some(500),
        },
        permissions: Some(vec![crate::agent::tools::descriptor::ToolPermissionRequirement {
            permission_type: "sessions:write".to_string(),
            resource: "sessions".to_string(),
            description: "Send messages to sessions".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec!["sessions".to_string(), "send".to_string(), "message".to_string()],
            category: "sessions".to_string(),
            subcategory: Some("send".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::sessions".to_string()),
        handler_function: Some("sessions_send".to_string()),
    };
    let _ = registry.register(descriptor);
    executors.insert(
        "sessions_send".to_string(),
        Arc::new(sessions_send::SessionsSendExecutor::new()),
    );

    // === sessions_spawn ===
    let descriptor = ToolDescriptor {
        id: "sessions_spawn".to_string(),
        name: "Sessions Spawn".to_string(),
        description: "Spawn a sub-agent to handle a specific task. Supports TTL and tool restrictions.".to_string(),
        category: ToolCategory::Session,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: true,
            is_read_only: false,
            has_side_effects: true,
            supports_retry: false,
            estimated_duration: Some(5000),
        },
        permissions: Some(vec![crate::agent::tools::descriptor::ToolPermissionRequirement {
            permission_type: "sessions:admin".to_string(),
            resource: "sessions".to_string(),
            description: "Spawn new subagent sessions".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec!["sessions".to_string(), "spawn".to_string(), "subagent".to_string()],
            category: "sessions".to_string(),
            subcategory: Some("spawn".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::sessions".to_string()),
        handler_function: Some("sessions_spawn".to_string()),
    };
    let _ = registry.register(descriptor);
    executors.insert(
        "sessions_spawn".to_string(),
        Arc::new(sessions_spawn::SessionsSpawnExecutor::new()),
    );

    // === sessions_yield ===
    let descriptor = ToolDescriptor {
        id: "sessions_yield".to_string(),
        name: "Sessions Yield".to_string(),
        description: "Yield control to another session and optionally wait for a result.".to_string(),
        category: ToolCategory::Session,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: ToolCapabilities {
            supports_streaming: true,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: true,
            is_read_only: false,
            has_side_effects: true,
            supports_retry: false,
            estimated_duration: Some(10000),
        },
        permissions: Some(vec![crate::agent::tools::descriptor::ToolPermissionRequirement {
            permission_type: "sessions:admin".to_string(),
            resource: "sessions".to_string(),
            description: "Yield control to other sessions".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec!["sessions".to_string(), "yield".to_string(), "delegate".to_string()],
            category: "sessions".to_string(),
            subcategory: Some("yield".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::sessions".to_string()),
        handler_function: Some("sessions_yield".to_string()),
    };
    let _ = registry.register(descriptor);
    executors.insert(
        "sessions_yield".to_string(),
        Arc::new(sessions_yield::SessionsYieldExecutor::new()),
    );

    // === session_status ===
    let descriptor = ToolDescriptor {
        id: "session_status".to_string(),
        name: "Session Status".to_string(),
        description: "Get the current status of a session. Returns basic info if no ID provided.".to_string(),
        category: ToolCategory::Session,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: true,
            has_side_effects: false,
            supports_retry: false,
            estimated_duration: Some(20),
        },
        permissions: Some(vec![crate::agent::tools::descriptor::ToolPermissionRequirement {
            permission_type: "sessions:read".to_string(),
            resource: "sessions".to_string(),
            description: "Read session status".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec!["sessions".to_string(), "status".to_string()],
            category: "sessions".to_string(),
            subcategory: Some("status".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::sessions".to_string()),
        handler_function: Some("session_status".to_string()),
    };
    let _ = registry.register(descriptor);
    executors.insert(
        "session_status".to_string(),
        Arc::new(session_status::SessionStatusExecutor::new()),
    );
}
