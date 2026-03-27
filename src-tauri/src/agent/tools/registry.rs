use std::collections::HashMap;

use super::descriptor::{validate_parameters, ToolDescriptor};

#[derive(Default)]
pub struct ToolRegistry {
    tools: HashMap<String, ToolDescriptor>,
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self {
            tools: HashMap::new(),
        }
    }

    pub fn register(&mut self, descriptor: ToolDescriptor) {
        self.tools.insert(descriptor.id.clone(), descriptor);
    }

    pub fn get(&self, tool_id: &str) -> Option<&ToolDescriptor> {
        self.tools.get(tool_id)
    }

    pub fn list(&self) -> Vec<ToolDescriptor> {
        self.tools.values().cloned().collect()
    }

    pub fn validate(
        &self,
        tool_id: &str,
        params: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<(), Vec<String>> {
        let descriptor = self
            .get(tool_id)
            .ok_or_else(|| vec![format!("Tool not found: {}", tool_id)])?;
        validate_parameters(descriptor, params)
    }
}
