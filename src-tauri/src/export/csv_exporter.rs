//! CSV 导出器模块
//!
//! 提供 CSV 格式的数据导出功能

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// CSV 导出配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CsvExportConfig {
    /// 分隔符
    pub delimiter: char,
    /// 是否包含表头
    pub include_headers: bool,
    /// 编码
    pub encoding: String,
    /// 行结束符
    pub line_ending: String,
}

impl Default for CsvExportConfig {
    fn default() -> Self {
        Self {
            delimiter: ',',
            include_headers: true,
            encoding: "UTF-8".to_string(),
            line_ending: "\n".to_string(),
        }
    }
}

/// CSV 导出器
pub struct CsvExporter {
    config: CsvExportConfig,
}

impl CsvExporter {
    /// 创建新的 CSV 导出器
    pub fn new() -> Self {
        Self {
            config: CsvExportConfig::default(),
        }
    }

    /// 创建带有配置的 CSV 导出器
    pub fn with_config(config: CsvExportConfig) -> Self {
        Self { config }
    }

    /// 导出数据为 CSV
    pub fn export(&self, headers: &[String], rows: &[Vec<String>]) -> String {
        let mut output = String::new();

        // 添加 BOM (UTF-8)
        if self.config.encoding == "UTF-8" {
            output.push('\u{FEFF}');
        }

        // 添加表头
        if self.config.include_headers && !headers.is_empty() {
            output.push_str(&self.escape_row(headers));
            output.push_str(&self.config.line_ending);
        }

        // 添加数据行
        for row in rows {
            output.push_str(&self.escape_row(row));
            output.push_str(&self.config.line_ending);
        }

        output
    }

    /// 导出 HashMap 数组为 CSV
    pub fn export_from_map(&self, data: &[HashMap<String, serde_json::Value>]) -> String {
        if data.is_empty() {
            return String::new();
        }

        // 获取所有字段名（按顺序）
        let headers: Vec<String> = data[0].keys().cloned().collect();

        // 生成表头
        let mut output = String::new();
        if self.config.include_headers {
            output.push_str(&self.escape_row(&headers));
            output.push_str(&self.config.line_ending);
        }

        // 生成数据行
        for record in data {
            let row: Vec<String> = headers.iter()
                .map(|h| {
                    record.get(h)
                        .map(|v| self.value_to_string(v))
                        .unwrap_or_default()
                })
                .collect();
            output.push_str(&self.escape_row(&row));
            output.push_str(&self.config.line_ending);
        }

        output
    }

    /// 将值转换为字符串
    fn value_to_string(&self, value: &serde_json::Value) -> String {
        match value {
            serde_json::Value::String(s) => s.clone(),
            serde_json::Value::Number(n) => n.to_string(),
            serde_json::Value::Bool(b) => b.to_string(),
            serde_json::Value::Object(obj) => format!("{{{}}}", obj.iter()
                .map(|(k, v)| format!("\"{}\":{}", k, self.value_to_string(v)))
                .collect::<Vec<_>>()
                .join(",")),
            _ => serde_json::to_string(value).unwrap_or_default(),
        }
    }

    /// 转义 CSV 行
    fn escape_row(&self, row: &[String]) -> String {
        row.iter()
            .map(|cell| self.escape_cell(cell))
            .collect::<Vec<_>>()
            .join(&self.config.delimiter.to_string())
    }

    /// 转义 CSV 单元格
    fn escape_cell(&self, cell: &str) -> String {
        let needs_quotes = cell.contains(self.config.delimiter)
            || cell.contains('"')
            || cell.contains('\n')
            || cell.contains('\r');

        if needs_quotes {
            format!("\"{}\"", cell.replace('"', "\"\""))
        } else {
            cell.to_string()
        }
    }

    /// 获取配置
    pub fn get_config(&self) -> &CsvExportConfig {
        &self.config
    }

    /// 更新配置
    pub fn set_config(&mut self, config: CsvExportConfig) {
        self.config = config;
    }
}

impl Default for CsvExporter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_basic() {
        let exporter = CsvExporter::new();
        
        let headers = vec!["Name".to_string(), "Age".to_string(), "City".to_string()];
        let rows = vec![
            vec!["Alice".to_string(), "30".to_string(), "Beijing".to_string()],
            vec!["Bob".to_string(), "25".to_string(), "Shanghai".to_string()],
        ];
        
        let csv = exporter.export(&headers, &rows);
        
        assert!(csv.contains("Name,Age,City"));
        assert!(csv.contains("Alice,30,Beijing"));
        assert!(csv.contains("Bob,25,Shanghai"));
    }

    #[test]
    fn test_escape_special_chars() {
        let exporter = CsvExporter::new();
        
        let headers = vec!["Name".to_string(), "Description".to_string()];
        let rows = vec![
            vec!["Test".to_string(), "Hello, World!".to_string()],
        ];
        
        let csv = exporter.export(&headers, &rows);
        
        assert!(csv.contains("\"Hello, World!\""));
    }

    #[test]
    fn test_export_from_map() {
        let exporter = CsvExporter::new();
        
        let mut record1 = HashMap::new();
        record1.insert("name".to_string(), serde_json::json!("Alice"));
        record1.insert("age".to_string(), serde_json::json!(30));
        
        let mut record2 = HashMap::new();
        record2.insert("name".to_string(), serde_json::json!("Bob"));
        record2.insert("age".to_string(), serde_json::json!(25));
        
        let data = vec![record1, record2];
        let csv = exporter.export_from_map(&data);
        
        assert!(csv.contains("name"));
        assert!(csv.contains("Alice"));
        assert!(csv.contains("Bob"));
    }

    #[test]
    fn test_custom_delimiter() {
        let mut config = CsvExportConfig::default();
        config.delimiter = ';';
        
        let exporter = CsvExporter::with_config(config);
        
        let headers = vec!["A".to_string(), "B".to_string()];
        let rows = vec![
            vec!["1".to_string(), "2".to_string()],
        ];
        
        let csv = exporter.export(&headers, &rows);
        
        assert!(csv.contains("A;B"));
        assert!(csv.contains("1;2"));
    }
}
