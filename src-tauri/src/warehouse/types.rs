//! Warehouse 模块数据类型

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum InboundType { Purchase, Return }
impl Default for InboundType { fn default() -> Self { Self::Purchase } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum InboundStatus { Draft, Submitted, Approved, Completed }
impl Default for InboundStatus { fn default() -> Self { Self::Draft } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum OutboundType { Sale, Transfer }
impl Default for OutboundType { fn default() -> Self { Self::Sale } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum OutboundStatus { Draft, Submitted, Approved, Shipped }
impl Default for OutboundStatus { fn default() -> Self { Self::Draft } }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InboundItem {
    pub product_id: String,
    pub product_name: String,
    pub quantity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InboundOrder {
    pub id: String,
    pub number: String,
    pub inbound_type: InboundType,
    pub items: Vec<InboundItem>,
    pub status: InboundStatus,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboundItem {
    pub product_id: String,
    pub product_name: String,
    pub quantity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboundOrder {
    pub id: String,
    pub number: String,
    pub outbound_type: OutboundType,
    pub sales_order_id: Option<String>,
    pub items: Vec<OutboundItem>,
    pub status: OutboundStatus,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Inventory {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub warehouse_id: String,
    pub quantity: f64,
    pub reserved_quantity: f64,
    pub available_quantity: f64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInboundRequest {
    pub inbound_type: InboundType,
    pub items: Vec<InboundItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOutboundRequest {
    pub outbound_type: OutboundType,
    pub sales_order_id: Option<String>,
    pub items: Vec<OutboundItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InboundListItem {
    pub id: String,
    pub number: String,
    pub inbound_type: InboundType,
    pub status: InboundStatus,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboundListItem {
    pub id: String,
    pub number: String,
    pub outbound_type: OutboundType,
    pub status: OutboundStatus,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryListItem {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub quantity: f64,
    pub available_quantity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseStats {
    pub total_inventory: i64,
    pub low_stock_count: i64,
    pub pending_inbound: i64,
    pub pending_outbound: i64,
}
