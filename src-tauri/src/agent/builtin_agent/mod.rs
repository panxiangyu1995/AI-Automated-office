//! Built-in Agent Types Module
//!
//! Provides the built-in agent type system for the main generic agent,
//! inspired by Claude Code's agent architecture.
//!
//! ## Agent Types
//!
//! - **general-purpose**: Full-featured agent with access to all tools
//! - **explore**: Read-only exploration agent for quick searches
//! - **plan**: Planning agent for architecture design (no execution)
//! - **verification**: Verification agent for adversarial testing
//!
//! ## Usage
//!
//! ```rust,ignore
//! use crate::agent::builtin_agent::{
//!     BuiltinAgentType, AgentTypeConfig, AgentConfigRegistry
//! };
//!
//! // Get configuration for explore agent
//! let registry = AgentConfigRegistry::new();
//! let explore_config = registry.get(&BuiltinAgentType::Explore).unwrap();
//!
//! // Check if a tool is allowed
//! if explore_config.is_tool_allowed("glob") {
//!     // Tool is allowed for explore agent
//! }
//! ```

pub mod builtin_agent_config;
pub mod builtin_agent_types;

