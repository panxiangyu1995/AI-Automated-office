use super::Migration;

pub fn migration() -> Migration {
    Migration {
        version: 12,
        name: "dashboard_tables",
        up: r#"
            -- Dashboard统计表：hr_employees
            CREATE TABLE IF NOT EXISTS hr_employees (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                name TEXT NOT NULL,
                department TEXT,
                position TEXT,
                status TEXT DEFAULT 'active',
                hire_date INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- Dashboard统计表：sales_customers
            CREATE TABLE IF NOT EXISTS sales_customers (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                name TEXT NOT NULL,
                company TEXT,
                contact TEXT,
                phone TEXT,
                email TEXT,
                status TEXT DEFAULT 'active',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- Dashboard统计表：sales_orders
            CREATE TABLE IF NOT EXISTS sales_orders (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                customer_id TEXT,
                amount REAL NOT NULL DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- Dashboard统计表：sales_contracts
            CREATE TABLE IF NOT EXISTS sales_contracts (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                title TEXT NOT NULL,
                amount REAL NOT NULL DEFAULT 0,
                status TEXT DEFAULT 'draft',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- Dashboard统计表：approvals
            CREATE TABLE IF NOT EXISTS approvals (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                title TEXT NOT NULL,
                requester_id TEXT,
                status TEXT DEFAULT 'pending',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- Dashboard统计表：finance_receivable
            CREATE TABLE IF NOT EXISTS finance_receivable (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                customer_id TEXT,
                amount REAL NOT NULL DEFAULT 0,
                due_date INTEGER,
                status TEXT DEFAULT 'unpaid',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- Dashboard统计表：finance_payable
            CREATE TABLE IF NOT EXISTS finance_payable (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                supplier TEXT,
                amount REAL NOT NULL DEFAULT 0,
                due_date INTEGER,
                status TEXT DEFAULT 'unpaid',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- Dashboard统计表：service_tickets
            CREATE TABLE IF NOT EXISTS service_tickets (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                title TEXT NOT NULL,
                customer_id TEXT,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'normal',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- 创建索引提升查询性能
            CREATE INDEX IF NOT EXISTS idx_hr_employees_tenant ON hr_employees(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_sales_customers_tenant ON sales_customers(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_sales_orders_tenant ON sales_orders(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
            CREATE INDEX IF NOT EXISTS idx_sales_contracts_tenant ON sales_contracts(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_approvals_tenant ON approvals(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
            CREATE INDEX IF NOT EXISTS idx_finance_receivable_tenant ON finance_receivable(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_finance_payable_tenant ON finance_payable(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_service_tickets_tenant ON service_tickets(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
        "#,
        down: Some(r#"
            DROP TABLE IF EXISTS hr_employees;
            DROP TABLE IF EXISTS sales_customers;
            DROP TABLE IF EXISTS sales_orders;
            DROP TABLE IF EXISTS sales_contracts;
            DROP TABLE IF EXISTS approvals;
            DROP TABLE IF EXISTS finance_receivable;
            DROP TABLE IF EXISTS finance_payable;
            DROP TABLE IF EXISTS service_tickets;
        "#),
    }
}
