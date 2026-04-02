//! Tests for the audit logging module.

#[cfg(test)]
mod tests {
    use crate::knowledge::audit::{
        AuditAction, AuditEntityType, AuditLogFilter, AuditService, PaginatedAuditLogs,
    };
    use crate::knowledge::crud::KnowledgeBaseService;
    use std::sync::Arc;

    fn create_test_service() -> Arc<AuditService> {
        Arc::new(AuditService::new(Arc::new(
            KnowledgeBaseService::new()
        )))
    }

    #[tokio::test]
    async fn test_log_basic() {
        let service = create_test_service();

        let log = service
            .log(
                "tenant1",
                "user1",
                AuditAction::Create,
                AuditEntityType::KnowledgeBase,
                "kb1",
                Some("Test KB"),
                serde_json::json!({"name": "Test KB"}),
                Some("127.0.0.1"),
                Some("Mozilla/5.0"),
            )
            .await
            .unwrap();

        assert_eq!(log.tenant_id, "tenant1");
        assert_eq!(log.user_id, "user1");
        assert_eq!(log.action, AuditAction::Create);
        assert_eq!(log.entity_type, AuditEntityType::KnowledgeBase);
        assert_eq!(log.entity_id, "kb1");
        assert_eq!(log.entity_name, Some("Test KB".to_string()));
        assert!(log.ip_address.is_some());
        assert!(log.user_agent.is_some());
    }

    #[tokio::test]
    async fn test_log_kb_create() {
        let service = create_test_service();

        let log = service
            .log_kb_create("tenant1", "user1", "kb1", "My Knowledge Base")
            .await
            .unwrap();

        assert_eq!(log.action, AuditAction::Create);
        assert_eq!(log.entity_type, AuditEntityType::KnowledgeBase);
        assert_eq!(log.entity_name, Some("My Knowledge Base".to_string()));
    }

    #[tokio::test]
    async fn test_log_kb_update() {
        let service = create_test_service();

        let changes = serde_json::json!({
            "name": ["Old Name", "New Name"]
        });

        let log = service
            .log_kb_update("tenant1", "user1", "kb1", "My KB", changes)
            .await
            .unwrap();

        assert_eq!(log.action, AuditAction::Update);
        assert_eq!(log.entity_type, AuditEntityType::KnowledgeBase);
    }

    #[tokio::test]
    async fn test_log_kb_delete() {
        let service = create_test_service();

        let log = service
            .log_kb_delete("tenant1", "user1", "kb1", "My KB")
            .await
            .unwrap();

        assert_eq!(log.action, AuditAction::Delete);
        assert_eq!(log.entity_type, AuditEntityType::KnowledgeBase);
    }

    #[tokio::test]
    async fn test_log_document_upload() {
        let service = create_test_service();

        let log = service
            .log_document_upload("tenant1", "user1", "doc1", "report.pdf", "kb1")
            .await
            .unwrap();

        assert_eq!(log.action, AuditAction::Upload);
        assert_eq!(log.entity_type, AuditEntityType::Document);
        assert_eq!(log.entity_name, Some("report.pdf".to_string()));
    }

    #[tokio::test]
    async fn test_log_document_delete() {
        let service = create_test_service();

        let log = service
            .log_document_delete("tenant1", "user1", "doc1", "report.pdf")
            .await
            .unwrap();

        assert_eq!(log.action, AuditAction::Delete);
        assert_eq!(log.entity_type, AuditEntityType::Document);
    }

    #[tokio::test]
    async fn test_log_permission_change() {
        let service = create_test_service();

        let log = service
            .log_permission_change("tenant1", "owner1", "kb1", "user1", "read", "write")
            .await
            .unwrap();

        assert_eq!(log.action, AuditAction::PermissionChange);
        assert_eq!(log.entity_type, AuditEntityType::Member);
    }

    #[tokio::test]
    async fn test_query_empty() {
        let service = create_test_service();

        let result = service
            .query(
                "tenant1",
                crate::knowledge::crud::PaginationParams {
                    page: 1,
                    page_size: 10,
                },
                AuditLogFilter::default(),
            )
            .await
            .unwrap();

        assert_eq!(result.items.len(), 0);
        assert_eq!(result.total, 0);
    }

    #[tokio::test]
    async fn test_query_with_logs() {
        let service = create_test_service();

        // Create some logs
        service
            .log_kb_create("tenant1", "user1", "kb1", "KB 1")
            .await
            .unwrap();
        service
            .log_kb_create("tenant1", "user1", "kb2", "KB 2")
            .await
            .unwrap();
        service
            .log_document_upload("tenant1", "user1", "doc1", "Doc 1", "kb1")
            .await
            .unwrap();

        let result = service
            .query(
                "tenant1",
                crate::knowledge::crud::PaginationParams {
                    page: 1,
                    page_size: 10,
                },
                AuditLogFilter::default(),
            )
            .await
            .unwrap();

        assert_eq!(result.items.len(), 3);
        assert_eq!(result.total, 3);
    }

