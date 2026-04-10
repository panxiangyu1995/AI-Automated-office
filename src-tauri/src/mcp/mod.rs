//! MCP (Model Context Protocol) integration module.

mod client;
mod registry;
mod bridge;
mod types;
mod transport;
mod manager;
mod store;
mod engine;
pub mod protocol;

pub use client::{MCPClient, MCPClientConfig};
pub use registry::MCPServiceRegistry;
pub use bridge::MCPToolBridge;
pub use transport::{Transport, TransportFactory, TransportError, StdioTransport, HttpTransport, WebSocketTransport};
pub use manager::ServiceManager;
pub use store::ConfigStore;
pub use engine::PolicyEngine;
pub use protocol::{JsonRpcCodec, MessageValidator, ProtocolError};
pub use types::{
    MCPServiceConfig, MCPServiceStatus, MCPServiceInfo, MCPTransportType,
    MCPTool, MCPToolCall, MCPToolResult,
    ApprovalPolicy, PerToolApprovalConfig, AutoApproveResult,
};