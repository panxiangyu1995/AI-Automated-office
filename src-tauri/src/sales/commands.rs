//! Sales 模块 Tauri 命令

use crate::sales::db::SalesDatabase;
use crate::sales::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

pub struct SalesState { pub db: Arc<SalesDatabase> }
impl SalesState { pub fn new() -> Self { let db = Arc::new(SalesDatabase::new()); db.init_defaults(); Self { db } } }
impl Default for SalesState { fn default() -> Self { Self::new() } }

#[tauri::command]
pub async fn sales_create_customer(state: State<'_, SalesState>, request: CreateCustomerRequest) -> Result<Customer, String> {
    info!("创建客户: {}", request.name);
    state.db.create_customer(request)
}

#[tauri::command]
pub async fn sales_list_customers(state: State<'_, SalesState>) -> Result<Vec<CustomerListItem>, String> {
    Ok(state.db.list_customers())
}

#[tauri::command]
pub async fn sales_get_customer(state: State<'_, SalesState>, id: String) -> Result<Customer, String> {
    state.db.get_customer(&id).ok_or("客户不存在".into())
}

#[tauri::command]
pub async fn sales_update_customer(state: State<'_, SalesState>, id: String, request: CreateCustomerRequest) -> Result<Customer, String> {
    info!("更新客户: {}", id);
    state.db.update_customer(&id, request)
}

#[tauri::command]
pub async fn sales_delete_customer(state: State<'_, SalesState>, id: String) -> Result<(), String> {
    info!("删除客户: {}", id);
    state.db.delete_customer(&id)
}

#[tauri::command]
pub async fn sales_list_quotes(state: State<'_, SalesState>) -> Result<Vec<QuoteListItem>, String> {
    Ok(state.db.list_quotes())
}

#[tauri::command]
pub async fn sales_get_quote(state: State<'_, SalesState>, id: String) -> Result<Quote, String> {
    state.db.get_quote(&id).ok_or("报价单不存在".into())
}

#[tauri::command]
pub async fn sales_list_contracts(state: State<'_, SalesState>) -> Result<Vec<ContractListItem>, String> {
    Ok(state.db.list_contracts())
}

#[tauri::command]
pub async fn sales_get_contract(state: State<'_, SalesState>, id: String) -> Result<Contract, String> {
    state.db.get_contract(&id).ok_or("合同不存在".into())
}

#[tauri::command]
pub async fn sales_get_stats(state: State<'_, SalesState>) -> Result<SalesStats, String> {
    Ok(state.db.get_stats())
}
