# Design: 财务模块数据层 - 数据模型与API

## 技术方案

### 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 4 - 业务模块动态化
- **后端必需**: Yes

### 前端实现

#### 目录结构
```
src/features/finance/
├── types/
│   ├── index.ts              # 类型导出
│   ├── invoice.ts            # 发票类型
│   ├── ledger.ts            # 台账类型
│   ├── receivable.ts         # 应收类型
│   ├── payable.ts           # 应付类型
│   └── common.ts             # 公共类型
├── api/
│   ├── index.ts              # API导出
│   ├── invoiceApi.ts         # 发票API
│   ├── ledgerApi.ts          # 台账API
│   ├── financeApi.ts         # 通用财务API
│   └── ocrApi.ts             # OCR接口
├── stores/
│   └── financeStore.ts       # 财务状态管理
└── components/
    └── (后续Story开发)
```

#### 核心类型定义

```typescript
// src/features/finance/types/invoice.ts

export type InvoiceType = 'normal' | 'special';  // 普通发票/专用发票
export type InvoiceStatus = 'draft' | 'issued' | 'verified' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface OcrResult {
  rawText: string;
  parsedData: {
    invoiceNumber?: string;
    invoiceDate?: string;
    sellerName?: string;
    buyerName?: string;
    totalAmount?: number;
    taxAmount?: number;
    items?: OcrInvoiceItem[];
  };
  confidence: number;
  rawImageUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  ocrData: OcrResult | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// API请求/响应类型
export interface CreateInvoiceRequest {
  customerId: string;
  type: InvoiceType;
  items: Omit<InvoiceItem, 'id'>[];
  issuedDate: string;
  dueDate: string;
}

export interface InvoiceQueryParams {
  customerId?: string;
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
```

```typescript
// src/features/finance/types/ledger.ts

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type LedgerEntryType = 'debit' | 'credit';

export interface LedgerAccount {
  id: string;
  code: string;           # 科目编码，如"1001"表示库存现金
  name: string;
  type: AccountType;
  parentId: string | null;
  level: number;
  balance: number;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  date: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  invoiceId: string | null;
  receivableId: string | null;
  payableId: string | null;
  voucherId: string | null;
  createdAt: string;
  createdBy: string;
}

export interface LedgerQueryParams {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}
```

```typescript
// src/features/finance/types/receivable.ts

export type ReceivableStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface Receivable {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: ReceivableStatus;
  dueDate: string;
  issuedDate: string;
  overdueDays: number;
  lastPaymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivableQueryParams {
  customerId?: string;
  status?: ReceivableStatus;
  overdueOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
```

```typescript
// src/features/finance/types/payable.ts

export type PayableStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface Payable {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: PayableStatus;
  dueDate: string;
  issuedDate: string;
  overdueDays: number;
  lastPaymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayableQueryParams {
  supplierId?: string;
  status?: PayableStatus;
  overdueOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
```

#### API接口设计

```typescript
// src/features/finance/api/invoiceApi.ts

import { Invoice, CreateInvoiceRequest, InvoiceQueryParams } from '../types';

export const invoiceApi = {
  // 创建发票
  async create(request: CreateInvoiceRequest): Promise<Invoice> {
    return invoke<Invoice>('plugin:finance|create_invoice', request);
  },

  // 查询发票列表
  async query(params: InvoiceQueryParams): Promise<PaginatedResult<Invoice>> {
    return invoke<PaginatedResult<Invoice>>('plugin:finance|query_invoices', params);
  },

  // 获取发票详情
  async getById(id: string): Promise<Invoice> {
    return invoke<Invoice>('plugin:finance|get_invoice', { id });
  },

  // 更新发票状态
  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    return invoke<Invoice>('plugin:finance|update_invoice_status', { id, status });
  },

  // 发票OCR识别
  async ocrRecognize(imageUrl: string): Promise<OcrResult> {
    return invoke<OcrResult>('plugin:finance|ocr_recognize_invoice', { imageUrl });
  },

  // 从OCR结果创建发票
  async createFromOcr(ocrResult: OcrResult, customerId: string): Promise<Invoice> {
    return invoke<Invoice>('plugin:finance|create_invoice_from_ocr', {
      ocrResult,
      customerId,
    });
  },

  // 删除发票
  async delete(id: string): Promise<void> {
    return invoke<void>('plugin:finance|delete_invoice', { id });
  },
};
```

### 后端实现

#### 目录结构
```
src-tauri/src/plugins/finance/
├── mod.rs              # 模块入口
├── models.rs           # 数据模型
├── commands.rs         # Tauri命令
├── mock_data.rs        # 模拟数据
├── errors.rs           # 错误定义
├── ocr.rs              # OCR接口
└── audit.rs            # 审计日志
```

#### 核心实现

