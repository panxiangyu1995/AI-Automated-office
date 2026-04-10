//! JSON-RPC 2.0 编解码器

use serde::{Deserialize, Serialize};
use super::error::ProtocolError;

/// JSON-RPC 2.0 Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    /// JSON-RPC版本，必须为"2.0"
    pub jsonrpc: String,
    /// 请求ID，用于匹配响应
    pub id: Option<u64>,
    /// 请求方法名
    pub method: String,
    /// 请求参数
    pub params: Option<serde_json::Value>,
}

impl JsonRpcRequest {
    /// 创建新的请求
    pub fn new(method: impl Into<String>, params: Option<serde_json::Value>) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id: None,
            method: method.into(),
            params,
        }
    }

    /// 创建带ID的请求
    pub fn with_id(mut self, id: u64) -> Self {
        self.id = Some(id);
        self
    }
}

/// JSON-RPC 2.0 Response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    /// JSON-RPC版本，必须为"2.0"
    pub jsonrpc: String,
    /// 响应ID，与请求ID对应
    pub id: Option<u64>,
    /// 成功结果（与error互斥）
    pub result: Option<serde_json::Value>,
    /// 错误信息（与result互斥）
    pub error: Option<JsonRpcError>,
}

/// JSON-RPC 2.0 Error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    /// 错误码
    pub code: i32,
    /// 错误消息
    pub message: String,
    /// 错误详情（可选）
    pub data: Option<serde_json::Value>,
}

impl JsonRpcError {
    /// 创建新的错误
    pub fn new(code: i32, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            data: None,
        }
    }

    /// 创建带详情的错误
    pub fn with_data(mut self, data: serde_json::Value) -> Self {
        self.data = Some(data);
        self
    }

    /// 解析错误（标准错误码）
    pub fn parse_error() -> Self {
        Self::new(-32700, "Parse error - Invalid JSON was received")
    }

    pub fn invalid_request() -> Self {
        Self::new(-32600, "Invalid Request - The JSON sent is not a valid Request object")
    }

    pub fn method_not_found() -> Self {
        Self::new(-32601, "Method not found")
    }

    pub fn invalid_params() -> Self {
        Self::new(-32602, "Invalid params")
    }

    pub fn internal_error() -> Self {
        Self::new(-32603, "Internal error")
    }
}

/// JSON-RPC 编解码器
pub struct JsonRpcCodec;

impl JsonRpcCodec {
    /// 编码请求为JSON字符串
    pub fn encode_request(request: &JsonRpcRequest) -> Result<String, ProtocolError> {
        serde_json::to_string(request)
            .map_err(|e| ProtocolError::SerializationError(e.to_string()))
    }

    /// 解码JSON字符串为响应
    pub fn decode_response(json: &str) -> Result<JsonRpcResponse, ProtocolError> {
        serde_json::from_str(json)
            .map_err(|e| ProtocolError::DeserializationError(e.to_string()))
    }

    /// 解码JSON字符串为请求
    pub fn decode_request(json: &str) -> Result<JsonRpcRequest, ProtocolError> {
        serde_json::from_str(json)
            .map_err(|e| ProtocolError::DeserializationError(e.to_string()))
    }

    /// 编码响应为JSON字符串
    pub fn encode_response(response: &JsonRpcResponse) -> Result<String, ProtocolError> {
        serde_json::to_string(response)
            .map_err(|e| ProtocolError::SerializationError(e.to_string()))
    }

    /// 编码成功响应
    pub fn encode_success(id: Option<u64>, result: serde_json::Value) -> Result<String, ProtocolError> {
        let response = JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id,
            result: Some(result),
            error: None,
        };
        Self::encode_response(&response)
    }

    /// 编码错误响应
    pub fn encode_error(id: Option<u64>, error: JsonRpcError) -> Result<String, ProtocolError> {
        let response = JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(error),
        };
        Self::encode_response(&response)
    }

    /// 创建成功响应
    pub fn success(id: Option<u64>, result: serde_json::Value) -> JsonRpcResponse {
        JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id,
            result: Some(result),
            error: None,
        }
    }

    /// 创建错误响应
    pub fn error(id: Option<u64>, error: JsonRpcError) -> JsonRpcResponse {
        JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(error),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_decode_request() {
        let request = JsonRpcRequest::new("test.method", Some(serde_json::json!({"key": "value"})))
            .with_id(123);

        let json = JsonRpcCodec::encode_request(&request).unwrap();
        assert!(json.contains("\"method\":\"test.method\""));
        assert!(json.contains("\"id\":123"));

        let decoded = JsonRpcCodec::decode_request(&json).unwrap();
        assert_eq!(decoded.method, "test.method");
        assert_eq!(decoded.id, Some(123));
    }

    #[test]
    fn test_encode_decode_response() {
        let response = JsonRpcCodec::success(Some(123), serde_json::json!({"result": "ok"}));

        let json = JsonRpcCodec::encode_response(&response).unwrap();
        assert!(json.contains("\"result\":{\"result\":\"ok\"}"));

        let decoded = JsonRpcCodec::decode_response(&json).unwrap();
        assert_eq!(decoded.id, Some(123));
        assert!(decoded.result.is_some());
        assert!(decoded.error.is_none());
    }

    #[test]
    fn test_encode_error_response() {
        let error = JsonRpcError::parse_error();
        let response = JsonRpcCodec::error(None, error);

        let json = JsonRpcCodec::encode_response(&response).unwrap();
        assert!(json.contains("\"error\""));
        assert!(json.contains("-32700"));
    }

    #[test]
    fn test_jsonrpc_version() {
        let request = JsonRpcRequest::new("test", None);
        assert_eq!(request.jsonrpc, "2.0");
    }
}
