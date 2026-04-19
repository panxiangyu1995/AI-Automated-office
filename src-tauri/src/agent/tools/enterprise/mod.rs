//! Enterprise Tools Module
//!
//! Provides enterprise-level tools for resource management, knowledge access,
//! messaging, workspace staging, and database queries.
//!
//! Modules:
//! - `resource` - Resource query and upload executors
//! - `knowledge` - Knowledge query and submit draft executors
//! - `messaging` - Message query and send executors
//! - `delegation` - Agent delegate executor
//! - `workspace` - Workspace stage change executor
//! - `database` - Database query executor

use std::collections::HashMap;
use std::sync::Arc;

use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;

pub mod database;
pub mod delegation;
pub mod knowledge;
pub mod messaging;
pub mod resource;
pub mod workspace;

pub use super::enterprise_helpers::{
    create_agent_delegate_descriptor, create_db_query_descriptor,
    create_knowledge_query_descriptor, create_knowledge_submit_draft_descriptor,
    create_message_query_descriptor, create_message_send_descriptor,
    create_resource_query_descriptor, create_resource_upload_descriptor,
    create_workspace_stage_change_descriptor,
};
pub use super::enterprise_types::{get_or_init_db_config, get_or_init_delegation_config};

/// Register all enterprise tools with the registry and executor map.
pub fn register_enterprise_tools(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    resource::register(registry, executors);
    knowledge::register(registry, executors);
    messaging::register(registry, executors);
    delegation::register(registry, executors);
    workspace::register(registry, executors);
    database::register(registry, executors);
}
