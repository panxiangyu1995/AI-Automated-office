//! Service 售后模块 - 工单管理核心模块
//!
//! 本模块提供：
//! - 售后工单 CRUD 操作
//! - 服务人员管理
//! - 工单状态机
//! - 分配和优先级管理

mod db;
pub mod types;

mod commands;
pub use commands::*;
