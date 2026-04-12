//! Warehouse 模块内存数据库

use crate::warehouse::types::*;
use std::collections::HashMap;
use tracing::info;

pub struct WarehouseDatabase {
    inbounds: std::sync::RwLock<HashMap<String, InboundOrder>>,
    outbounds: std::sync::RwLock<HashMap<String, OutboundOrder>>,
    inventory: std::sync::RwLock<HashMap<String, Inventory>>,
    stocktaking: std::sync::RwLock<Vec<StocktakingRecord>>,
}

impl WarehouseDatabase {
    pub fn new() -> Self {
        info!("初始化仓储内存数据库");
        Self {
            inbounds: std::sync::RwLock::new(HashMap::new()),
            outbounds: std::sync::RwLock::new(HashMap::new()),
            inventory: std::sync::RwLock::new(HashMap::new()),
            stocktaking: std::sync::RwLock::new(Vec::new()),
        }
    }

    pub fn init_defaults(&self) {
        // 示例库存 - 电脑
        let inv1 = Inventory {
            id: "inv-001".to_string(),
            product_id: "prod-001".to_string(),
            product_name: "联想ThinkPad笔记本".to_string(),
            warehouse_id: "wh-001".to_string(),
            quantity: 15.0,
            reserved_quantity: 0.0,
            available_quantity: 15.0,
            updated_at: chrono::Utc::now().timestamp(),
        };
        self.inventory.write().unwrap().insert(inv1.id.clone(), inv1);

        // 示例库存 - 鼠标（库存不足）
        let inv2 = Inventory {
            id: "inv-002".to_string(),
            product_id: "prod-002".to_string(),
            product_name: "罗技无线鼠标".to_string(),
            warehouse_id: "wh-001".to_string(),
            quantity: 5.0,
            reserved_quantity: 0.0,
            available_quantity: 5.0,
            updated_at: chrono::Utc::now().timestamp(),
        };
        self.inventory.write().unwrap().insert(inv2.id.clone(), inv2);

        // 示例库存 - 显示器（库存过剩）
        let inv3 = Inventory {
            id: "inv-003".to_string(),
            product_id: "prod-003".to_string(),
            product_name: "Dell显示器27寸".to_string(),
            warehouse_id: "wh-001".to_string(),
            quantity: 45.0,
            reserved_quantity: 0.0,
            available_quantity: 45.0,
            updated_at: chrono::Utc::now().timestamp(),
        };
        self.inventory.write().unwrap().insert(inv3.id.clone(), inv3);

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

    pub fn list_inventory_detail(&self, req: ListInventoryRequest) -> ListInventoryResponse {
        let page = req.page.unwrap_or(1).max(1);
        let page_size = req.page_size.unwrap_or(20).min(100);
        let offset = (page - 1) * page_size;

        let inventory = self.inventory.read().unwrap();
        let mut items: Vec<InventoryDetailItem> = inventory.values().map(|i| {
            let stock_status = if i.available_quantity < 10.0 {
                "low".to_string()
            } else if i.available_quantity > 80.0 {
                "excess".to_string()
            } else {
                "normal".to_string()
            };
            InventoryDetailItem {
                id: i.id.clone(),
                product_id: i.product_id.clone(),
                product_name: i.product_name.clone(),
                sku: format!("SKU-{}", &i.product_id[5..]),
                category: if i.product_name.contains("笔记本") || i.product_name.contains("显示器") { "电脑设备".to_string() } else { "配件".to_string() },
                warehouse_id: i.warehouse_id.clone(),
                warehouse_name: "主仓库".to_string(),
                quantity: i.quantity,
                available_quantity: i.available_quantity,
                reserved_quantity: i.reserved_quantity,
                stock_status,
                min_stock: 10.0,
                max_stock: 80.0,
            }
        }).collect();

        // Apply filters
        if let Some(keyword) = &req.keyword {
            let kw = keyword.to_lowercase();
            items.retain(|item| {
                item.product_name.to_lowercase().contains(&kw) ||
                item.sku.to_lowercase().contains(&kw)
            });
        }

        if let Some(category) = &req.category {
            items.retain(|item| item.category == *category);
        }

        if let Some(status) = &req.stock_status {
            if status != "all" {
                items.retain(|item| item.stock_status == *status);
            }
        }

        // Extract categories
        let categories: Vec<String> = items.iter().map(|i| i.category.clone()).collect::<std::collections::HashSet<_>>().into_iter().collect();

        let total = items.len();
        items = items.into_iter().skip(offset).take(page_size).collect();

        ListInventoryResponse {
            items,
            total,
            page,
            page_size,
            categories,
        }
    }

    pub fn get_inventory_by_product(&self, product_id: &str) -> Option<Inventory> {
        self.inventory.read().unwrap().values().find(|i| i.product_id == product_id).cloned()
    }

    pub fn stocktaking(&self, req: StocktakingRequest) -> Result<StocktakingRecord, String> {
        let now = chrono::Utc::now().timestamp();
        let inventory = self.inventory.read().unwrap();
        let inv = inventory.values().find(|i| i.product_id == req.product_id)
            .ok_or_else(|| "商品不存在".to_string())?;
        let before_quantity = inv.quantity;
        let after_quantity = req.actual_quantity;
        let adjustment = after_quantity - before_quantity;
        drop(inventory);

        let record = StocktakingRecord {
            id: uuid::Uuid::new_v4().to_string(),
            product_id: req.product_id.clone(),
            product_name: self.inventory.read().unwrap().get(&format!("inv-{}", &req.product_id[5..]))
                .map(|i| i.product_name.clone())
                .unwrap_or_else(|| "未知商品".to_string()),
            before_quantity,
            after_quantity,
            adjustment,
            remark: req.remark,
            created_at: now,
        };

        // Update inventory
        let mut inv = self.inventory.write().unwrap();
        if let Some(item) = inv.values_mut().find(|i| i.product_id == req.product_id) {
            item.quantity = after_quantity;
            item.available_quantity = after_quantity - item.reserved_quantity;
            item.updated_at = now;
        }

        self.stocktaking.write().unwrap().push(record.clone());
        Ok(record)
    }

    pub fn list_stocktaking(&self) -> Vec<StocktakingRecord> {
        self.stocktaking.read().unwrap().clone()
    }
}

impl Default for WarehouseDatabase { fn default() -> Self { Self::new() } }
