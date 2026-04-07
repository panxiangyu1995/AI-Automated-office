//! MCP (Model Context Protocol) integration module.

mod client;
mod registry;
mod bridge;
mod types;

pub use client::{MCPClient, MCPClientConfig, MCPTransport};
pub use registry::{MCPServiceRegistry, MCPService};
pub use bridge::MCPToolBridge;
pub use types::{
    MCPServiceConfig, MCPServiceStatus, MCPServiceInfo,
    MCPTool, MCPToolCall, MCPToolResult,
};