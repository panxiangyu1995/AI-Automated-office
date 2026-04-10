use super::Migration;

const UP_SQL: &str = r#"
-- Add tenant_id to users table for multi-tenant support
ALTER TABLE users ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';

-- Create index for tenant_id lookup
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Update existing users to default tenant
UPDATE users SET tenant_id = 'default' WHERE tenant_id IS NULL;
"#;

const DOWN_SQL: &str = r#"
DROP INDEX IF EXISTS idx_users_tenant_id;
ALTER TABLE users DROP COLUMN tenant_id;
"#;

pub fn migration() -> Migration {
    Migration {
        version: 8,
        name: "v8_users_tenant_id",
        up: UP_SQL,
        down: Some(DOWN_SQL),
    }
}
