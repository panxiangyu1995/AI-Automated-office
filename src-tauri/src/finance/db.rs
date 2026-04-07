//! Finance 模块内存数据库

use crate::finance::types::*;
use std::collections::HashMap;
use tracing::info;

pub struct FinanceDatabase {
    invoices: std::sync::RwLock<HashMap<String, Invoice>>,
    ledger_entries: std::sync::RwLock<HashMap<String, LedgerEntry>>,
}

impl FinanceDatabase {
    pub fn new() -> Self {
        info!("初始化财务内存数据库");
        Self {
            invoices: std::sync::RwLock::new(HashMap::new()),
            ledger_entries: std::sync::RwLock::new(HashMap::new()),
        }
    }

    pub fn init_defaults(&self) {
        // 示例发票
        let invoice = Invoice {
            id: "inv-001".to_string(),
            number: "FP2026040001".to_string(),
            invoice_type: InvoiceType::Vat,
            amount: 50000.0,
            tax_amount: 6500.0,
            customer_id: Some("cust-001".to_string()),
            sales_quote_id: Some("quote-001".to_string()),
            sales_contract_id: None,
            ocr_result: None,
            status: InvoiceStatus::Verified,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        };
        self.invoices.write().unwrap().insert(invoice.id.clone(), invoice);

        // 示例应收
        let entry = LedgerEntry {
            id: "ledger-001".to_string(),
            ledger_type: LedgerType::Receivable,
            amount: 50000.0,
            paid_amount: 0.0,
            customer_id: Some("cust-001".to_string()),
            invoice_id: Some("inv-001".to_string()),
            due_date: chrono::Utc::now().timestamp() + 86400 * 30,
            status: LedgerStatus::Pending,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        };
        self.ledger_entries.write().unwrap().insert(entry.id.clone(), entry);
        info!("财务默认数据初始化完成");
    }

    // ==================== 发票操作 ====================
    pub fn create_invoice(&self, req: CreateInvoiceRequest) -> Result<Invoice, String> {
        let now = chrono::Utc::now().timestamp();
        let invoice = Invoice {
            id: uuid::Uuid::new_v4().to_string(),
            number: req.number,
            invoice_type: req.invoice_type,
            amount: req.amount,
            tax_amount: req.tax_amount,
            customer_id: req.customer_id,
            sales_quote_id: None,
            sales_contract_id: None,
            ocr_result: None,
            status: InvoiceStatus::Pending,
            created_at: now,
            updated_at: now,
        };
        self.invoices.write().unwrap().insert(invoice.id.clone(), invoice.clone());
        Ok(invoice)
    }

    pub fn list_invoices(&self) -> Vec<InvoiceListItem> {
        self.invoices.read().unwrap().values().map(|i| InvoiceListItem {
            id: i.id.clone(), number: i.number.clone(), invoice_type: i.invoice_type,
            amount: i.amount, status: i.status, created_at: i.created_at,
        }).collect()
    }

    pub fn get_invoice(&self, id: &str) -> Option<Invoice> {
        self.invoices.read().unwrap().get(id).cloned()
    }

    pub fn verify_invoice(&self, id: &str) -> Result<Invoice, String> {
        let mut invoices = self.invoices.write().unwrap();
        let inv = invoices.get_mut(id).ok_or("发票不存在")?;
        inv.status = InvoiceStatus::Verified;
        inv.updated_at = chrono::Utc::now().timestamp();
        Ok(inv.clone())
    }

    // ==================== 台账操作 ====================
    pub fn create_ledger(&self, req: CreateLedgerRequest) -> Result<LedgerEntry, String> {
        let now = chrono::Utc::now().timestamp();
        let entry = LedgerEntry {
            id: uuid::Uuid::new_v4().to_string(),
            ledger_type: req.ledger_type,
            amount: req.amount,
            paid_amount: 0.0,
            customer_id: req.customer_id,
            invoice_id: req.invoice_id,
            due_date: req.due_date,
            status: LedgerStatus::Pending,
            created_at: now,
            updated_at: now,
        };
        self.ledger_entries.write().unwrap().insert(entry.id.clone(), entry.clone());
        Ok(entry)
    }

    pub fn list_ledger(&self, ledger_type: Option<LedgerType>) -> Vec<LedgerListItem> {
        self.ledger_entries.read().unwrap()
            .values()
            .filter(|e| ledger_type.map(|t| e.ledger_type == t).unwrap_or(true))
            .map(|e| LedgerListItem {
                id: e.id.clone(), ledger_type: e.ledger_type, amount: e.amount,
                paid_amount: e.paid_amount, status: e.status, due_date: e.due_date, created_at: e.created_at,
            }).collect()
    }

    pub fn get_ledger(&self, id: &str) -> Option<LedgerEntry> {
        self.ledger_entries.read().unwrap().get(id).cloned()
    }

    pub fn record_payment(&self, id: &str, amount: f64) -> Result<LedgerEntry, String> {
        let mut entries = self.ledger_entries.write().unwrap();
        let entry = entries.get_mut(id).ok_or("台账记录不存在")?;
        entry.paid_amount += amount;
        if entry.paid_amount >= entry.amount {
            entry.status = LedgerStatus::Completed;
        } else if entry.paid_amount > 0.0 {
            entry.status = LedgerStatus::Partial;
        }
        entry.updated_at = chrono::Utc::now().timestamp();
        Ok(entry.clone())
    }

    pub fn get_stats(&self) -> FinanceStats {
        let entries = self.ledger_entries.read().unwrap();
        let invoices = self.invoices.read().unwrap();
        let total_receivable: f64 = entries.values().filter(|e| e.ledger_type == LedgerType::Receivable).map(|e| e.amount).sum();
        let total_payable: f64 = entries.values().filter(|e| e.ledger_type == LedgerType::Payable).map(|e| e.amount).sum();
        let pending_count = entries.values().filter(|e| e.status == LedgerStatus::Pending).count() as i64;
        FinanceStats {
            total_receivable, total_payable, total_invoices: invoices.len() as i64, pending_count,
        }
    }
}

impl Default for FinanceDatabase { fn default() -> Self { Self::new() } }
