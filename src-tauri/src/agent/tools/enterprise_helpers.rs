//! Enterprise tools - helper functions and descriptor builders



use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolContextRequirements, ToolDescriptor,
    ToolExecutionMode, ToolMetadata, ToolParameter, ToolParameterType,
    ToolParameterTypeSpec, ToolPermissionRequirement,
};

// ==================== Helper Functions ====================

pub fn base_metadata(category: &str, tags: Vec<&str>) -> ToolMetadata {
    ToolMetadata {
        author: Some("core".to_string()),
        version: "1.0.0".to_string(),
        license: None,
        homepage: None,
        repository: None,
        tags: tags.into_iter().map(|tag| tag.to_string()).collect(),
        category: category.to_string(),
        subcategory: None,
    }
}

pub fn base_capabilities() -> ToolCapabilities {
    ToolCapabilities {
        supports_streaming: false,
        supports_cancellation: true,
        requires_permission: true,
        requires_confirmation: false,
        is_read_only: true,
        has_side_effects: false,
        supports_retry: true,
        estimated_duration: None,
    }
}

pub fn string_param(name: &str, description: &str, required: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

pub fn number_param(name: &str, description: &str, required: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

pub fn bool_param(name: &str, description: &str, required: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

pub fn object_param(name: &str, description: &str, required: bool, properties: std::collections::HashMap<String, ToolParameter>) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: Some(properties),
    }
}

pub fn array_param(name: &str, description: &str, required: bool, items: ToolParameter) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Array),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: Some(Box::new(items)),
        properties: None,
    }
}

// ==================== Tool Descriptors ====================

// --- Resource Tools ---

pub fn create_resource_query_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = true;
    capabilities.requires_permission = true;

    ToolDescriptor {
        id: "resource_query".to_string(),
        name: "Resource Query".to_string(),
        description: "Query cloud and workspace resources".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("type", "Resource type: local, cloud, or workspace", true),
            string_param("path", "Resource path or key (optional based on type)", false),
            string_param("bucket", "Cloud bucket name (for cloud type)", false),
            string_param("key", "Cloud object key (for cloud type)", false),
            string_param("page_id", "Workspace page ID (for workspace type)", false),
            object_param("filters", "Filter criteria (dateRange, owner, type)", false, std::collections::HashMap::new()),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "resource".to_string(),
            resource: "read".to_string(),
            description: "Read resources from cloud or workspace".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: true,
            requires_network_access: true,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["resource", "cloud", "workspace"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("resource_query".to_string()),
    }
}

pub fn create_resource_upload_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = false;
    capabilities.has_side_effects = true;
    capabilities.requires_confirmation = true;

    ToolDescriptor {
        id: "resource_upload".to_string(),
        name: "Resource Upload".to_string(),
        description: "Upload files to controlled storage".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("data", "Base64 encoded file data", true),
            string_param("destination", "Destination path or key", true),
            string_param("type", "Destination type: local, cloud, or workspace", true),
            string_param("content_type", "MIME type of the file", false),
            object_param("metadata", "Additional metadata for the resource", false, std::collections::HashMap::new()),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "resource".to_string(),
            resource: "write".to_string(),
            description: "Upload resources to cloud or workspace".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: true,
            requires_network_access: true,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["resource", "upload", "cloud"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("resource_upload".to_string()),
    }
}

// --- Knowledge Tools ---

pub fn create_knowledge_query_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = true;

    ToolDescriptor {
        id: "knowledge_query".to_string(),
        name: "Knowledge Query".to_string(),
        description: "Query enterprise knowledge base using RAG retrieval".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("query", "Natural language query string", true),
            number_param("top_k", "Maximum number of results to return", false),
            string_param("department", "Filter by department ID", false),
            string_param("date_range", "Filter by date range (format: start,end)", false),
            array_param("tags", "Filter by tags", false, string_param("tag", "Tag value", false)),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "knowledge".to_string(),
            resource: "read".to_string(),
            description: "Query knowledge base entries".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: false,
            requires_network_access: false,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["knowledge", "rag", "retrieval"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("knowledge_query".to_string()),
    }
}

pub fn create_knowledge_submit_draft_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = false;
    capabilities.has_side_effects = true;
    capabilities.requires_confirmation = true;

    ToolDescriptor {
        id: "knowledge_submit_draft".to_string(),
        name: "Knowledge Submit Draft".to_string(),
        description: "Submit knowledge entry drafts for review".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("content", "Draft content to submit", true),
            string_param("title", "Draft title", true),
            string_param("category", "Knowledge category", false),
            array_param("tags", "Tags for the draft", false, string_param("tag", "Tag value", false)),
            object_param("metadata", "Additional metadata", false, std::collections::HashMap::new()),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "knowledge".to_string(),
            resource: "write".to_string(),
            description: "Submit knowledge drafts".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: false,
            requires_network_access: false,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["knowledge", "draft", "submit"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("knowledge_submit_draft".to_string()),
    }
}

