//! ToolDescriptor Builder for consistent and fluent construction
//!
//! This module provides a builder pattern for creating ToolDescriptor instances
//! with a fluent API, reducing boilerplate and improving maintainability.

use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolContextRequirements, ToolDependency,
    ToolDescriptor, ToolExecutionMode, ToolMetadata, ToolParameter,
    ToolPermissionRequirement, ToolReturnType,
};

/// Builder for creating ToolDescriptor instances
///
/// # Example
///
/// ```rust,ignore
/// use crate::agent::tools::common::ToolDescriptorBuilder;
///
/// let descriptor = ToolDescriptorBuilder::new("my_tool", "My Tool", "Does something")
///     .category(ToolCategory::Core)
///     .parameters(vec![...])
///     .read_only()
///     .build();
/// ```
#[derive(Default)]
pub struct ToolDescriptorBuilder {
    id: Option<String>,
    name: Option<String>,
    description: Option<String>,
    category: ToolCategory,
    parameters: Vec<ToolParameter>,
    return_type: Option<ToolReturnType>,
    execution_mode: ToolExecutionMode,
    capabilities: Option<ToolCapabilities>,
    permissions: Option<Vec<ToolPermissionRequirement>>,
    dependencies: Option<Vec<ToolDependency>>,
    context_requirements: Option<ToolContextRequirements>,
    metadata: Option<ToolMetadata>,
    enabled: bool,
    deprecated: Option<bool>,
    deprecation_message: Option<String>,
    handler_module: Option<String>,
    handler_function: Option<String>,
}

impl ToolDescriptorBuilder {
    /// Create a new builder with required fields
    pub fn new(id: &str, name: &str, description: &str) -> Self {
        Self {
            id: Some(id.to_string()),
            name: Some(name.to_string()),
            description: Some(description.to_string()),
            category: ToolCategory::Core,
            parameters: Vec::new(),
            return_type: None,
            execution_mode: ToolExecutionMode::Sync,
            capabilities: None,
            permissions: None,
            dependencies: None,
            context_requirements: None,
            metadata: None,
            enabled: true,
            deprecated: None,
            deprecation_message: None,
            handler_module: None,
            handler_function: None,
        }
    }

    /// Set the tool category
    pub fn category(mut self, category: ToolCategory) -> Self {
        self.category = category;
        self
    }

    /// Set the parameters
    pub fn parameters(mut self, params: Vec<ToolParameter>) -> Self {
        self.parameters = params;
        self
    }

    /// Add a single parameter
    pub fn parameter(mut self, param: ToolParameter) -> Self {
        self.parameters.push(param);
        self
    }

    /// Set the return type
    pub fn return_type(mut self, return_type: ToolReturnType) -> Self {
        self.return_type = Some(return_type);
        self
    }

    /// Set the execution mode
    pub fn execution_mode(mut self, mode: ToolExecutionMode) -> Self {
        self.execution_mode = mode;
        self
    }

    /// Set capabilities
    pub fn capabilities(mut self, caps: ToolCapabilities) -> Self {
        self.capabilities = Some(caps);
        self
    }

    /// Mark tool as read-only (no side effects)
    pub fn read_only(mut self) -> Self {
        let caps = self.capabilities.get_or_insert_with(ToolCapabilities::default);
        caps.is_read_only = true;
        caps.has_side_effects = false;
        self
    }

    /// Mark tool as writable (has side effects)
    pub fn writable(mut self) -> Self {
        let caps = self.capabilities.get_or_insert_with(ToolCapabilities::default);
        caps.is_read_only = false;
        caps.has_side_effects = true;
        caps.requires_confirmation = true;
        self
    }

    /// Mark tool as requiring permission
    pub fn requires_permission(mut self) -> Self {
        let caps = self.capabilities.get_or_insert_with(ToolCapabilities::default);
        caps.requires_permission = true;
        self
    }

    /// Mark tool as supporting streaming
    pub fn supports_streaming(mut self) -> Self {
        let caps = self.capabilities.get_or_insert_with(ToolCapabilities::default);
        caps.supports_streaming = true;
        self
    }

