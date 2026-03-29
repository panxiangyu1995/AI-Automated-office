use super::Migration;

const UP_SQL: &str = r#"
-- Add routing_config column to provider_configs for Plan/Act dual configuration
ALTER TABLE provider_configs ADD COLUMN routing_config TEXT;
"#;

pub fn migration() -> Migration {
    Migration {
        version: 6,
        name: "v6_provider_routing_config",
        up: UP_SQL,
        down: Some("ALTER TABLE provider_configs DROP COLUMN routing_config;"),
    }
}
