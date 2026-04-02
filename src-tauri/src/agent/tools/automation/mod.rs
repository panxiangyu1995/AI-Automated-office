//! Automation tools module.
//!
//! Provides scheduled task automation capabilities.
//!
//! # Tools
//!
//! - `cron_schedule`: Schedule a new task
//! - `cron_list`: List scheduled tasks
//! - `cron_cancel`: Cancel a scheduled task
//!
//! # Architecture
//!
//! These tools integrate with a cron scheduler for task automation.
//! Tasks can be one-time or recurring.

pub mod cron_cancel;
pub mod cron_list;
pub mod cron_schedule;

use std::collections::HashMap;
use std::sync::Arc;

use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
};
use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;

/// Register all automation tools to the registry and executor map
pub fn register_automation_tools(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    // === cron_schedule ===
    let descriptor = ToolDescriptor {
        id: "cron_schedule".to_string(),
        name: "Cron Schedule".to_string(),
        description: "Schedule a task to run at specified intervals using cron expressions.".to_string(),
        category: ToolCategory::Automation,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: false,
            has_side_effects: true,
            supports_retry: false,
            estimated_duration: Some(std::time::Duration::from_millis(100)),
        },
        permissions: Some(vec!["automation:write".to_string()]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec![
                "automation".to_string(),
                "cron".to_string(),
                "schedule".to_string(),
            ],
            category: "automation".to_string(),
            subcategory: Some("cron".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::automation".to_string()),
        handler_function: Some("cron_schedule".to_string()),
    };
    registry.register(descriptor);
    executors.insert(
        "cron_schedule".to_string(),
        Arc::new(cron_schedule::CronScheduleExecutor::new()),
    );

    // === cron_list ===
    let descriptor = ToolDescriptor {
        id: "cron_list".to_string(),
        name: "Cron List".to_string(),
        description: "List all scheduled tasks with optional status filtering.".to_string(),
        category: ToolCategory::Automation,
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
            estimated_duration: Some(std::time::Duration::from_millis(50)),
        },
        permissions: Some(vec!["automation:read".to_string()]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec![
                "automation".to_string(),
                "cron".to_string(),
                "list".to_string(),
            ],
            category: "automation".to_string(),
            subcategory: Some("cron".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::automation".to_string()),
        handler_function: Some("cron_list".to_string()),
    };
    registry.register(descriptor);
    executors.insert(
        "cron_list".to_string(),
        Arc::new(cron_list::CronListExecutor::new()),
    );

    // === cron_cancel ===
    let descriptor = ToolDescriptor {
        id: "cron_cancel".to_string(),
        name: "Cron Cancel".to_string(),
        description: "Cancel a scheduled task by its ID.".to_string(),
        category: ToolCategory::Automation,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: true,
            is_read_only: false,
            has_side_effects: true,
            supports_retry: false,
            estimated_duration: Some(std::time::Duration::from_millis(50)),
        },
        permissions: Some(vec!["automation:write".to_string()]),
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec![
                "automation".to_string(),
                "cron".to_string(),
                "cancel".to_string(),
            ],
            category: "automation".to_string(),
            subcategory: Some("cron".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::automation".to_string()),
        handler_function: Some("cron_cancel".to_string()),
    };
    registry.register(descriptor);
    executors.insert(
        "cron_cancel".to_string(),
        Arc::new(cron_cancel::CronCancelExecutor::new()),
    );
}