    /// Mark tool as supporting cancellation
    pub fn supports_cancellation(mut self) -> Self {
        let caps = self.capabilities.get_or_insert_with(ToolCapabilities::default);
        caps.supports_cancellation = true;
        self
    }

    /// Mark tool as supporting retry
    pub fn supports_retry(mut self) -> Self {
        let caps = self.capabilities.get_or_insert_with(ToolCapabilities::default);
        caps.supports_retry = true;
        self
    }

    /// Set permissions
    pub fn permissions(mut self, perms: Vec<ToolPermissionRequirement>) -> Self {
        self.permissions = Some(perms);
        self
    }

    /// Add a permission requirement
    pub fn permission(mut self, perm: ToolPermissionRequirement) -> Self {
        self.permissions
            .get_or_insert_with(Vec::new)
            .push(perm);
        self
    }

    /// Set dependencies
    pub fn dependencies(mut self, deps: Vec<ToolDependency>) -> Self {
        self.dependencies = Some(deps);
        self
    }

    /// Set context requirements
    pub fn context_requirements(mut self, reqs: ToolContextRequirements) -> Self {
        self.context_requirements = Some(reqs);
        self
    }

    /// Set metadata
    pub fn metadata(mut self, meta: ToolMetadata) -> Self {
        self.metadata = Some(meta);
        self
    }

    /// Set enabled status
    pub fn enabled(mut self, enabled: bool) -> Self {
        self.enabled = enabled;
        self
    }

    /// Mark tool as deprecated
    pub fn deprecated(mut self, message: &str) -> Self {
        self.deprecated = Some(true);
        self.deprecation_message = Some(message.to_string());
        self
    }

    /// Set handler info
    pub fn handler(mut self, module: &str, function: &str) -> Self {
        self.handler_module = Some(module.to_string());
        self.handler_function = Some(function.to_string());
        self
    }

    /// Build the ToolDescriptor
    ///
    /// # Panics
    ///
    /// Panics if required fields (id, name, description) are not set.
    pub fn build(self) -> ToolDescriptor {
        ToolDescriptor {
            id: self.id.expect("id is required"),
            name: self.name.expect("name is required"),
            description: self.description.expect("description is required"),
            category: self.category,
            parameters: self.parameters,
            return_type: self.return_type,
            execution_mode: self.execution_mode,
            capabilities: self.capabilities.unwrap_or_else(ToolCapabilities::default),
            permissions: self.permissions,
            dependencies: self.dependencies,
            context_requirements: self.context_requirements,
            metadata: self.metadata.unwrap_or_else(|| ToolMetadata {
                author: None,
                version: "1.0.0".to_string(),
                license: None,
                homepage: None,
                repository: None,
                tags: Vec::new(),
                category: String::new(),
                subcategory: None,
            }),
            enabled: self.enabled,
            deprecated: self.deprecated,
            deprecation_message: self.deprecation_message,
            handler_module: self.handler_module,
            handler_function: self.handler_function,
        }
    }
}

impl ToolDescriptor {
    /// Create a new builder for this descriptor
    pub fn builder(id: &str, name: &str, description: &str) -> ToolDescriptorBuilder {
        ToolDescriptorBuilder::new(id, name, description)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_builder_basic() {
        let desc = ToolDescriptorBuilder::new("test_tool", "Test Tool", "A test tool")
            .category(ToolCategory::Core)
            .read_only()
            .build();

        assert_eq!(desc.id, "test_tool");
        assert_eq!(desc.name, "Test Tool");
        assert!(desc.capabilities.is_read_only);
        assert!(!desc.capabilities.has_side_effects);
    }

    #[test]
    fn test_builder_writable() {
        let desc = ToolDescriptorBuilder::new("write_tool", "Write Tool", "Writes things")
            .category(ToolCategory::Core)
            .writable()
            .requires_permission()
            .build();

        assert!(!desc.capabilities.is_read_only);
        assert!(desc.capabilities.has_side_effects);
        assert!(desc.capabilities.requires_permission);
        assert!(desc.capabilities.requires_confirmation);
    }
}
