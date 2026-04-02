//! Integration tests for Sessions tools.

#[cfg(test)]
mod tests {
    use crate::agent::tools::sessions::sessions_list::{
        SessionsListExecutor, SessionsListParams, SessionsVisibility,
    };
    use crate::agent::tools::sessions::sessions_history::{
        SessionsHistoryExecutor, SessionsHistoryParams,
    };
    use crate::agent::tools::sessions::sessions_spawn::{
        SessionsSpawnExecutor, SessionsSpawnParams,
    };
    use crate::agent::tools::sessions::sessions_send::{
        SessionsSendExecutor, SessionsSendParams,
    };
    use crate::agent::tools::sessions::session_status::{
        SessionStatusExecutor, SessionStatusParams,
    };
    use crate::agent::tools::pipeline::ToolExecutionContext;

    fn create_test_context() -> ToolExecutionContext {
        ToolExecutionContext {
            session_id: "test-session".to_string(),
            user_id: "test-user".to_string(),
            tenant_id: "test-tenant".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec![
                "sessions:read".to_string(),
                "sessions:write".to_string(),
                "sessions:admin".to_string(),
            ],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_sessions_list_basic() {
        let executor = SessionsListExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({});

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: serde_json::Value = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response["sessions"].is_array());
        assert!(response["total"].as_i64().unwrap() >= 0);
    }

    #[tokio::test]
    async fn test_sessions_list_with_visibility() {
        let executor = SessionsListExecutor::new();
        let context = create_test_context();

        let visibilities = ["self", "tree", "agent", "all"];
        for visibility in visibilities {
            let params = serde_json::json!({
                "visibility": visibility,
                "limit": 10
            });

            let result = executor.execute(params, &context).await;
            assert!(result.is_ok(), "Failed for visibility: {}", visibility);
        }
    }

    #[tokio::test]
    async fn test_sessions_list_validation() {
        let executor = SessionsListExecutor::new();
        let context = create_test_context();

        // Exceed limit
        let params = serde_json::json!({
            "limit": 200
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_history_basic() {
        let executor = SessionsHistoryExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "limit": 10
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: serde_json::Value = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response["messages"].is_array());
    }

    #[tokio::test]
    async fn test_sessions_history_validation() {
        let executor = SessionsHistoryExecutor::new();
        let context = create_test_context();

        // Empty session_id
        let params = serde_json::json!({
            "session_id": "",
            "limit": 10
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_spawn_basic() {
        let executor = SessionsSpawnExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "task": "Complete data analysis",
            "ttl_seconds": 300
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: serde_json::Value = serde_json::from_value(result.unwrap()).unwrap();
        assert!(!response["session_id"].as_str().unwrap().is_empty());
        assert!(!response["task_id"].as_str().unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_sessions_spawn_validation() {
        let executor = SessionsSpawnExecutor::new();
        let context = create_test_context();

        // Empty task
        let params = serde_json::json!({
            "task": "",
            "ttl_seconds": 300
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Invalid TTL (too long)
        let params = serde_json::json!({
            "task": "Test task",
            "ttl_seconds": 5000
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_send_basic() {
        let executor = SessionsSendExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": "Hello from test!"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: serde_json::Value = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response["success"].as_bool().unwrap());
    }

    #[tokio::test]
    async fn test_session_status_basic() {
        let executor = SessionStatusExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({});

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: serde_json::Value = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response["session"].is_object());
    }

    #[tokio::test]
    async fn test_session_status_with_children() {
        let executor = SessionStatusExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "include_children": true
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
    }
}
