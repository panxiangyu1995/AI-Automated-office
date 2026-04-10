# Design: MCP模块-协议层JSON-RPC抽取

## 优化前架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCPClient                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ call_tool_stdio()                                       │   │
│  │   - 序列化请求                                          │   │
│  │   - 发送JSON-RPC                                        │   │
│  │   - 反序列化响应                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 优化后架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCPClient                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ transport.call(request)                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Protocol Layer                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ JsonRpcCodec                                            │   │
│  │   + encode(request) -> String                           │   │
│  │   + decode(response) -> Result                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ MessageValidator                                         │   │
│  │   + validate_request() -> Result                         │   │
│  │   + validate_response() -> Result                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ MessageHandler                                          │   │
│  │   + handle() -> Result                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 详细设计

### 1. JsonRpcCodec

```rust
// src-tauri/src/mcp/protocol/codec.rs

use serde::{Deserialize, Serialize};
use super::error::ProtocolError;

/// JSON-RPC 2.0 Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,  // "2.0"
    pub id: Option<u64>,
    pub method: String,
    pub params: Option<serde_json::Value>,
}

/// JSON-RPC 2.0 Response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,  // "2.0"
    pub id: Option<u64>,
    pub result: Option<serde_json::Value>,
    pub error: Option<JsonRpcError>,
}

/// JSON-RPC 2.0 Error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

pub struct JsonRpcCodec;

impl JsonRpcCodec {
    pub fn encode_request(request: &JsonRpcRequest) -> Result<String, ProtocolError> {
        serde_json::to_string(request)
            .map_err(|e| ProtocolError::SerializationError(e.to_string()))
    }

    pub fn decode_response(json: &str) -> Result<JsonRpcResponse, ProtocolError> {
        serde_json::from_str(json)
            .map_err(|e| ProtocolError::DeserializationError(e.to_string()))
    }

    pub fn decode_request(json: &str) -> Result<JsonRpcRequest, ProtocolError> {
        serde_json::from_str(json)
            .map_err(|e| ProtocolError::DeserializationError(e.to_string()))
    }
}
```

### 2. MessageValidator

```rust
// src-tauri/src/mcp/protocol/validator.rs

use super::codec::{JsonRpcRequest, JsonRpcResponse};
use super::error::ProtocolError;

pub struct MessageValidator;

impl MessageValidator {
    pub fn validate_request(request: &JsonRpcRequest) -> Result<(), ProtocolError> {
        // 验证jsonrpc版本
        if request.jsonrpc != "2.0" {
            return Err(ProtocolError::InvalidVersion);
        }
        
        // 验证method不为空
        if request.method.is_empty() {
            return Err(ProtocolError::InvalidMethod);
        }
        
        Ok(())
    }

    pub fn validate_response(response: &JsonRpcResponse) -> Result<(), ProtocolError> {
        // 验证jsonrpc版本
        if response.jsonrpc != "2.0" {
            return Err(ProtocolError::InvalidVersion);
        }
        
        // result和error互斥
        if response.result.is_some() && response.error.is_some() {
            return Err(ProtocolError::InvalidResponse);
        }
        
        // result和error至少有一个
        if response.result.is_none() && response.error.is_none() {
            return Err(ProtocolError::InvalidResponse);
        }
        
        Ok(())
    }
}
```

### 3. ProtocolError

```rust
// src-tauri/src/mcp/protocol/error.rs

use std::fmt;

#[derive(Debug, Clone)]
pub enum ProtocolError {
    SerializationError(String),
    DeserializationError(String),
    InvalidVersion,
    InvalidMethod,
    InvalidResponse,
    ValidationError(String),
}

impl fmt::Display for ProtocolError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ProtocolError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            ProtocolError::DeserializationError(msg) => write!(f, "Deserialization error: {}", msg),
            ProtocolError::InvalidVersion => write!(f, "Invalid JSON-RPC version"),
            ProtocolError::InvalidMethod => write!(f, "Invalid method name"),
            ProtocolError::InvalidResponse => write!(f, "Invalid JSON-RPC response"),
            ProtocolError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
        }
    }
}
```
