//! Warehouse 模块 Tauri 命令

use crate::auth::{AuthService, verify_and_check, Permission};
use crate::warehouse::db::WarehouseDatabase;
use crate::warehouse::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

pub struct WarehouseState { pub db: Arc<WarehouseDatabase> }
impl WarehouseState { pub fn new() -> Self { let db = Arc::new(WarehouseDatabase::new()); db.init_defaults(); Self { db } } }
impl Default for WarehouseState { fn default() -> Self { Self::new() } }

#[tauri::command]
pub async fn warehouse_list_inbounds(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<InboundListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_inbounds())
}

#[tauri::command]
pub async fn warehouse_get_inbound(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<InboundOrder, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_inbound(&id).ok_or("入库单不存在".into())
}

#[tauri::command]
pub async fn warehouse_create_inbound(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateInboundRequest,
) -> Result<InboundOrder, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建入库单");
    state.db.create_inbound(request)
}

#[tauri::command]
pub async fn warehouse_list_outbounds(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<OutboundListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_outbounds())
}

#[tauri::command]
pub async fn warehouse_get_outbound(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<OutboundOrder, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_outbound(&id).ok_or("出库单不存在".into())
}

#[tauri::command]
pub async fn warehouse_create_outbound(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateOutboundRequest,
) -> Result<OutboundOrder, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建出库单");
    state.db.create_outbound(request)
}

#[tauri::command]
pub async fn warehouse_list_inventory(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<InventoryListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_inventory())
}

#[tauri::command]
pub async fn warehouse_get_stats(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<WarehouseStats, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.get_stats())
}

#[tauri::command]
pub async fn warehouse_list_inventory_detail(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: Option<ListInventoryRequest>,
) -> Result<ListInventoryResponse, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    let req = request.unwrap_or(ListInventoryRequest {
        page: Some(1),
        page_size: Some(20),
        keyword: None,
        category: None,
        stock_status: None,
    });
    Ok(state.db.list_inventory_detail(req))
}

#[tauri::command]
pub async fn warehouse_stocktaking(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: StocktakingRequest,
) -> Result<StocktakingRecord, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("执行库存盘点: {:?}", request);
    state.db.stocktaking(request)
}

#[tauri::command]
pub async fn warehouse_list_stocktaking(
    state: State<'_, WarehouseState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<StocktakingRecord>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_stocktaking())
}
