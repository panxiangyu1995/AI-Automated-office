//! 消息验证器

use super::codec::{JsonRpcRequest, JsonRpcResponse};
use super::error::ProtocolError;

/// 消息验证器
pub struct MessageValidator;

impl MessageValidator {
    /// 验证请求
    pub fn validate_request(request: &JsonRpcRequest) -> Result<(), ProtocolError> {
        // 验证jsonrpc版本
        if request.jsonrpc != "2.0" {
            return Err(ProtocolError::InvalidVersion);
        }
        
        // 验证method不为空
        if request.method.is_empty() {
            return Err(ProtocolError::InvalidMethod);
        }
        
        // 验证method不包含非法字符
        if request.method.contains('\0') {
            return Err(ProtocolError::InvalidMethod);
        }
        
        Ok(())
    }

    /// 验证响应
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
        
        // 如果有error，验证error结构
        if let Some(ref error) = response.error {
            if error.message.is_empty() {
                return Err(ProtocolError::InvalidResponse);
            }
        }
        
        Ok(())
    }

    /// 验证JSON字符串是否为有效JSON
    pub fn validate_json(json: &str) -> Result<(), ProtocolError> {
        if json.trim().is_empty() {
            return Err(ProtocolError::ParseError);
        }
        
        // 尝试解析为JSON
        let _: serde_json::Value = serde_json::from_str(json)
            .map_err(|_| ProtocolError::ParseError)?;
        
        Ok(())
    }

    /// 验证方法名格式
    pub fn validate_method_name(method: &str) -> Result<(), ProtocolError> {
        if method.is_empty() {
            return Err(ProtocolError::InvalidMethod);
        }
        
        // 方法名应该是有效的标识符
        // 允许字母、数字、下划线、点号、连字符
        let is_valid = method.chars().all(|c| {
            c.is_alphanumeric() || c == '_' || c == '.' || c == '-' || c == '/'
        });
        
        if !is_valid {
            return Err(ProtocolError::InvalidMethod);
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_valid_request() {
        let request = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            id: Some(1),
            method: "test.method".to_string(),
            params: Some(serde_json::json!({"key": "value"})),
        };
        
        assert!(MessageValidator::validate_request(&request).is_ok());
    }

    #[test]
    fn test_validate_invalid_version() {
        let request = JsonRpcRequest {
            jsonrpc: "1.0".to_string(),
            id: None,
            method: "test".to_string(),
            params: None,
        };
        
        assert!(matches!(
            MessageValidator::validate_request(&request),
            Err(ProtocolError::InvalidVersion)
        ));
    }

    #[test]
    fn test_validate_empty_method() {
        let request = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            id: None,
            method: "".to_string(),
            params: None,
        };
        
        assert!(matches!(
            MessageValidator::validate_request(&request),
            Err(ProtocolError::InvalidMethod)
        ));
    }

    #[test]
    fn test_validate_valid_response() {
        let response = JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id: Some(1),
            result: Some(serde_json::json!({"result": "ok"})),
            error: None,
        };
        
        assert!(MessageValidator::validate_response(&response).is_ok());
    }

    #[test]
    fn test_validate_error_response() {
        let response = JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id: Some(1),
            result: None,
            error: Some(super::super::codec::JsonRpcError {
                code: -32600,
                message: "Invalid Request".to_string(),
                data: None,
            }),
        };
        
        assert!(MessageValidator::validate_response(&response).is_ok());
    }

    #[test]
    fn test_validate_mutually_exclusive() {
        let response = JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id: Some(1),
            result: Some(serde_json::json!({"ok": true})),
            error: Some(super::super::codec::JsonRpcError {
                code: -32600,
                message: "Error".to_string(),
                data: None,
            }),
        };
        
        assert!(matches!(
            MessageValidator::validate_response(&response),
            Err(ProtocolError::InvalidResponse)
        ));
    }

    #[test]
    fn test_validate_json() {
        assert!(MessageValidator::validate_json(r#"{"key": "value"}"#).is_ok());
        assert!(MessageValidator::validate_json("invalid json").is_err());
        assert!(MessageValidator::validate_json("").is_err());
    }

    #[test]
    fn test_validate_method_name() {
        assert!(MessageValidator::validate_method_name("test").is_ok());
        assert!(MessageValidator::validate_method_name("test.method").is_ok());
        assert!(MessageValidator::validate_method_name("test_method-1").is_ok());
        assert!(MessageValidator::validate_method_name("").is_err());
        assert!(MessageValidator::validate_method_name("test method").is_err());
    }
}
