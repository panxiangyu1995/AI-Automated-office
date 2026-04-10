//! 协议错误类型

use std::fmt;

/// 协议层错误类型
#[derive(Debug, Clone)]
pub enum ProtocolError {
    /// 序列化错误
    SerializationError(String),
    /// 反序列化错误
    DeserializationError(String),
    /// 无效版本
    InvalidVersion,
    /// 无效方法
    InvalidMethod,
    /// 无效响应
    InvalidResponse,
    /// 验证错误
    ValidationError(String),
    /// 解析错误
    ParseError,
    /// 请求错误
    RequestError(String),
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
            ProtocolError::ParseError => write!(f, "Parse error - Invalid JSON"),
            ProtocolError::RequestError(msg) => write!(f, "Request error: {}", msg),
        }
    }
}

impl std::error::Error for ProtocolError {}

impl From<serde_json::Error> for ProtocolError {
    fn from(err: serde_json::Error) -> Self {
        ProtocolError::DeserializationError(err.to_string())
    }
}
