//! 部门模块 - 部门能力包注册、加载、消息通信核心模块
//!
//! 本模块提供：
//! - 部门注册表：管理所有已注册的部门能力包
//! - 部门加载器：动态加载/卸载部门能力包
//! - 部门消息：支持部门间消息通信

mod commands;
mod loader;
mod message;
mod registry;
pub mod types;

pub use commands::*;
pub use loader::*;
pub use message::*;
pub use registry::*;
pub use types::*;
