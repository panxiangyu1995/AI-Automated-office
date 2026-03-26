# Design: 销售模块数据层 - 数据模型与API

## 技术方案

### 实现类型
- **implementationType**: `new`
- **优先级**: `high`
- **阶段**: Phase 4 - 业务模块动态化
- **Epic**: Epic 54 (业务模块动态化)
- **Story**: Story 54.3

### 技术栈选择
- **后端**: Rust + Tauri + SQLite
- **前端**: React + TypeScript + Zustand
- **状态管理**: Zustand Store
- **工具**: Tauri IPC 命令

## 数据模型设计

### 客户模型 (Customer)

```typescript
// src/features/sales/types/customer.types.ts

export interface Customer {
  id: string;
  name: string;                    // 客户名称
  contact_person: string;          // 联系人
  contact_phone: string;           // 联系电话
  contact_email: string;           // 联系邮箱
  address: string;                 // 地址
  customer_type: CustomerType;      // 客户类型
  industry: string;                // 行业
  status: CustomerStatus;          // 状态
  credit_limit: number;            // 信用额度
  tax_number: string;             // 税号
  bank_account: string;            // 银行账号
  notes: string;                  // 备注
  created_at: string;
  updated_at: string;
  created_by: string;
}

export enum CustomerType {
  Enterprise = 'enterprise',       // 企业客户
  Individual = 'individual',       // 个人客户
  Government = 'government',       // 政府客户
}

export enum CustomerStatus {
  Active = 'active',              // 活跃
  Potential = 'potential',        // 潜在
  Inactive = 'inactive',          // 已流失
}
```

### 报价单模型 (Quotation)

```typescript
// src/features/sales/types/quotation.types.ts

export interface Quotation {
  id: string;
  quotation_no: string;            // 报价单编号
  customer_id: string;            // 客户ID
  sales_person_id: string;        // 业务员ID
  title: string;                  // 报价标题
  subtotal: number;               // 小计金额
  discount: number;               // 折扣金额
  tax_rate: number;               // 税率
  tax_amount: number;             // 税额
  total_amount: number;           // 总金额
  valid_from: string;             // 有效期开始
  valid_until: string;            // 有效期结束
  status: QuotationStatus;        // 状态
  notes: string;                  // 备注
  items: QuotationItem[];         // 报价明细
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  product_name: string;
  specification: string;          // 规格
  unit: string;                   // 单位
  quantity: number;
  unit_price: number;
  discount_rate: number;           // 折扣率
  amount: number;                 // 金额
  notes: string;
}

export enum QuotationStatus {
  Draft = 'draft',               // 草稿
  Sent = 'sent',                 // 已发送
  Accepted = 'accepted',         // 已接受
  Rejected = 'rejected',         // 已拒绝
  Expired = 'expired',           // 已过期
}
```

### 合同模型 (Contract)

```typescript
// src/features/sales/types/contract.types.ts

export interface Contract {
  id: string;
  contract_no: string;            // 合同编号
  title: string;                  // 合同标题
  customer_id: string;            // 客户ID
  party_a: string;                // 甲方名称
  party_b: string;                // 乙方名称
  sign_date: string;              // 签订日期
  effective_date: string;         // 生效日期
  expiry_date: string;            // 到期日期
  total_amount: number;            // 合同金额
  payment_terms: string;          // 付款条款
  status: ContractStatus;         // 状态
  quotation_id: string;           // 关联报价单ID
  notes: string;                  // 备注
  attachments: Attachment[];       // 附件
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploaded_at: string;
}

export enum ContractStatus {
  Draft = 'draft',               // 草稿
  Signed = 'signed',             // 已签订
  InProgress = 'in_progress',     // 已执行
  Terminated = 'terminated',      // 已终止
  Completed = 'completed',        // 已完成
}
```

### 订单模型 (Order)

