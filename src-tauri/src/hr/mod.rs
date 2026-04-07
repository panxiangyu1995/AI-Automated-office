//! HR 人事模块 - 员工、部门、岗位管理核心模块
//!
//! 本模块提供：
//! - 员工 CRUD 操作
//! - 部门树形结构管理
//! - 岗位管理
//! - 入职引导基础

mod commands;
mod db;
mod department;
mod position;
pub mod types;

pub use commands::*;
pub use department::*;
pub use position::*;
pub use types::*;
