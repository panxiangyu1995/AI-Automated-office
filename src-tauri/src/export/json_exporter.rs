//! JSON 导出器模块
//!
//! 提供 JSON 格式的数据导出功能

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// JSON 导出配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonExportConfig {
    /// 是否格式化输出
    pub pretty: bool,
    /// 是否包含元数据
    pub include_metadata: bool,
    /// 缩进空格数
    pub indent: usize,
}

impl Default for JsonExportConfig {
    fn default() -> Self {
        Self {
            pretty: true,
            include_metadata: true,
            indent: 2,
        }
    }
}

/// JSON 导出元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonExportMetadata {
    /// 导出时间
    pub exported_at: DateTime<Utc>,
    /// 记录数
    pub record_count: usize,
    /// 实体类型
    pub entity_type: String,
    /// 格式版本
    pub version: String,
}

impl JsonExportMetadata {
    /// 创建新的元数据
    pub fn new(entity_type: String, record_count: usize) -> Self {
        Self {
            exported_at: Utc::now(),
            record_count,
            entity_type,
            version: "1.0".to_string(),
        }
    }
}

/// JSON 导出结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonExportResult {
    /// 导出的 JSON 字符串
    pub content: String,
    /// 元数据
    pub metadata: JsonExportMetadata,
    /// 字节数
    pub byte_size: usize,
}

/// JSON 导出器
pub struct JsonExporter {
    config: JsonExportConfig,
}

impl JsonExporter {
    /// 创建新的 JSON 导出器
    pub fn new() -> Self {
        Self {
            config: JsonExportConfig::default(),
        }
    }

    /// 创建带有配置的 JSON 导出器
    pub fn with_config(config: JsonExportConfig) -> Self {
        Self { config }
    }

    /// 导出数据为 JSON
    pub fn export<T: serde::Serialize>(&self, entity_type: &str, data: &[T]) -> JsonExportResult {
        let metadata = JsonExportMetadata::new(
            entity_type.to_string(),
            data.len(),
        );

        let json_value = if self.config.include_metadata {
            serde_json::json!({
                "metadata": metadata,
                "data": data
            })
        } else {
            serde_json::json!(data)
        };

        let content = if self.config.pretty {
            serde_json::to_string_pretty(&json_value)
                .unwrap_or_else(|_| serde_json::to_string(&json_value).unwrap_or_default())
        } else {
            serde_json::to_string(&json_value)
                .unwrap_or_default()
        };

        let byte_size = content.len();

        JsonExportResult {
            content,
            metadata,
            byte_size,
        }
    }

    /// 导出单个对象
    pub fn export_single<T: serde::Serialize>(&self, entity_type: &str, data: &T) -> JsonExportResult {
        let metadata = JsonExportMetadata::new(
            entity_type.to_string(),
            1,
        );

        let json_value = if self.config.include_metadata {
            serde_json::json!({
                "metadata": metadata,
                "data": data
            })
        } else {
            serde_json::json!(data)
        };

        let content = if self.config.pretty {
            serde_json::to_string_pretty(&json_value)
                .unwrap_or_else(|_| serde_json::to_string(&json_value).unwrap_or_default())
        } else {
            serde_json::to_string(&json_value)
                .unwrap_or_default()
        };

        let byte_size = content.len();

        JsonExportResult {
            content,
            metadata,
            byte_size,
        }
    }

    /// 导出为 Value
    pub fn export_to_value<T: serde::Serialize>(&self, entity_type: &str, data: &[T]) -> serde_json::Value {
        let metadata = JsonExportMetadata::new(
            entity_type.to_string(),
            data.len(),
        );

        if self.config.include_metadata {
            serde_json::json!({
                "metadata": metadata,
                "data": data
            })
        } else {
            serde_json::json!(data)
        }
    }

    /// 解析 JSON 数据
    pub fn parse<T: for<'de> Deserialize<'de>>(&self, content: &str) -> Result<Vec<T>, String> {
        // 尝试解析为包装格式
        if let Ok(wrapper) = serde_json::from_str::<serde_json::Value>(content) {
            if let Some(data) = wrapper.get("data") {
                if let Ok(parsed) = serde_json::from_value(data.clone()) {
                    return Ok(parsed);
                }
            }
        }

        // 直接解析为数组
        serde_json::from_str(content)
            .map_err(|e| format!("Failed to parse JSON: {}", e))
    }

    /// 获取配置
    pub fn get_config(&self) -> &JsonExportConfig {
        &self.config
    }

    /// 更新配置
    pub fn set_config(&mut self, config: JsonExportConfig) {
        self.config = config;
    }
}

impl Default for JsonExporter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Debug, Serialize, Deserialize)]
    struct TestRecord {
        id: u32,
        name: String,
    }

    #[test]
    fn test_export_basic() {
        let exporter = JsonExporter::new();
        
        let data = vec![
            TestRecord { id: 1, name: "Alice".to_string() },
            TestRecord { id: 2, name: "Bob".to_string() },
        ];
        
        let result = exporter.export("test", &data);
        
        assert!(result.content.contains("Alice"));
        assert!(result.content.contains("Bob"));
        assert_eq!(result.metadata.entity_type, "test");
        assert_eq!(result.metadata.record_count, 2);
    }

    #[test]
    fn test_export_single() {
        let exporter = JsonExporter::new();
        
        let record = TestRecord { id: 1, name: "Alice".to_string() };
        
        let result = exporter.export_single("test", &record);
        
        assert!(result.content.contains("Alice"));
        assert_eq!(result.metadata.record_count, 1);
    }

    #[test]
    fn test_export_without_metadata() {
        let mut config = JsonExportConfig::default();
        config.include_metadata = false;
        
        let exporter = JsonExporter::with_config(config);
        
        let data = vec![
            TestRecord { id: 1, name: "Alice".to_string() },
        ];
        
        let result = exporter.export("test", &data);
        
        assert!(result.content.starts_with('['));
        assert!(!result.content.contains("metadata"));
    }

    #[test]
    fn test_parse() {
        let exporter = JsonExporter::new();
        
        let json = r#"{"data":[{"id":1,"name":"Alice"}]}"#;
        let records: Vec<TestRecord> = exporter.parse(json).unwrap();
        
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].name, "Alice");
    }

    #[test]
    fn test_parse_direct() {
        let exporter = JsonExporter::new();
        
        let json = r#"[{"id":1,"name":"Alice"}]"#;
        let records: Vec<TestRecord> = exporter.parse(json).unwrap();
        
        assert_eq!(records.len(), 1);
    }
}