```typescript
// src/features/sales/types/order.types.ts

export interface Order {
  id: string;
  order_no: string;               // 订单编号
  customer_id: string;            // 客户ID
  contract_id: string;            // 关联合同ID
  sales_person_id: string;       // 业务员ID
  title: string;                  // 订单标题
  subtotal: number;               // 小计金额
  discount: number;               // 折扣金额
  tax_rate: number;               // 税率
  tax_amount: number;             // 税额
  total_amount: number;           // 总金额
  status: OrderStatus;            // 状态
  delivery_address: string;       // 交货地址
  expected_delivery_date: string; // 预计交货日期
  actual_delivery_date: string;   // 实际交货日期
  notes: string;                  // 备注
  items: OrderItem[];             // 订单明细
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  specification: string;
  unit: string;
  quantity: number;
  unit_price: number;
  amount: number;
  delivered_quantity: number;    // 已交货数量
  notes: string;
}

export enum OrderStatus {
  Pending = 'pending',           // 待确认
  Confirmed = 'confirmed',       // 已确认
  InProduction = 'in_production', // 生产中
  Shipped = 'shipped',           // 已发货
  Completed = 'completed',       // 已完成
  Cancelled = 'cancelled',       // 已取消
}
```

## API 设计

### 客户 API

```typescript
// src/features/sales/api/customerApi.ts

import { tauri } from '@/lib/tauri';
import type { Customer } from '../types/customer.types';

export const customerApi = {
  /**
   * 创建客户
   */
  async create(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    return await tauri.invoke('sales_customer_create', { customer });
  },

  /**
   * 获取客户详情
   */
  async get(id: string): Promise<Customer> {
    return await tauri.invoke('sales_customer_get', { id });
  },

  /**
   * 更新客户
   */
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    return await tauri.invoke('sales_customer_update', { id, customer });
  },

  /**
   * 删除客户
   */
  async delete(id: string): Promise<void> {
    return await tauri.invoke('sales_customer_delete', { id });
  },

  /**
   * 查询客户列表
   */
  async list(params: {
    status?: string;
    customer_type?: string;
    keyword?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Customer[]; total: number }> {
    return await tauri.invoke('sales_customer_list', { params });
  },
};
```

### 报价单 API

```typescript
// src/features/sales/api/quotationApi.ts

import { tauri } from '@/lib/tauri';
import type { Quotation, QuotationItem } from '../types/quotation.types';

export const quotationApi = {
  /**
   * 创建报价单
   */
  async create(quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>): Promise<Quotation> {
    return await tauri.invoke('sales_quotation_create', { quotation });
  },

  /**
   * 获取报价单详情
   */
  async get(id: string): Promise<Quotation> {
    return await tauri.invoke('sales_quotation_get', { id });
  },

  /**
   * 更新报价单
   */
  async update(id: string, quotation: Partial<Quotation>): Promise<Quotation> {
    return await tauri.invoke('sales_quotation_update', { id, quotation });
  },

  /**
   * 删除报价单
   */
  async delete(id: string): Promise<void> {
    return await tauri.invoke('sales_quotation_delete', { id });
  },

  /**
   * 查询报价单列表
   */
  async list(params: {
    customer_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Quotation[]; total: number }> {
    return await tauri.invoke('sales_quotation_list', { params });
  },

  /**
   * 发送报价单
   */
  async send(id: string): Promise<Quotation> {
    return await tauri.invoke('sales_quotation_send', { id });
  },

  /**
   * 接受报价单
   */
  async accept(id: string): Promise<Quotation> {
    return await tauri.invoke('sales_quotation_accept', { id });
  },

  /**
   * 拒绝报价单
   */
  async reject(id: string, reason: string): Promise<Quotation> {
    return await tauri.invoke('sales_quotation_reject', { id, reason });
  },
};
```

### 合同 API

```typescript
// src/features/sales/api/contractApi.ts

import { tauri } from '@/lib/tauri';
import type { Contract } from '../types/contract.types';

export const contractApi = {
  /**
   * 创建合同
   */
  async create(contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Promise<Contract> {
    return await tauri.invoke('sales_contract_create', { contract });
  },

  /**
   * 获取合同详情
   */
  async get(id: string): Promise<Contract> {
    return await tauri.invoke('sales_contract_get', { id });
  },

  /**
   * 更新合同
   */
  async update(id: string, contract: Partial<Contract>): Promise<Contract> {
    return await tauri.invoke('sales_contract_update', { id, contract });
  },

  /**
   * 删除合同
   */
  async delete(id: string): Promise<void> {
    return await tauri.invoke('sales_contract_delete', { id });
  },

  /**
   * 查询合同列表
   */
  async list(params: {
    customer_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Contract[]; total: number }> {
    return await tauri.invoke('sales_contract_list', { params });
  },

  /**
   * 签订合同
   */
  async sign(id: string): Promise<Contract> {
    return await tauri.invoke('sales_contract_sign', { id });
  },

  /**
   * 终止合同
   */
  async terminate(id: string, reason: string): Promise<Contract> {
    return await tauri.invoke('sales_contract_terminate', { id, reason });
  },
};
```