// --- Messaging Tools ---

pub fn create_message_query_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = true;

    ToolDescriptor {
        id: "message_query".to_string(),
        name: "Message Query".to_string(),
        description: "Query message context from users or channels".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("target", "Query target type: user, channel, or session", true),
            string_param("target_id", "Target ID (user_id, channel_id, or session_id)", true),
            number_param("limit", "Maximum number of messages to return", false),
            string_param("date_range", "Filter by date range (format: start,end)", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "message".to_string(),
            resource: "read".to_string(),
            description: "Read messages from users or channels".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: false,
            requires_network_access: false,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["message", "query", "messaging"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("message_query".to_string()),
    }
}

pub fn create_message_send_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = false;
    capabilities.has_side_effects = true;

    ToolDescriptor {
        id: "message_send".to_string(),
        name: "Message Send".to_string(),
        description: "Send messages to users or channels".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("target", "Send target type: user, channel, agent, or department", true),
            string_param("target_id", "Target ID", true),
            string_param("content", "Message content to send", true),
            string_param("sender", "Sender type: user or agent (default: agent)", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "message".to_string(),
            resource: "write".to_string(),
            description: "Send messages to users or channels".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: false,
            requires_network_access: false,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["message", "send", "messaging"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("message_send".to_string()),
    }
}

pub fn create_agent_delegate_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = false;
    capabilities.has_side_effects = true;
    capabilities.requires_confirmation = true;

    ToolDescriptor {
        id: "agent_delegate".to_string(),
        name: "Agent Delegate".to_string(),
        description: "Delegate tasks to sub-agents".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("agent_config", "JSON configuration for the sub-agent", true),
            string_param("task_spec", "Task specification for the sub-agent", true),
            string_param("parent_session_id", "Parent session ID for result aggregation", false),
            number_param("ttl_seconds", "Task TTL in seconds (default: 3600)", false),
            number_param("max_depth", "Maximum delegation depth (default: 3)", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "agent".to_string(),
            resource: "delegate".to_string(),
            description: "Delegate tasks to sub-agents".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: false,
            requires_network_access: false,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["agent", "delegate", "subagent"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("agent_delegate".to_string()),
    }
}

// --- Workspace Tools ---

pub fn create_workspace_stage_change_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = false;
    capabilities.has_side_effects = true;

    ToolDescriptor {
        id: "workspace_stage_change".to_string(),
        name: "Workspace Stage Change".to_string(),
        description: "Stage candidate changes for workspace pages or editors".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("action", "Action: stage, query, or discard", true),
            string_param("page_id", "Page ID for the change", false),
            string_param("editor_id", "Editor ID for the change", false),
            object_param("changes", "Structured diff changes (before/after JSON)", false, std::collections::HashMap::new()),
            string_param("change_id", "Change ID to discard (for discard action)", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "workspace".to_string(),
            resource: "stage".to_string(),
            description: "Stage changes in workspace".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: true,
            requires_network_access: false,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["workspace", "stage", "change"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("workspace_stage_change".to_string()),
    }
}

// --- Database Tools ---

pub fn create_db_query_descriptor() -> ToolDescriptor {
    let mut capabilities = base_capabilities();
    capabilities.is_read_only = true;
    capabilities.requires_permission = true;
    capabilities.requires_confirmation = true;

    ToolDescriptor {
        id: "db_query".to_string(),
        name: "Database Query".to_string(),
        description: "Query cloud database (admin-only, restricted)".to_string(),
        category: ToolCategory::Core,
        parameters: vec![
            string_param("table", "Table name from whitelist", true),
            object_param("filters", "Query filters (field: value pairs)", false, std::collections::HashMap::new()),
            array_param("fields", "Fields to select", false, string_param("field", "Field name", false)),
            number_param("page", "Page number for pagination (default: 1)", false),
            number_param("page_size", "Page size for pagination (default: 100)", false),
        ],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(vec![ToolPermissionRequirement {
            permission_type: "database".to_string(),
            resource: "admin".to_string(),
            description: "Admin-only database query access".to_string(),
            optional: Some(false),
        }]),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: true,
            requires_user_context: true,
            requires_workspace: false,
            requires_network_access: true,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("enterprise", vec!["database", "admin", "query"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("enterprise".to_string()),
        handler_function: Some("db_query".to_string()),
    }
}

// ==================== Tool Executors ====================

