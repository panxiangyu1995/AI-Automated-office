//! Sales 模块 Tauri 命令

use crate::auth::{AuthService, verify_and_check, Permission};
use crate::sales::db::SalesDatabase;
use crate::sales::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

pub struct SalesState { pub db: Arc<SalesDatabase> }
impl SalesState { pub fn new() -> Self { let db = Arc::new(SalesDatabase::new()); db.init_defaults(); Self { db } } }
impl Default for SalesState { fn default() -> Self { Self::new() } }

#[tauri::command]
pub async fn sales_create_customer(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateCustomerRequest,
) -> Result<Customer, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建客户: {}", request.name);
    state.db.create_customer(request)
}

#[tauri::command]
pub async fn sales_list_customers(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<CustomerListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_customers())
}

#[tauri::command]
pub async fn sales_get_customer(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<Customer, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_customer(&id).ok_or("客户不存在".into())
}

#[tauri::command]
pub async fn sales_update_customer(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    request: CreateCustomerRequest,
) -> Result<Customer, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("更新客户: {}", id);
    state.db.update_customer(&id, request)
}

#[tauri::command]
pub async fn sales_delete_customer(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    info!("删除客户: {}", id);
    state.db.delete_customer(&id)
}

#[tauri::command]
pub async fn sales_list_quotes(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<QuoteListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_quotes())
}

#[tauri::command]
pub async fn sales_get_quote(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<Quote, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_quote(&id).ok_or("报价单不存在".into())
}

#[tauri::command]
pub async fn sales_list_contracts(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<ContractListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_contracts())
}

#[tauri::command]
pub async fn sales_get_contract(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<Contract, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_contract(&id).ok_or("合同不存在".into())
}

#[tauri::command]
pub async fn sales_get_stats(
    state: State<'_, SalesState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<SalesStats, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.get_stats())
}