### 订单 API

```typescript
// src/features/sales/api/orderApi.ts

import { tauri } from '@/lib/tauri';
import type { Order } from '../types/order.types';

export const orderApi = {
  /**
   * 创建订单
   */
  async create(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    return await tauri.invoke('sales_order_create', { order });
  },

  /**
   * 获取订单详情
   */
  async get(id: string): Promise<Order> {
    return await tauri.invoke('sales_order_get', { id });
  },

  /**
   * 更新订单
   */
  async update(id: string, order: Partial<Order>): Promise<Order> {
    return await tauri.invoke('sales_order_update', { id, order });
  },

  /**
   * 删除订单
   */
  async delete(id: string): Promise<void> {
    return await tauri.invoke('sales_order_delete', { id });
  },

  /**
   * 查询订单列表
   */
  async list(params: {
    customer_id?: string;
    contract_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Order[]; total: number }> {
    return await tauri.invoke('sales_order_list', { params });
  },

  /**
   * 确认订单
   */
  async confirm(id: string): Promise<Order> {
    return await tauri.invoke('sales_order_confirm', { id });
  },

  /**
   * 取消订单
   */
  async cancel(id: string, reason: string): Promise<Order> {
    return await tauri.invoke('sales_order_cancel', { id, reason });
  },

  /**
   * 更新订单状态
   */
  async updateStatus(id: string, status: string, notes?: string): Promise<Order> {
    return await tauri.invoke('sales_order_update_status', { id, status, notes });
  },
};
```

## 后端实现

### 数据模型

```rust
// src-tauri/src/sales/models.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub contact_person: String,
    pub contact_phone: String,
    pub contact_email: String,
    pub address: String,
    pub customer_type: String,
    pub industry: String,
    pub status: String,
    pub credit_limit: f64,
    pub tax_number: String,
    pub bank_account: String,
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Quotation {
    pub id: String,
    pub quotation_no: String,
    pub customer_id: String,
    pub sales_person_id: String,
    pub title: String,
    pub subtotal: f64,
    pub discount: f64,
    pub tax_rate: f64,
    pub tax_amount: f64,
    pub total_amount: f64,
    pub valid_from: String,
    pub valid_until: String,
    pub status: String,
    pub notes: String,
    pub items: Vec<QuotationItem>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuotationItem {
    pub id: String,
    pub quotation_id: String,
    pub product_id: String,
    pub product_name: String,
    pub specification: String,
    pub unit: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub discount_rate: f64,
    pub amount: f64,
    pub notes: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Contract {
    pub id: String,
    pub contract_no: String,
    pub title: String,
    pub customer_id: String,
    pub party_a: String,
    pub party_b: String,
    pub sign_date: String,
    pub effective_date: String,
    pub expiry_date: String,
    pub total_amount: f64,
    pub payment_terms: String,
    pub status: String,
    pub quotation_id: String,
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub order_no: String,
    pub customer_id: String,
    pub contract_id: String,
    pub sales_person_id: String,
    pub title: String,
    pub subtotal: f64,
    pub discount: f64,
    pub tax_rate: f64,
    pub tax_amount: f64,
    pub total_amount: f64,
    pub status: String,
    pub delivery_address: String,
    pub expected_delivery_date: String,
    pub actual_delivery_date: String,
    pub notes: String,
    pub items: Vec<OrderItem>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderItem {
    pub id: String,
    pub order_id: String,
    pub product_id: String,
    pub product_name: String,
    pub specification: String,
    pub unit: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub amount: f64,
    pub delivered_quantity: f64,
    pub notes: String,
}
```

### 数据访问层

