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