    #[tokio::test]
    async fn test_query_by_entity_type() {
        let service = create_test_service();

        service
            .log_kb_create("tenant1", "user1", "kb1", "KB 1")
            .await
            .unwrap();
        service
            .log_document_upload("tenant1", "user1", "doc1", "Doc 1", "kb1")
            .await
            .unwrap();

        let result = service
            .query(
                "tenant1",
                crate::knowledge::crud::PaginationParams {
                    page: 1,
                    page_size: 10,
                },
                AuditLogFilter {
                    entity_type: Some(AuditEntityType::KnowledgeBase),
                    ..Default::default()
                },
            )
            .await
            .unwrap();

        assert_eq!(result.items.len(), 1);
        assert_eq!(result.items[0].entity_type, AuditEntityType::KnowledgeBase);
    }

    #[tokio::test]
    async fn test_query_by_action() {
        let service = create_test_service();

        service
            .log_kb_create("tenant1", "user1", "kb1", "KB 1")
            .await
            .unwrap();
        service
            .log_kb_delete("tenant1", "user1", "kb2", "KB 2")
            .await
            .unwrap();
        service
            .log_document_upload("tenant1", "user1", "doc1", "Doc 1", "kb1")
            .await
            .unwrap();

        let result = service
            .query(
                "tenant1",
                crate::knowledge::crud::PaginationParams {
                    page: 1,
                    page_size: 10,
                },
                AuditLogFilter {
                    action: Some(AuditAction::Create),
                    ..Default::default()
                },
            )
            .await
            .unwrap();

        assert_eq!(result.items.len(), 2);
        assert!(result.items.iter().all(|l| l.action == AuditAction::Create));
    }

    #[tokio::test]
    async fn test_query_by_user() {
        let service = create_test_service();

        service
            .log_kb_create("tenant1", "user1", "kb1", "KB 1")
            .await
            .unwrap();
        service
            .log_kb_create("tenant1", "user2", "kb2", "KB 2")
            .await
            .unwrap();

        let result = service
            .query(
                "tenant1",
                crate::knowledge::crud::PaginationParams {
                    page: 1,
                    page_size: 10,
                },
                AuditLogFilter {
                    user_id: Some("user1".to_string()),
                    ..Default::default()
                },
            )
            .await
            .unwrap();

        assert_eq!(result.items.len(), 1);
        assert_eq!(result.items[0].user_id, "user1");
    }

    #[tokio::test]
    async fn test_query_tenant_isolation() {
        let service = create_test_service();

        service
            .log_kb_create("tenant1", "user1", "kb1", "KB 1")
            .await
            .unwrap();
        service
            .log_kb_create("tenant2", "user1", "kb2", "KB 2")
            .await
            .unwrap();

        let result = service
            .query(
                "tenant1",
                crate::knowledge::crud::PaginationParams {
                    page: 1,
                    page_size: 10,
                },
                AuditLogFilter::default(),
            )
            .await
            .unwrap();

        assert_eq!(result.items.len(), 1);
        assert_eq!(result.items[0].tenant_id, "tenant1");
    }

    #[tokio::test]
    async fn test_query_pagination() {
        let service = create_test_service();

        // Create 5 logs
        for i in 1..=5 {
            service
                .log_kb_create("tenant1", "user1", &format!("kb{}", i), &format!("KB {}", i))
                .await
                .unwrap();
        }

        let result = service
            .query(
                "tenant1",
                crate::knowledge::crud::PaginationParams {
                    page: 1,
                    page_size: 2,
                },
                AuditLogFilter::default(),
            )
            .await
            .unwrap();

        assert_eq!(result.items.len(), 2);
        assert_eq!(result.total, 5);
        assert_eq!(result.total_pages, 3);
        assert_eq!(result.page, 1);
        assert_eq!(result.page_size, 2);
    }

    #[tokio::test]
    async fn test_query_sorted_by_created_at_desc() {
        let service = create_test_service();

        service
            .log_kb_create("tenant1", "user1", "kb1", "KB 1")
            .await
            .unwrap();
        service
            .log_kb_create("tenant1", "user1", "kb2", "KB 2")
            .await
            .unwrap();
        service
            .log_kb_create("tenant1", "user1", "kb3", "KB 3")
            .await
            .unwrap();

        let result = service
            .query(
                "tenant1",
                crate::knowledge::crud::PaginationParams {
                    page: 1,
                    page_size: 10,
                },
                AuditLogFilter::default(),
            )
            .await
            .unwrap();

        // Most recent first
        assert!(result.items[0].created_at >= result.items[1].created_at);
        assert!(result.items[1].created_at >= result.items[2].created_at);
    }
}
