//! Sales 模块内存数据库

use crate::sales::types::*;
use std::collections::HashMap;
use tracing::info;

pub struct SalesDatabase {
    customers: std::sync::RwLock<HashMap<String, Customer>>,
    quotes: std::sync::RwLock<HashMap<String, Quote>>,
    contracts: std::sync::RwLock<HashMap<String, Contract>>,
}

impl SalesDatabase {
    pub fn new() -> Self {
        info!("初始化销售内存数据库");
        Self {
            customers: std::sync::RwLock::new(HashMap::new()),
            quotes: std::sync::RwLock::new(HashMap::new()),
            contracts: std::sync::RwLock::new(HashMap::new()),
        }
    }

    pub fn init_defaults(&self) {
        let customer = Customer {
            id: "cust-001".to_string(),
            name: "北京科技有限公司".to_string(),
            contact: "王经理".to_string(),
            phone: "13800138000".to_string(),
            email: "wang@example.com".to_string(),
            address: "北京市朝阳区xxx".to_string(),
            customer_type: CustomerType::Corporate,
            level: CustomerLevel::A,
            tags: vec!["重点客户".to_string()],
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        };
        self.customers.write().unwrap().insert(customer.id.clone(), customer);

        let quote = Quote {
            id: "quote-001".to_string(),
            number: "Q202604001".to_string(),
            customer_id: "cust-001".to_string(),
            customer_name: "北京科技有限公司".to_string(),
            items: vec![
                QuoteItem {
                    id: "qi-001".to_string(),
                    product: "企业版套餐".to_string(),
                    quantity: 1.0,
                    unit_price: 50000.0,
                    total: 50000.0,
                }
            ],
            total_amount: 50000.0,
            status: QuoteStatus::Sent,
            valid_until: chrono::Utc::now().timestamp() + 86400 * 30,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        };
        self.quotes.write().unwrap().insert(quote.id.clone(), quote);
        info!("销售默认数据初始化完成");
    }

    // ==================== 客户操作 ====================
    pub fn create_customer(&self, req: CreateCustomerRequest) -> Result<Customer, String> {
        let now = chrono::Utc::now().timestamp();
        let customer = Customer {
            id: uuid::Uuid::new_v4().to_string(),
            name: req.name,
            contact: req.contact,
            phone: req.phone,
            email: req.email,
            address: req.address,
            customer_type: req.customer_type.unwrap_or_default(),
            level: req.level.unwrap_or_default(),
            tags: req.tags.unwrap_or_default(),
            created_at: now,
            updated_at: now,
        };
        self.customers.write().unwrap().insert(customer.id.clone(), customer.clone());
        Ok(customer)
    }

    pub fn list_customers(&self) -> Vec<CustomerListItem> {
        self.customers.read().unwrap().values().map(|c| CustomerListItem {
            id: c.id.clone(),
            name: c.name.clone(),
            phone: c.phone.clone(),
            email: c.email.clone(),
            customer_type: c.customer_type,
            level: c.level,
            created_at: c.created_at,
        }).collect()
    }

    pub fn get_customer(&self, id: &str) -> Option<Customer> {
        self.customers.read().unwrap().get(id).cloned()
    }

    pub fn update_customer(&self, id: &str, req: CreateCustomerRequest) -> Result<Customer, String> {
        let mut customers = self.customers.write().unwrap();
        let c = customers.get_mut(id).ok_or("客户不存在")?;
        c.name = req.name;
        c.contact = req.contact;
        c.phone = req.phone;
        c.email = req.email;
        c.address = req.address;
        if let Some(t) = req.customer_type { c.customer_type = t; }
        if let Some(l) = req.level { c.level = l; }
        if let Some(tags) = req.tags { c.tags = tags; }
        c.updated_at = chrono::Utc::now().timestamp();
        Ok(c.clone())
    }

    pub fn delete_customer(&self, id: &str) -> Result<(), String> {
        self.customers.write().unwrap().remove(id).map(|_| ()).ok_or("客户不存在".into())
    }

    // ==================== 报价单操作 ====================
    pub fn list_quotes(&self) -> Vec<QuoteListItem> {
        self.quotes.read().unwrap().values().map(|q| QuoteListItem {
            id: q.id.clone(),
            number: q.number.clone(),
            customer_name: q.customer_name.clone(),
            total_amount: q.total_amount,
            status: q.status,
            valid_until: q.valid_until,
            created_at: q.created_at,
        }).collect()
    }

    pub fn get_quote(&self, id: &str) -> Option<Quote> {
        self.quotes.read().unwrap().get(id).cloned()
    }

    // ==================== 合同操作 ====================
    pub fn list_contracts(&self) -> Vec<ContractListItem> {
        self.contracts.read().unwrap().values().map(|c| ContractListItem {
            id: c.id.clone(),
            number: c.number.clone(),
            customer_name: c.customer_name.clone(),
            total_amount: c.total_amount,
            status: c.status,
            sign_date: c.sign_date,
            created_at: c.created_at,
        }).collect()
    }

    pub fn get_contract(&self, id: &str) -> Option<Contract> {
        self.contracts.read().unwrap().get(id).cloned()
    }

    pub fn get_stats(&self) -> SalesStats {
        let customers = self.customers.read().unwrap();
        let quotes = self.quotes.read().unwrap();
        let contracts = self.contracts.read().unwrap();
        let total_amount: f64 = contracts.values().map(|c| c.total_amount).sum();
        SalesStats {
            total_customers: customers.len() as i64,
            total_quotes: quotes.len() as i64,
            total_contracts: contracts.len() as i64,
            total_amount,
        }
    }
}

impl Default for SalesDatabase { fn default() -> Self { Self::new() } }
