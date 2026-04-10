use super::Migration;

const UP_SQL: &str = r#"
-- Add tenant_id to sessions for multi-tenant isolation
ALTER TABLE sessions ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);

-- Add tenant_id to messages for multi-tenant isolation
ALTER TABLE messages ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);

-- Add tenant_id to memory_facts for multi-tenant isolation
ALTER TABLE memory_facts ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_memory_facts_tenant ON memory_facts(tenant_id);
"#;

const DOWN_SQL: &str = r#"
DROP INDEX IF EXISTS idx_memory_facts_tenant;
ALTER TABLE memory_facts DROP COLUMN tenant_id;
DROP INDEX IF EXISTS idx_messages_tenant;
ALTER TABLE messages DROP COLUMN tenant_id;
DROP INDEX IF EXISTS idx_sessions_tenant;
ALTER TABLE sessions DROP COLUMN tenant_id;
"#;

pub fn migration() -> Migration {
    Migration {
        version: 9,
        name: "v9_store_tenant_id",
        up: UP_SQL,
        down: Some(DOWN_SQL),
    }
}