```rust
// src-tauri/src/sales/repository.rs

use crate::sales::models::*;
use crate::storage::sqlite::SqlitePool;

pub struct SalesRepository {
    pool: SqlitePool,
}

impl SalesRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    // Customer CRUD
    pub async fn create_customer(&mut self, customer: &Customer) -> Result<(), SalesError> {
        sqlx::query(
            r#"
            INSERT INTO sales_customer (id, name, contact_person, contact_phone, contact_email,
                address, customer_type, industry, status, credit_limit, tax_number, bank_account,
                notes, created_at, updated_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&customer.id)
        .bind(&customer.name)
        .bind(&customer.contact_person)
        .bind(&customer.contact_phone)
        .bind(&customer.contact_email)
        .bind(&customer.address)
        .bind(&customer.customer_type)
        .bind(&customer.industry)
        .bind(&customer.status)
        .bind(customer.credit_limit)
        .bind(&customer.tax_number)
        .bind(&customer.bank_account)
        .bind(&customer.notes)
        .bind(&customer.created_at)
        .bind(&customer.updated_at)
        .bind(&customer.created_by)
        .execute(&*self.pool)
        .await
        .map_err(|e| SalesError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn get_customer(&self, id: &str) -> Result<Customer, SalesError> {
        let row = sqlx::query_as::<_, (
            String, String, String, String, String, String, String, String, String,
            f64, String, String, String, String, String, String
        )>(
            "SELECT id, name, contact_person, contact_phone, contact_email, address,
                customer_type, industry, status, credit_limit, tax_number, bank_account,
                notes, created_at, updated_at, created_by
             FROM sales_customer WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&*self.pool)
        .await
        .map_err(|e| SalesError::NotFound)?;

        Ok(Customer {
            id: row.0, name: row.1, contact_person: row.2, contact_phone: row.3,
            contact_email: row.4, address: row.5, customer_type: row.6, industry: row.7,
            status: row.8, credit_limit: row.9, tax_number: row.10, bank_account: row.11,
            notes: row.12, created_at: row.13, updated_at: row.14, created_by: row.15,
        })
    }

    pub async fn update_customer(&mut self, id: &str, customer: &Customer) -> Result<(), SalesError> {
        sqlx::query(
            r#"
            UPDATE sales_customer SET name = ?, contact_person = ?, contact_phone = ?,
                contact_email = ?, address = ?, customer_type = ?, industry = ?,
                status = ?, credit_limit = ?, tax_number = ?, bank_account = ?,
                notes = ?, updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&customer.name)
        .bind(&customer.contact_person)
        .bind(&customer.contact_phone)
        .bind(&customer.contact_email)
        .bind(&customer.address)
        .bind(&customer.customer_type)
        .bind(&customer.industry)
        .bind(&customer.status)
        .bind(customer.credit_limit)
        .bind(&customer.tax_number)
        .bind(&customer.bank_account)
        .bind(&customer.notes)
        .bind(&customer.updated_at)
        .bind(id)
        .execute(&*self.pool)
        .await
        .map_err(|e| SalesError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn delete_customer(&mut self, id: &str) -> Result<(), SalesError> {
        sqlx::query("DELETE FROM sales_customer WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await
            .map_err(|e| SalesError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn list_customers(&self, params: &CustomerListParams) -> Result<(Vec<Customer>, i64), SalesError> {
        let mut query = "SELECT id, name, contact_person, contact_phone, contact_email, address, customer_type, industry, status, credit_limit, tax_number, bank_account, notes, created_at, updated_at, created_by FROM sales_customer WHERE 1=1".to_string();
        let mut count_query = "SELECT COUNT(*) FROM sales_customer WHERE 1=1".to_string();

        if let Some(status) = &params.status {
            query.push_str(&format!(" AND status = '{}'", status));
            count_query.push_str(&format!(" AND status = '{}'", status));
        }

        query.push_str(&format!(" ORDER BY created_at DESC LIMIT {} OFFSET {}",
            params.page_size, (params.page - 1) * params.page_size));

        let rows = sqlx::query_as::<_, (String, String, String, String, String, String, String, String, String, f64, String, String, String, String, String, String)>(
            &query,
        )
        .fetch_all(&*self.pool)
        .await
        .map_err(|e| SalesError::Database(e.to_string()))?;

        let total: i64 = sqlx::query_scalar(&count_query)
            .fetch_one(&*self.pool)
            .await
            .map_err(|e| SalesError::Database(e.to_string()))?;

        let customers = rows.into_iter().map(|row| Customer {
            id: row.0, name: row.1, contact_person: row.2, contact_phone: row.3,
            contact_email: row.4, address: row.5, customer_type: row.6, industry: row.7,
            status: row.8, credit_limit: row.9, tax_number: row.10, bank_account: row.11,
            notes: row.12, created_at: row.13, updated_at: row.14, created_by: row.15,
        }).collect();

        Ok((customers, total))
    }
}

#[derive(Debug)]
pub struct CustomerListParams {
    pub status: Option<String>,
    pub customer_type: Option<String>,
    pub keyword: Option<String>,
    pub page: i64,
    pub page_size: i64,
}
```

