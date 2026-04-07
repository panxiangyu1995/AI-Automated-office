# MCP Service Integration

## Overview

Task 164 - MCP服务集成

## Architecture

```
MCP Clients (stdio/http/websocket)
     ↓
MCPClientManager
     ↓
MCPServiceRegistry
     ↓
MCPToolBridge → ToolSystem
```

## Components

### 1. MCPClient (`src-tauri/src/mcp/client.rs`)

Handles MCP protocol communication:
- STDIO: Process spawning and JSON-RPC over stdin/stdout
- HTTP: REST API calls with authentication
- WebSocket: Real-time bidirectional communication

### 2. MCPServiceRegistry (`src-tauri/src/mcp/registry.rs`)

Manages MCP service lifecycle:
- Service registration and configuration
- Health monitoring
- Auto-restart policies
- Resource limits

### 3. MCPToolBridge (`src-tauri/src/mcp/bridge.rs`)

Converts MCP tools to system tools:
- Tool discovery and mapping
- Permission enforcement
- Result transformation

## Tauri Commands

```rust
#[tauri::command]
pub async fn mcp_add_service(config: MCPServiceConfig) -> Result<MCPServiceInfo, String>;

#[tauri::command]
pub async fn mcp_remove_service(service_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn mcp_list_services() -> Result<Vec<MCPServiceInfo>, String>;

#[tauri::command]
pub async fn mcp_start_service(service_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn mcp_stop_service(service_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn mcp_call_tool(service_id: String, tool_name: String, args: Value) -> Result<Value, String>;

#[tauri::command]
pub async fn mcp_discover_tools(service_id: String) -> Result<Vec<ToolInfo>, String>;
```

## Status

- [x] MCP service configuration UI (`src/features/settings/components/MCPServiceConfig.tsx`)
- [x] MCP connection UI (`src/features/settings/components/MCPServiceConnection.tsx`)
- [ ] Backend MCP client implementation
- [ ] Backend MCP service registry
- [ ] Backend MCP tool bridge

## Notes

- MCP (Model Context Protocol) enables integration with external AI services
- Supports STDIO, HTTP, and WebSocket transport modes
- Tools are exposed through the unified tool system