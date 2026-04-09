use std::collections::HashMap;
use std::sync::Mutex;

use super::descriptor::{validate_parameters, ToolDescriptor};

#[derive(Default)]
pub struct ToolRegistry {
    tools: Mutex<HashMap<String, ToolDescriptor>>,
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self {
            tools: Mutex::new(HashMap::new()),
        }
    }

    pub fn register(&self, descriptor: ToolDescriptor) {
        self.tools.lock().unwrap().insert(descriptor.id.clone(), descriptor);
    }

    pub fn unregister(&self, tool_id: &str) -> Option<ToolDescriptor> {
        self.tools.lock().unwrap().remove(tool_id)
    }

    pub fn get(&self, tool_id: &str) -> Option<ToolDescriptor> {
        self.tools.lock().unwrap().get(tool_id).cloned()
    }

    pub fn list(&self) -> Vec<ToolDescriptor> {
        self.tools.lock().unwrap().values().cloned().collect()
    }

    pub fn validate(
        &self,
        tool_id: &str,
        params: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<(), Vec<String>> {
        let descriptor = self
            .get(tool_id)
            .ok_or_else(|| vec![format!("Tool not found: {}", tool_id)])?;
        validate_parameters(&descriptor, params)
    }

    /// Filter tools to only include read-only tools (for Plan mode)
    pub fn filter_readonly_tools(&self) -> Vec<ToolDescriptor> {
        self.tools
            .lock()
            .unwrap()
            .values()
            .filter(|tool| tool.capabilities.is_read_only)
            .cloned()
            .collect()
    }
}
