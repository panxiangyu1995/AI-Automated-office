use super::Migration;

pub fn migration() -> Migration {
    Migration {
        version: 13,
        name: "workflow_tables",
        up: r#"
            -- 工作流定义表
            CREATE TABLE IF NOT EXISTS workflow_definitions (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                steps_json TEXT NOT NULL,
                timeout_minutes INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            -- 工作流实例表
            CREATE TABLE IF NOT EXISTS workflow_instances (
                id TEXT PRIMARY KEY,
                definition_id TEXT NOT NULL,
                tenant_id TEXT NOT NULL,
                state TEXT NOT NULL,
                current_step_id TEXT,
                context_json TEXT NOT NULL,
                history_json TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (definition_id) REFERENCES workflow_definitions(id)
            );
            
            -- 工作流历史表
            CREATE TABLE IF NOT EXISTS workflow_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                instance_id TEXT NOT NULL,
                step_id TEXT NOT NULL,
                step_type TEXT NOT NULL,
                result_json TEXT NOT NULL,
                success INTEGER NOT NULL,
                error TEXT,
                duration_ms INTEGER NOT NULL,
                executed_at INTEGER NOT NULL,
                FOREIGN KEY (instance_id) REFERENCES workflow_instances(id)
            );
            
            -- 索引
            CREATE INDEX IF NOT EXISTS idx_workflow_definitions_tenant ON workflow_definitions(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_workflow_instances_tenant ON workflow_instances(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_workflow_instances_state ON workflow_instances(state);
            CREATE INDEX IF NOT EXISTS idx_workflow_instances_definition ON workflow_instances(definition_id);
            CREATE INDEX IF NOT EXISTS idx_workflow_history_instance ON workflow_history(instance_id);
        "#,
        down: Some(r#"
            DROP TABLE IF EXISTS workflow_history;
            DROP TABLE IF EXISTS workflow_instances;
            DROP TABLE IF EXISTS workflow_definitions;
        "#),
    }
}
