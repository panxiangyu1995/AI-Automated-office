//! Integration tests for Memory tools.

#[cfg(test)]
mod tests {
    use crate::agent::tools::memory::memory_search::{
        MemorySearchExecutor, MemorySearchParams, MemorySource, cosine_similarity,
    };
    use crate::agent::tools::memory::memory_get::{MemoryGetExecutor, MemoryGetParams};
    use crate::agent::tools::pipeline::ToolExecutionContext;

    fn create_test_context() -> ToolExecutionContext {
        ToolExecutionContext {
            session_id: "test-session".to_string(),
            user_id: "test-user".to_string(),
            tenant_id: "test-tenant".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["memory:read".to_string()],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_memory_search_basic() {
        let executor = MemorySearchExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "query": "user preferences",
            "max_results": 5
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: serde_json::Value = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response["results"].is_array());
        assert_eq!(response["query"], "user preferences");
    }

    #[tokio::test]
    async fn test_memory_search_with_filters() {
        let executor = MemorySearchExecutor::new();
        let context = create_test_context();

        // Test with source filter
        let params = serde_json::json!({
            "query": "test",
            "max_results": 5,
            "sources": ["memory"]
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        // Test with min_score filter
        let params = serde_json::json!({
            "query": "test",
            "max_results": 5,
            "min_score": 0.8
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_memory_search_validation() {
        let executor = MemorySearchExecutor::new();
        let context = create_test_context();

        // Empty query
        let params = serde_json::json!({
            "query": "",
            "max_results": 5
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Zero max_results
        let params = serde_json::json!({
            "query": "test",
            "max_results": 0
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Invalid min_score
        let params = serde_json::json!({
            "query": "test",
            "max_results": 5,
            "min_score": 1.5
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_memory_get_basic() {
        let executor = MemoryGetExecutor::new();
        let context = create_test_context();

        // First search to get an ID
        let search_executor = MemorySearchExecutor::new();
        let search_params = serde_json::json!({
            "query": "user preferences",
            "max_results": 1
        });
        let search_result = search_executor.execute(search_params, &context).await.unwrap();
        let search_response: serde_json::Value = serde_json::from_value(search_result).unwrap();

        if !search_response["results"].as_array().unwrap().is_empty() {
            let id = &search_response["results"][0]["id"];

            // Get by ID
            let get_params = serde_json::json!({
                "id": id
            });
            let result = executor.execute(get_params, &context).await;
            assert!(result.is_ok());

            let response: serde_json::Value = serde_json::from_value(result.unwrap()).unwrap();
            assert_eq!(response["id"], *id);
            assert!(response["found"].as_bool().unwrap());
        }
    }

    #[tokio::test]
    async fn test_memory_get_not_found() {
        let executor = MemoryGetExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "id": "non-existent-id-12345"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[test]
    fn test_cosine_similarity() {
        // Identical vectors
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.001);

        // Orthogonal vectors
        let c = vec![1.0, 0.0, 0.0];
        let d = vec![0.0, 1.0, 0.0];
        assert!((cosine_similarity(&c, &d) - 0.0).abs() < 0.001);

        // Negative correlation
        let e = vec![1.0, 0.0, 0.0];
        let f = vec![-1.0, 0.0, 0.0];
        assert!((cosine_similarity(&e, &f) - (-1.0)).abs() < 0.001);
    }

    #[test]
    fn test_memory_source_serialization() {
        let source = MemorySource::Memory;
        let json = serde_json::to_string(&source).unwrap();
        assert_eq!(json, "\"memory\"");

        let parsed: MemorySource = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, MemorySource::Memory);
    }
}
