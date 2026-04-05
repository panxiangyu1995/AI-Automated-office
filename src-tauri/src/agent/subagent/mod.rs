//! Subagent 核心模块
//!
//! 实现 ADR-059 部门化 Subagent 架构的核心基础设施：
//! - Agent 类型定义
//! - Subagent 加载器
//! - Subagent 管理器

pub mod types;
pub mod loader;
pub mod department_loader;
pub mod personal_loader;
pub mod manager;

pub use types::*;
pub use loader::*;
pub use department_loader::*;
pub use personal_loader::*;
pub use manager::*;
