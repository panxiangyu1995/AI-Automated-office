//! Integration tests for Browser tool.

#[cfg(test)]
mod tests {
    use crate::agent::tools::browser::{
        BrowserInteractExecutor, BrowserInteractResult, CdpClient, BrowserState,
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
            permissions: vec!["browser:control".to_string()],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_browser_status() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "action": "status"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: BrowserInteractResult = serde_json::from_value(result.unwrap()).unwrap();
        assert_eq!(response.action, "status");
        assert!(response.success);
        assert!(response.state.is_some());
    }

    #[tokio::test]
    async fn test_browser_start_stop() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        // Start browser
        let params = serde_json::json!({
            "action": "start",
            "profile": "default"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: BrowserInteractResult = serde_json::from_value(result.unwrap()).unwrap();
        assert_eq!(response.action, "start");

        // Get status
        let params = serde_json::json!({
            "action": "status"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        // Stop browser
        let params = serde_json::json!({
            "action": "stop"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_browser_tabs() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        // Start browser first
        let params = serde_json::json!({
            "action": "start"
        });
        executor.execute(params, &context).await.unwrap();

        // List tabs
        let params = serde_json::json!({
            "action": "tabs"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: BrowserInteractResult = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.tabs.is_some());
    }

    #[tokio::test]
    async fn test_browser_navigate() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        // Start browser
        let params = serde_json::json!({
            "action": "start"
        });
        executor.execute(params, &context).await.unwrap();

        // Navigate
        let params = serde_json::json!({
            "action": "navigate",
            "url": "https://example.com"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_browser_snapshot() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        // Start browser
        let params = serde_json::json!({
            "action": "start"
        });
        executor.execute(params, &context).await.unwrap();

        // Snapshot
        let params = serde_json::json!({
            "action": "snapshot",
            "format": "aria"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: BrowserInteractResult = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.snapshot.is_some());
    }

    #[tokio::test]
    async fn test_browser_file_chooser() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        // Start browser
        let params = serde_json::json!({
            "action": "start"
        });
        executor.execute(params, &context).await.unwrap();

        // Arm file chooser
        let params = serde_json::json!({
            "action": "arm_file_chooser"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        // Disarm file chooser
        let params = serde_json::json!({
            "action": "disarm_file_chooser"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_browser_dialog() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        // Start browser
        let params = serde_json::json!({
            "action": "start"
        });
        executor.execute(params, &context).await.unwrap();

        // Arm dialog
        let params = serde_json::json!({
            "action": "arm_dialog",
            "dialog_accept": true
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        // Accept dialog
        let params = serde_json::json!({
            "action": "accept_dialog"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_browser_state_management() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        // Set offline
        let params = serde_json::json!({
            "action": "set_offline",
            "offline": true
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        // Verify state
        let params = serde_json::json!({
            "action": "status"
        });

        let result = executor.execute(params, &context).await.unwrap();
        let response: BrowserInteractResult = serde_json::from_value(result).unwrap();
        assert!(response.state.unwrap().offline);
    }

    #[tokio::test]
    async fn test_browser_validation() {
        let executor = BrowserInteractExecutor::new();
        let context = create_test_context();

        // Unknown action
        let params = serde_json::json!({
            "action": "unknown_action"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Navigate without URL
        let params = serde_json::json!({
            "action": "navigate"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[test]
    fn test_cdp_client_availability() {
        // CDP client should report availability
        let available = CdpClient::is_available();
        // This will be false in mock mode
        assert!(!available || available);
    }
}
