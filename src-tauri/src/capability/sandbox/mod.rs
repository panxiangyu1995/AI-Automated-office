//! Sandbox execution module.
//!
//! This module implements:
//! - Process-level sandbox isolation
//! - WASM sandbox for untrusted code
//! - Resource limits (CPU, memory, network)

mod process;
mod wasm;
mod config;

pub use process::{ProcessSandbox, ProcessSandboxConfig};
pub use wasm::{WasmSandbox, WasmSandboxConfig};
pub use config::{SandboxConfig, SandboxType};


/// Sandbox execution result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SandboxResult {
    /// Whether execution succeeded
    pub success: bool,
    /// Exit code (if applicable)
    pub exit_code: Option<i32>,
    /// Execution output
    pub output: Option<String>,
    /// Error message
    pub error: Option<String>,
    /// Execution time in milliseconds
    pub execution_time_ms: u64,
    /// Resource usage
    pub resource_usage: ResourceUsage,
}

/// Resource usage statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ResourceUsage {
    /// Memory used in bytes
    pub memory_bytes: u64,
    /// CPU time in milliseconds
    pub cpu_time_ms: u64,
    /// Network bytes sent/received
    pub network_bytes: u64,
}

/// Sandbox trait for different sandbox implementations
#[async_trait::async_trait]
pub trait Sandbox: Send + Sync {
    /// Execute code in sandbox
    async fn execute(&self, code: &str) -> Result<SandboxResult, SandboxError>;

    /// Get sandbox type
    fn sandbox_type(&self) -> SandboxType;
}

/// Sandbox error types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum SandboxError {
    /// Execution timeout
    Timeout,
    /// Memory limit exceeded
    MemoryLimitExceeded,
    /// CPU limit exceeded
    CpuLimitExceeded,
    /// Network access denied
    NetworkDenied,
    /// File system access denied
    FileSystemDenied,
    /// Invalid code
    InvalidCode(String),
    /// Execution failed
    ExecutionFailed(String),
    /// Sandbox initialization failed
    InitFailed(String),
}
