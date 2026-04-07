//! Finance 模块数据类型

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum InvoiceType { Vat, Normal, Receipt }
impl Default for InvoiceType { fn default() -> Self { Self::Vat } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum InvoiceStatus { Pending, Verified, Recorded }
impl Default for InvoiceStatus { fn default() -> Self { Self::Pending } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum LedgerType { Receivable, Payable }
impl Default for LedgerType { fn default() -> Self { Self::Receivable } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum LedgerStatus { Pending, Partial, Completed }
impl Default for LedgerStatus { fn default() -> Self { Self::Pending } }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OcrResult {
    pub invoice_number: String,
    pub invoice_date: String,
    pub seller_name: String,
    pub buyer_name: String,
    pub total_amount: f64,
    pub tax_amount: f64,
    pub items: Vec<OcrItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OcrItem {
    pub name: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Invoice {
    pub id: String,
    pub number: String,
    pub invoice_type: InvoiceType,
    pub amount: f64,
    pub tax_amount: f64,
    pub customer_id: Option<String>,
    pub sales_quote_id: Option<String>,
    pub sales_contract_id: Option<String>,
    pub ocr_result: Option<OcrResult>,
    pub status: InvoiceStatus,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LedgerEntry {
    pub id: String,
    pub ledger_type: LedgerType,
    pub amount: f64,
    pub paid_amount: f64,
    pub customer_id: Option<String>,
    pub invoice_id: Option<String>,
    pub due_date: i64,
    pub status: LedgerStatus,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceRequest {
    pub number: String,
    pub invoice_type: InvoiceType,
    pub amount: f64,
    pub tax_amount: f64,
    pub customer_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLedgerRequest {
    pub ledger_type: LedgerType,
    pub amount: f64,
    pub customer_id: Option<String>,
    pub invoice_id: Option<String>,
    pub due_date: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceListItem {
    pub id: String,
    pub number: String,
    pub invoice_type: InvoiceType,
    pub amount: f64,
    pub status: InvoiceStatus,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LedgerListItem {
    pub id: String,
    pub ledger_type: LedgerType,
    pub amount: f64,
    pub paid_amount: f64,
    pub status: LedgerStatus,
    pub due_date: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceStats {
    pub total_receivable: f64,
    pub total_payable: f64,
    pub total_invoices: i64,
    pub pending_count: i64,
}
