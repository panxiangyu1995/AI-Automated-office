use super::Migration;

const UP_SQL: &str = r#"
-- Template version storage (replaces localStorage on frontend)
-- H7: 模板持久化从 localStorage 迁移到 SQLite

CREATE TABLE IF NOT EXISTS template_versions (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE INDEX IF NOT EXISTS idx_template_versions_template ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_status ON template_versions(template_id, status);
CREATE INDEX IF NOT EXISTS idx_template_versions_tenant ON template_versions(tenant_id);

-- Template metadata table
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    default_version_id TEXT,
    active_version_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    FOREIGN KEY (default_version_id) REFERENCES template_versions(id),
    FOREIGN KEY (active_version_id) REFERENCES template_versions(id)
);

CREATE INDEX IF NOT EXISTS idx_templates_tenant ON templates(tenant_id);
"#;

const DOWN_SQL: &str = r#"
DROP TABLE IF EXISTS template_versions;
DROP TABLE IF EXISTS templates;
"#;

pub fn migration() -> Migration {
    Migration {
        version: 10,
        name: "v10_template_tables",
        up: UP_SQL,
        down: Some(DOWN_SQL),
    }
}
