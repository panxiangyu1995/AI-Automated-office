use super::Migration;

const UP_SQL: &str = r#"
-- Provider configurations table
-- Stores API keys and endpoint configurations for different providers
CREATE TABLE IF NOT EXISTS provider_configs (
    id TEXT PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    model TEXT,
    priority INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    config_level TEXT NOT NULL,
    tenant_id TEXT,
    user_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1
);

-- Platform quotas table
-- Stores quota information for official API providers
CREATE TABLE IF NOT EXISTS platform_quotas (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    quota_type TEXT NOT NULL,
    total_tokens INTEGER NOT NULL,
    used_tokens INTEGER DEFAULT 0,
    reset_day INTEGER NOT NULL,
    last_reset_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1
);

-- API usage records table
-- Tracks API usage for quota management
CREATE TABLE IF NOT EXISTS api_usage_records (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    tenant_id TEXT,
    provider_id TEXT NOT NULL,
    session_id TEXT,
    request_type TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    model TEXT NOT NULL,
    cost_local_currency REAL,
    usage_recorded_at INTEGER NOT NULL,
    metadata TEXT,
    created_at INTEGER NOT NULL
);

-- Indexes for provider_configs
CREATE INDEX IF NOT EXISTS idx_provider_configs_key ON provider_configs(config_key);
CREATE INDEX IF NOT EXISTS idx_provider_configs_level ON provider_configs(config_level);
CREATE INDEX IF NOT EXISTS idx_provider_configs_tenant ON provider_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_provider_configs_user ON provider_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_configs_active ON provider_configs(is_active, is_deleted);

-- Indexes for platform_quotas
CREATE INDEX IF NOT EXISTS idx_platform_quotas_provider ON platform_quotas(provider_id);
CREATE INDEX IF NOT EXISTS idx_platform_quotas_reset ON platform_quotas(last_reset_at);

-- Indexes for api_usage_records
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_tenant ON api_usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_recorded_at ON api_usage_records(usage_recorded_at);
"#;

pub fn migration() -> Migration {
    Migration {
        version: 5,
        name: "v5_provider_tables",
        up: UP_SQL,
        down: None,
    }
}
