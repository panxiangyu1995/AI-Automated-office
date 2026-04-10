use super::Migration;

const UP_SQL: &str = r#"
-- Tenant tables for multi-tenant support
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    max_users INTEGER NOT NULL DEFAULT 10,
    max_storage INTEGER NOT NULL DEFAULT 1073741824,
    features TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_configs (
    tenant_id TEXT PRIMARY KEY,
    feature_flags TEXT NOT NULL,
    rate_limit TEXT NOT NULL,
    storage_usage INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
"#;

const DOWN_SQL: &str = r#"
DROP INDEX IF EXISTS idx_tenants_status;
DROP INDEX IF EXISTS idx_tenants_code;
DROP TABLE IF EXISTS tenant_configs;
DROP TABLE IF EXISTS tenants;
"#;

pub fn migration() -> Migration {
    Migration {
        version: 7,
        name: "v7_tenant_tables",
        up: UP_SQL,
        down: Some(DOWN_SQL),
    }
}
