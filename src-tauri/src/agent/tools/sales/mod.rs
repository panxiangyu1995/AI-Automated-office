//! Sales 工具模块
//!
//! 实现 ADR-017 命名规范: {plugin}_{entity}_{action}
//! 实现 ADR-025 每部门最多5个核心工具

pub mod query;
pub mod aggregate;
pub mod mutate;
pub mod action;
pub mod export;
pub mod register;

use serde::{Deserialize, Serialize};

/// Sales 角色
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SalesRole {
    SalesRep,
    SalesManager,
    Executive,
}

impl Default for SalesRole {
    fn default() -> Self { SalesRole::SalesRep }
}

/// Sales 工具枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SalesTool {
    CustomerQuery,
    CustomerAggregate,
    CustomerMutate,
    DealAction,
    ReportExport,
}

impl std::fmt::Display for SalesTool {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SalesTool::CustomerQuery => write!(f, "sales_customer_query"),
            SalesTool::CustomerAggregate => write!(f, "sales_customer_aggregate"),
            SalesTool::CustomerMutate => write!(f, "sales_customer_mutate"),
            SalesTool::DealAction => write!(f, "sales_deal_action"),
            SalesTool::ReportExport => write!(f, "sales_report_export"),
        }
    }
}
