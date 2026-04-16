//! Finance 模块 Tauri 命令

use crate::auth::{AuthService, verify_and_check, Permission};
use crate::finance::db::FinanceDatabase;
use crate::finance::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

pub struct FinanceState { pub db: Arc<FinanceDatabase> }
impl FinanceState { pub fn new() -> Self { let db = Arc::new(FinanceDatabase::new()); db.init_defaults(); Self { db } } }
impl Default for FinanceState { fn default() -> Self { Self::new() } }

#[tauri::command]
pub async fn finance_create_invoice(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateInvoiceRequest,
) -> Result<Invoice, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建发票: {}", request.number);
    state.db.create_invoice(request)
}

#[tauri::command]
pub async fn finance_list_invoices(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<InvoiceListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_invoices())
}

#[tauri::command]
pub async fn finance_get_invoice(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<Invoice, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_invoice(&id).ok_or("发票不存在".into())
}

#[tauri::command]
pub async fn finance_verify_invoice(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<Invoice, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("验证发票: {}", id);
    state.db.verify_invoice(&id)
}

#[tauri::command]
pub async fn finance_create_ledger(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateLedgerRequest,
) -> Result<LedgerEntry, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建台账: {:?}", request.ledger_type);
    state.db.create_ledger(request)
}

#[tauri::command]
pub async fn finance_list_ledger(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    ledger_type: Option<String>,
) -> Result<Vec<LedgerListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    let lt = ledger_type.and_then(|s| match s.as_str() {
        "receivable" => Some(LedgerType::Receivable),
        "payable" => Some(LedgerType::Payable),
        _ => None,
    });
    Ok(state.db.list_ledger(lt))
}

#[tauri::command]
pub async fn finance_get_ledger(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<LedgerEntry, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_ledger(&id).ok_or("台账不存在".into())
}

#[tauri::command]
pub async fn finance_record_payment(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    amount: f64,
) -> Result<LedgerEntry, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("记录付款: {} = {}", id, amount);
    state.db.record_payment(&id, amount)
}

#[tauri::command]
pub async fn finance_get_stats(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<FinanceStats, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.get_stats())
}

#[tauri::command]
pub async fn finance_link_invoice_to_contract(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    invoice_id: String,
    sales_contract_id: String,
) -> Result<Invoice, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("关联发票 {} 到销售合同 {}", invoice_id, sales_contract_id);
    state.db.link_invoice_to_contract(&invoice_id, &sales_contract_id)
}

#[tauri::command]
pub async fn finance_create_invoice_from_sales(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    sales_contract_id: String,
    amount: f64,
    tax_amount: f64,
) -> Result<Invoice, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("从销售合同 {} 创建发票", sales_contract_id);
    state.db.create_invoice_from_sales(&sales_contract_id, amount, tax_amount)
}

#[tauri::command]
pub async fn finance_create_ledger_from_sales(
    state: State<'_, FinanceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    sales_contract_id: String,
    ledger_type: String,
    amount: f64,
    due_date: i64,
) -> Result<LedgerEntry, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("从销售合同 {} 创建台账记录", sales_contract_id);
    let lt = match ledger_type.as_str() {
        "receivable" => LedgerType::Receivable,
        "payable" => LedgerType::Payable,
        _ => return Err("Invalid ledger type".to_string()),
    };
    state.db.create_ledger_from_sales(&sales_contract_id, lt, amount, due_date)
}