## 数据库表结构

### 客户表

```sql
CREATE TABLE sales_customer (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    address TEXT,
    customer_type TEXT NOT NULL,
    industry TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    credit_limit REAL DEFAULT 0,
    tax_number TEXT,
    bank_account TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL
);

CREATE INDEX idx_customer_status ON sales_customer(status);
CREATE INDEX idx_customer_type ON sales_customer(customer_type);
CREATE INDEX idx_customer_name ON sales_customer(name);
```

### 报价单表

```sql
CREATE TABLE sales_quotation (
    id TEXT PRIMARY KEY,
    quotation_no TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    sales_person_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    tax_rate REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    valid_from TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES sales_customer(id)
);

CREATE INDEX idx_quotation_customer ON sales_quotation(customer_id);
CREATE INDEX idx_quotation_status ON sales_quotation(status);
CREATE INDEX idx_quotation_no ON sales_quotation(quotation_no);
```

### 报价明细表

```sql
CREATE TABLE sales_quotation_item (
    id TEXT PRIMARY KEY,
    quotation_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    specification TEXT,
    unit TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount_rate REAL NOT NULL DEFAULT 1,
    amount REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (quotation_id) REFERENCES sales_quotation(id)
);

CREATE INDEX idx_quotation_item_quotation ON sales_quotation_item(quotation_id);
```

### 合同表

```sql
CREATE TABLE sales_contract (
    id TEXT PRIMARY KEY,
    contract_no TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    party_a TEXT NOT NULL,
    party_b TEXT NOT NULL,
    sign_date TEXT NOT NULL,
    effective_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_terms TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    quotation_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES sales_customer(id),
    FOREIGN KEY (quotation_id) REFERENCES sales_quotation(id)
);

CREATE INDEX idx_contract_customer ON sales_contract(customer_id);
CREATE INDEX idx_contract_status ON sales_contract(status);
CREATE INDEX idx_contract_no ON sales_contract(contract_no);
```

### 订单表

```sql
CREATE TABLE sales_order (
    id TEXT PRIMARY KEY,
    order_no TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    contract_id TEXT,
    sales_person_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    tax_rate REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    delivery_address TEXT,
    expected_delivery_date TEXT,
    actual_delivery_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES sales_customer(id),
    FOREIGN KEY (contract_id) REFERENCES sales_contract(id)
);

CREATE INDEX idx_order_customer ON sales_order(customer_id);
CREATE INDEX idx_order_status ON sales_order(status);
CREATE INDEX idx_order_no ON sales_order(order_no);
```

### 订单明细表

```sql
CREATE TABLE sales_order_item (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    specification TEXT,
    unit TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    delivered_quantity REAL NOT NULL DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES sales_order(id)
);

CREATE INDEX idx_order_item_order ON sales_order_item(order_id);
```

### 变更历史表

```sql
CREATE TABLE sales_change_history (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_fields TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_history_entity ON sales_change_history(entity_type, entity_id);
CREATE INDEX idx_history_operator ON sales_change_history(operator_id);
```

## 模块结构

### 后端模块结构

```
src-tauri/src/
├── agent/
│   └── sales/
│       ├── mod.rs              # 模块入口
│       ├── models.rs           # 数据模型
│       ├── repository.rs      # 数据访问层
│       ├── validators.rs      # 数据验证
│       ├── commands.rs        # Tauri 命令
│       └── error.rs           # 错误定义
```

### 前端模块结构

```
src/features/sales/
├── api/
│   ├── customerApi.ts
│   ├── quotationApi.ts
│   ├── contractApi.ts
│   └── orderApi.ts
├── types/
│   ├── customer.types.ts
│   ├── quotation.types.ts
│   ├── contract.types.ts
│   ├── order.types.ts
│   └── index.ts
├── stores/
│   └── salesStore.ts
└── index.ts
```
