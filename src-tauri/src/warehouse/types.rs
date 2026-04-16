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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StocktakingRequest {
    pub product_id: String,
    pub actual_quantity: f64,
    pub remark: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StocktakingRecord {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub before_quantity: f64,
    pub after_quantity: f64,
    pub adjustment: f64,
    pub remark: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListInventoryRequest {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub keyword: Option<String>,
    pub category: Option<String>,
    pub stock_status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryDetailItem {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub sku: String,
    pub category: String,
    pub warehouse_id: String,
    pub warehouse_name: String,
    pub quantity: f64,
    pub available_quantity: f64,
    pub reserved_quantity: f64,
    pub stock_status: String,
    pub min_stock: f64,
    pub max_stock: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListInventoryResponse {
    pub items: Vec<InventoryDetailItem>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub categories: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_inbound_type_default() {
        assert_eq!(InboundType::default(), InboundType::Purchase);
    }

    #[test]
    fn test_inbound_status_default() {
        assert_eq!(InboundStatus::default(), InboundStatus::Draft);
    }

    #[test]
    fn test_outbound_type_default() {
        assert_eq!(OutboundType::default(), OutboundType::Sale);
    }

    #[test]
    fn test_outbound_status_default() {
        assert_eq!(OutboundStatus::default(), OutboundStatus::Draft);
    }

    #[test]
    fn test_inbound_type_serde_roundtrip() {
        let t = InboundType::Return;
        let json = serde_json::to_string(&t).unwrap();
        let de: InboundType = serde_json::from_str(&json).unwrap();
        assert_eq!(t, de);
    }

    #[test]
    fn test_inventory_available_quantity() {
        let inv = Inventory {
            id: "inv-1".to_string(),
            product_id: "p-1".to_string(),
            product_name: "widget".to_string(),
            warehouse_id: "wh-1".to_string(),
            quantity: 100.0,
            reserved_quantity: 30.0,
            available_quantity: 70.0,
            updated_at: 0,
        };
        assert_eq!(inv.quantity - inv.reserved_quantity, inv.available_quantity);
    }

    #[test]
    fn test_stocktaking_adjustment() {
        let record = StocktakingRecord {
            id: "sr-1".to_string(),
            product_id: "p-1".to_string(),
            product_name: "widget".to_string(),
            before_quantity: 100.0,
            after_quantity: 95.0,
            adjustment: -5.0,
            remark: None,
            created_at: 0,
        };
        assert_eq!(record.after_quantity - record.before_quantity, record.adjustment);
    }
}
