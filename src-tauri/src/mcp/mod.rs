//! MCP (Model Context Protocol) integration module.

mod client;
mod registry;
mod bridge;
mod types;

pub use client::{MCPClient, MCPClientConfig};
pub use registry::MCPServiceRegistry;
pub use bridge::MCPToolBridge;
pub use types::{
    MCPServiceConfig, MCPServiceStatus, MCPServiceInfo, MCPTransportType,
    MCPTool, MCPToolCall, MCPToolResult,
};