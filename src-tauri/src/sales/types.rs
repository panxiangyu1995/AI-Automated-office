//! Sales 模块数据类型

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CustomerType { Individual, Corporate }
impl Default for CustomerType { fn default() -> Self { Self::Individual } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "uppercase")]
pub enum CustomerLevel { A, B, C }
impl Default for CustomerLevel { fn default() -> Self { Self::C } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum QuoteStatus { Draft, Sent, Accepted, Rejected }
impl Default for QuoteStatus { fn default() -> Self { Self::Draft } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ContractStatus { Draft, Signed, Executing, Completed }
impl Default for ContractStatus { fn default() -> Self { Self::Draft } }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub contact: String,
    pub phone: String,
    pub email: String,
    pub address: String,
    pub customer_type: CustomerType,
    pub level: CustomerLevel,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteItem {
    pub id: String,
    pub product: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Quote {
    pub id: String,
    pub number: String,
    pub customer_id: String,
    pub customer_name: String,
    pub items: Vec<QuoteItem>,
    pub total_amount: f64,
    pub status: QuoteStatus,
    pub valid_until: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContractItem {
    pub id: String,
    pub product: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Contract {
    pub id: String,
    pub number: String,
    pub customer_id: String,
    pub customer_name: String,
    pub quote_id: Option<String>,
    pub items: Vec<ContractItem>,
    pub total_amount: f64,
    pub status: ContractStatus,
    pub sign_date: Option<i64>,
    pub expire_date: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCustomerRequest {
    pub name: String,
    pub contact: String,
    pub phone: String,
    pub email: String,
    pub address: String,
    pub customer_type: Option<CustomerType>,
    pub level: Option<CustomerLevel>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomerListItem {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub email: String,
    pub customer_type: CustomerType,
    pub level: CustomerLevel,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteListItem {
    pub id: String,
    pub number: String,
    pub customer_name: String,
    pub total_amount: f64,
    pub status: QuoteStatus,
    pub valid_until: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContractListItem {
    pub id: String,
    pub number: String,
    pub customer_name: String,
    pub total_amount: f64,
    pub status: ContractStatus,
    pub sign_date: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalesStats {
    pub total_customers: i64,
    pub total_quotes: i64,
    pub total_contracts: i64,
    pub total_amount: f64,
}
