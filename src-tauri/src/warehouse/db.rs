//! Warehouse 模块内存数据库

use crate::warehouse::types::*;
use std::collections::HashMap;
use tracing::info;

pub struct WarehouseDatabase {
    inbounds: std::sync::RwLock<HashMap<String, InboundOrder>>,
    outbounds: std::sync::RwLock<HashMap<String, OutboundOrder>>,
    inventory: std::sync::RwLock<HashMap<String, Inventory>>,
}

impl WarehouseDatabase {
    pub fn new() -> Self {
        info!("初始化仓储内存数据库");
        Self {
            inbounds: std::sync::RwLock::new(HashMap::new()),
            outbounds: std::sync::RwLock::new(HashMap::new()),
            inventory: std::sync::RwLock::new(HashMap::new()),
        }
    }

    pub fn init_defaults(&self) {
        // 示例库存
        let inv = Inventory {
            id: "inv-001".to_string(),
            product_id: "prod-001".to_string(),
            product_name: "企业版套餐".to_string(),
            warehouse_id: "wh-001".to_string(),
            quantity: 100.0,
            reserved_quantity: 10.0,
            available_quantity: 90.0,
            updated_at: chrono::Utc::now().timestamp(),
        };
        self.inventory.write().unwrap().insert(inv.id.clone(), inv);
        info!("仓储默认数据初始化完成");
    }

    pub fn list_inbounds(&self) -> Vec<InboundListItem> {
        self.inbounds.read().unwrap().values().map(|i| InboundListItem {
            id: i.id.clone(), number: i.number.clone(), inbound_type: i.inbound_type,
            status: i.status, created_at: i.created_at,
        }).collect()
    }

    pub fn get_inbound(&self, id: &str) -> Option<InboundOrder> {
        self.inbounds.read().unwrap().get(id).cloned()
    }

    pub fn create_inbound(&self, req: CreateInboundRequest) -> Result<InboundOrder, String> {
        let now = chrono::Utc::now().timestamp();
        let order = InboundOrder {
            id: uuid::Uuid::new_v4().to_string(),
            number: format!("IN{}", now),
            inbound_type: req.inbound_type,
            items: req.items,
            status: InboundStatus::Draft,
            created_at: now,
            updated_at: now,
        };
        self.inbounds.write().unwrap().insert(order.id.clone(), order.clone());
        Ok(order)
    }

    pub fn list_outbounds(&self) -> Vec<OutboundListItem> {
        self.outbounds.read().unwrap().values().map(|o| OutboundListItem {
            id: o.id.clone(), number: o.number.clone(), outbound_type: o.outbound_type,
            status: o.status, created_at: o.created_at,
        }).collect()
    }

    pub fn get_outbound(&self, id: &str) -> Option<OutboundOrder> {
        self.outbounds.read().unwrap().get(id).cloned()
    }

    pub fn create_outbound(&self, req: CreateOutboundRequest) -> Result<OutboundOrder, String> {
        let now = chrono::Utc::now().timestamp();
        let order = OutboundOrder {
            id: uuid::Uuid::new_v4().to_string(),
            number: format!("OUT{}", now),
            outbound_type: req.outbound_type,
            sales_order_id: req.sales_order_id,
            items: req.items,
            status: OutboundStatus::Draft,
            created_at: now,
            updated_at: now,
        };
        self.outbounds.write().unwrap().insert(order.id.clone(), order.clone());
        Ok(order)
    }

    pub fn list_inventory(&self) -> Vec<InventoryListItem> {
        self.inventory.read().unwrap().values().map(|i| InventoryListItem {
            id: i.id.clone(), product_id: i.product_id.clone(),
            product_name: i.product_name.clone(), quantity: i.quantity, available_quantity: i.available_quantity,
        }).collect()
    }

    pub fn get_stats(&self) -> WarehouseStats {
        let inventory = self.inventory.read().unwrap();
        let low_stock_count = inventory.values().filter(|i| i.available_quantity < 20.0).count() as i64;
        let inbounds = self.inbounds.read().unwrap();
        let outbounds = self.outbounds.read().unwrap();
        let pending_inbound = inbounds.values().filter(|i| i.status == InboundStatus::Draft).count() as i64;
        let pending_outbound = outbounds.values().filter(|o| o.status == OutboundStatus::Draft).count() as i64;
        WarehouseStats {
            total_inventory: inventory.len() as i64, low_stock_count,
            pending_inbound, pending_outbound,
        }
    }
}

impl Default for WarehouseDatabase { fn default() -> Self { Self::new() } }
