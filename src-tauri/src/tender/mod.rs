//! Tender 招投标模块 - 资质管理、业绩库、投标项目管理
//!
//! 本模块提供：
//! - 资质库管理
//! - 业绩案例管理
//! - 投标项目管理
//! - 资质到期提醒

mod db;
pub mod types;

mod commands;
pub use commands::*;