```rust
// src-tauri/src/plugins/finance/models.rs

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InvoiceType {
    Normal,   // 增值税普通发票
    Special,  // 增值税专用发票
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InvoiceStatus {
    Draft,
    Issued,
    Verified,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceItem {
    pub id: String,
    pub description: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub amount: f64,
    pub tax_rate: f64,
    pub tax_amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrResult {
    pub raw_text: String,
    pub parsed_data: OcrParsedData,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrParsedData {
    pub invoice_number: Option<String>,
    pub invoice_date: Option<String>,
    pub seller_name: Option<String>,
    pub buyer_name: Option<String>,
    pub total_amount: Option<f64>,
    pub tax_amount: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub invoice_number: String,
    pub invoice_type: InvoiceType,
    pub customer_id: String,
    pub customer_name: String,
    pub items: Vec<InvoiceItem>,
    pub total_amount: f64,
    pub tax_amount: f64,
    pub net_amount: f64,
    pub status: InvoiceStatus,
    pub issued_date: String,
    pub due_date: String,
    pub ocr_data: Option<OcrResult>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
}

// Ledger models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccountType {
    Asset,
    Liability,
    Equity,
    Revenue,
    Expense,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LedgerAccount {
    pub id: String,
    pub code: String,
    pub name: String,
    pub account_type: AccountType,
    pub parent_id: Option<String>,
    pub level: i32,
    pub balance: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LedgerEntry {
    pub id: String,
    pub account_id: String,
    pub date: String,
    pub description: String,
    pub debit_amount: f64,
    pub credit_amount: f64,
    pub balance: f64,
    pub invoice_id: Option<String>,
    pub receivable_id: Option<String>,
    pub payable_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub created_by: String,
}

// Receivable/Payable models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReceivableStatus {
    Pending,
    Partial,
    Paid,
    Overdue,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Receivable {
    pub id: String,
    pub customer_id: String,
    pub customer_name: String,
    pub invoice_id: String,
    pub invoice_number: String,
    pub amount: f64,
    pub paid_amount: f64,
    pub pending_amount: f64,
    pub status: ReceivableStatus,
    pub due_date: String,
    pub issued_date: String,
    pub overdue_days: i32,
    pub last_payment_date: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

```rust
// src-tauri/src/plugins/finance/commands.rs

use crate::plugins::finance::models::*;
use crate::plugins::finance::errors::FinanceError;
use tauri::command;

#[command]
pub async fn create_invoice(
    request: CreateInvoiceRequest,
) -> Result<Invoice, String> {
    // 实现创建发票逻辑
}

#[command]
pub async fn query_invoices(
    params: InvoiceQueryParams,
) -> Result<PaginatedResult<Invoice>, String> {
    // 实现查询发票列表逻辑
}

#[command]
pub async fn get_invoice(id: String) -> Result<Invoice, String> {
    // 实现获取发票详情逻辑
}

#[command]
pub async fn update_invoice_status(
    id: String,
    status: InvoiceStatus,
) -> Result<Invoice, String> {
    // 实现更新发票状态逻辑
}

#[command]
pub async fn ocr_recognize_invoice(
    image_url: String,
) -> Result<OcrResult, String> {
    // 实现OCR识别逻辑（模拟实现）
}

#[command]
pub async fn create_invoice_from_ocr(
    ocr_result: OcrResult,
    customer_id: String,
) -> Result<Invoice, String> {
    // 实现从OCR结果创建发票
}

// 类似地定义ledger、receivable、payable的命令...
```

### 数据库设计

#### 表结构

```sql
-- 发票表
CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_type TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    tax_amount REAL NOT NULL,
    net_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    issued_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    ocr_raw_text TEXT,
    ocr_confidence REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issued_date ON invoices(issued_date);

-- 发票明细表
CREATE TABLE invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    tax_rate REAL NOT NULL,
    tax_amount REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 台账表
CREATE TABLE ledger_entries (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    debit_amount REAL DEFAULT 0,
    credit_amount REAL DEFAULT 0,
    balance REAL NOT NULL,
    invoice_id TEXT,
    receivable_id TEXT,
    payable_id TEXT,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES ledger_accounts(id)
);

CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_date ON ledger_entries(date);

-- 会计科目表
CREATE TABLE ledger_accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    parent_id TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    balance REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES ledger_accounts(id)
);

-- 应收表
CREATE TABLE receivables (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    amount REAL NOT NULL,
    paid_amount REAL NOT NULL DEFAULT 0,
    pending_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TEXT NOT NULL,
    issued_date TEXT NOT NULL,
    overdue_days INTEGER DEFAULT 0,
    last_payment_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE INDEX idx_receivables_customer ON receivables(customer_id);
CREATE INDEX idx_receivables_status ON receivables(status);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);

-- 应付表（类似应收表结构）
CREATE TABLE payables (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    amount REAL NOT NULL,
    paid_amount REAL NOT NULL DEFAULT 0,
    pending_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TEXT NOT NULL,
    issued_date TEXT NOT NULL,
    overdue_days INTEGER DEFAULT 0,
    last_payment_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 财务审计日志表
CREATE TABLE finance_audit_logs (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    operator_id TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_finance_audit_entity ON finance_audit_logs(entity_type, entity_id);
```

## 状态管理

使用Zustand进行财务数据状态管理：
- `financeInvoiceStore` - 发票数据状态
- `financeLedgerStore` - 台账数据状态
- `financeReceivableStore` - 应收数据状态
- `financePayableStore` - 应付数据状态

## 安全考虑

- 遵循ADR-018安全设计
- 财务数据使用AES-256加密存储
- 实现基于角色的访问控制（RBAC）
- 敏感操作（如删除、取消）需要二次确认
- 所有数据变更记录审计日志

## 性能考虑

- 遵循NFR3响应性要求
- 大数据量查询使用分页（默认每页20条）
- 添加数据库索引优化查询性能
- 模拟数据生成器支持大数据量测试
