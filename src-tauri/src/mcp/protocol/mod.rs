//! MCP Protocol Layer - JSON-RPC编解码、验证和错误处理

mod codec;
mod validator;
mod error;

pub use codec::JsonRpcCodec;
pub use validator::MessageValidator;
pub use error::ProtocolError;
