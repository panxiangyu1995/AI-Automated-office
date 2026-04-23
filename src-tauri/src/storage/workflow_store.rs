//! Workflow Storage Module
//!
//! Provides database persistence for workflow definitions and instances.

use anyhow::Result;
use sqlx::{Row, SqlitePool};

use crate::workflow::types::*;

/// Workflow storage for persisting workflow data
pub struct WorkflowStore {
    pool: SqlitePool,
}

impl WorkflowStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    // === Definition Operations ===

    /// Save a workflow definition
    pub async fn save_definition(&self, definition: &WorkflowDefinition) -> Result<()> {
        let steps_json = serde_json::to_string(&definition.steps)?;
        
        sqlx::query(
            r#"
            INSERT INTO workflow_definitions 
            (id, tenant_id, name, description, steps_json, timeout_minutes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                steps_json = excluded.steps_json,
                timeout_minutes = excluded.timeout_minutes,
                updated_at = excluded.updated_at
            "#,
        )
        .bind(&definition.id)
        .bind(&definition.tenant_id)
        .bind(&definition.name)
        .bind(&definition.description)
        .bind(&steps_json)
        .bind(definition.timeout_minutes.map(|t| t as i64))
        .bind(definition.created_at.timestamp())
        .bind(definition.updated_at.timestamp())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get a workflow definition by ID
    pub async fn get_definition(&self, id: &str) -> Result<Option<WorkflowDefinition>> {
        let row = sqlx::query(
            "SELECT * FROM workflow_definitions WHERE id = ? LIMIT 1;"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => Ok(Some(self.row_to_definition(row)?)),
            None => Ok(None),
        }
    }

    /// List workflow definitions for a tenant
    pub async fn list_definitions(&self, tenant_id: &str) -> Result<Vec<WorkflowDefinition>> {
        let rows = sqlx::query(
            "SELECT * FROM workflow_definitions WHERE tenant_id = ? ORDER BY updated_at DESC;"
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await?;

        let mut definitions = Vec::new();
        for row in rows {
            definitions.push(self.row_to_definition(row)?);
        }
        Ok(definitions)
    }

    /// Delete a workflow definition
    pub async fn delete_definition(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM workflow_definitions WHERE id = ?;")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    // === Instance Operations ===

    /// Save a workflow instance
    pub async fn save_instance(&self, instance: &WorkflowInstance) -> Result<()> {
        let context_json = serde_json::to_string(&instance.context)?;
        let history_json = serde_json::to_string(&instance.history)?;
        let state_str = serde_json::to_string(&instance.state)?;

        sqlx::query(
            r#"
            INSERT INTO workflow_instances 
            (id, definition_id, tenant_id, state, current_step_id, context_json, history_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                state = excluded.state,
                current_step_id = excluded.current_step_id,
                context_json = excluded.context_json,
                history_json = excluded.history_json,
                updated_at = excluded.updated_at
            "#,
        )
        .bind(&instance.id)
        .bind(&instance.definition_id)
        .bind(&instance.tenant_id)
        .bind(&state_str)
        .bind(&instance.current_step_id)
        .bind(&context_json)
        .bind(&history_json)
        .bind(instance.created_at.timestamp())
        .bind(instance.updated_at.timestamp())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get a workflow instance by ID
    pub async fn get_instance(&self, id: &str) -> Result<Option<WorkflowInstance>> {
        let row = sqlx::query(
            "SELECT * FROM workflow_instances WHERE id = ? LIMIT 1;"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => Ok(Some(self.row_to_instance(row)?)),
            None => Ok(None),
        }
    }

    /// List workflow instances for a tenant
    pub async fn list_instances(&self, tenant_id: &str) -> Result<Vec<WorkflowInstance>> {
        let rows = sqlx::query(
            "SELECT * FROM workflow_instances WHERE tenant_id = ? ORDER BY updated_at DESC;"
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await?;

        let mut instances = Vec::new();
        for row in rows {
            instances.push(self.row_to_instance(row)?);
        }
        Ok(instances)
    }

    /// List workflow instances by state
    pub async fn list_instances_by_state(&self, tenant_id: &str, state: &str) -> Result<Vec<WorkflowInstance>> {
        let rows = sqlx::query(
            "SELECT * FROM workflow_instances WHERE tenant_id = ? AND state LIKE ? ORDER BY updated_at DESC;"
        )
        .bind(tenant_id)
        .bind(format!("%{}%", state))
        .fetch_all(&self.pool)
        .await?;

        let mut instances = Vec::new();
        for row in rows {
            instances.push(self.row_to_instance(row)?);
        }
        Ok(instances)
    }

    /// Delete a workflow instance
    pub async fn delete_instance(&self, id: &str) -> Result<bool> {
        // Delete history first
        sqlx::query("DELETE FROM workflow_history WHERE instance_id = ?;")
            .bind(id)
            .execute(&self.pool)
            .await?;

        let result = sqlx::query("DELETE FROM workflow_instances WHERE id = ?;")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    // === History Operations ===

    /// Add a step result to history
    pub async fn add_history(&self, instance_id: &str, result: &StepResult) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO workflow_history 
            (instance_id, step_id, step_type, result_json, success, error, duration_ms, executed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(instance_id)
        .bind(&result.step_id)
        .bind(&result.step_type)
        .bind(serde_json::to_string(&result.result)?)
        .bind(result.success as i32)
        .bind(&result.error)
        .bind(result.duration_ms as i64)
        .bind(result.executed_at.timestamp())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get history for an instance
    pub async fn get_history(&self, instance_id: &str) -> Result<Vec<StepResult>> {
        let rows = sqlx::query(
            "SELECT * FROM workflow_history WHERE instance_id = ? ORDER BY executed_at ASC;"
        )
        .bind(instance_id)
        .fetch_all(&self.pool)
        .await?;

        let mut results = Vec::new();
        for row in rows {
            let result_json_str: String = row.get("result_json");
            let result = StepResult {
                step_id: row.get("step_id"),
                step_type: row.get("step_type"),
                result: serde_json::from_str(&result_json_str).unwrap_or(serde_json::json!({})),
                success: row.get::<i32, _>("success") != 0,
                error: row.get("error"),
                duration_ms: row.get::<i64, _>("duration_ms") as u64,
                executed_at: chrono::DateTime::from_timestamp(row.get::<i64, _>("executed_at"), 0)
                    .unwrap_or_else(chrono::Utc::now),
            };
            results.push(result);
        }
        Ok(results)
    }

    // === Helper Methods ===

    fn row_to_definition(&self, row: sqlx::sqlite::SqliteRow) -> Result<WorkflowDefinition> {
        let steps_json_str: String = row.get("steps_json");
        let steps: Vec<WorkflowStep> = serde_json::from_str(&steps_json_str)
            .unwrap_or_default();

        Ok(WorkflowDefinition {
            id: row.get("id"),
            tenant_id: row.get("tenant_id"),
            name: row.get("name"),
            description: row.get("description"),
            steps,
            timeout_minutes: row.get::<Option<i64>, _>("timeout_minutes").map(|t| t as u32),
            created_at: chrono::DateTime::from_timestamp(row.get::<i64, _>("created_at"), 0)
                .unwrap_or_else(chrono::Utc::now),
            updated_at: chrono::DateTime::from_timestamp(row.get::<i64, _>("updated_at"), 0)
                .unwrap_or_else(chrono::Utc::now),
        })
    }

    fn row_to_instance(&self, row: sqlx::sqlite::SqliteRow) -> Result<WorkflowInstance> {
        let state_str: String = row.get("state");
        let context_json_str: String = row.get("context_json");
        let history_json_str: String = row.get("history_json");

        let state: WorkflowState = serde_json::from_str(&state_str)
            .unwrap_or(WorkflowState::Pending);
        let context: serde_json::Value = serde_json::from_str(&context_json_str)
            .unwrap_or(serde_json::json!({}));
        let history: Vec<StepResult> = serde_json::from_str(&history_json_str)
            .unwrap_or_default();

        Ok(WorkflowInstance {
            id: row.get("id"),
            definition_id: row.get("definition_id"),
            state,
            current_step_id: row.get("current_step_id"),
            context,
            history,
            tenant_id: row.get("tenant_id"),
            created_at: chrono::DateTime::from_timestamp(row.get::<i64, _>("created_at"), 0)
                .unwrap_or_else(chrono::Utc::now),
            updated_at: chrono::DateTime::from_timestamp(row.get::<i64, _>("updated_at"), 0)
                .unwrap_or_else(chrono::Utc::now),
        })
    }
}
