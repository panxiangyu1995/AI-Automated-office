//! Excel 导出器模块
//!
//! 提供 Excel 格式的数据导出功能（使用 xlsxwriter）

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// Excel 导出配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExcelExportConfig {
    /// 工作表名称
    pub sheet_name: String,
    /// 是否冻结首行
    pub freeze_header: bool,
    /// 是否自动过滤
    pub autofilter: bool,
    /// 是否自适应列宽
    pub auto_column_width: bool,
}

impl Default for ExcelExportConfig {
    fn default() -> Self {
        Self {
            sheet_name: "Data".to_string(),
            freeze_header: true,
            autofilter: true,
            auto_column_width: true,
        }
    }
}

/// Excel 单元格类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CellValue {
    String(String),
    Number(f64),
    Boolean(bool),
    Date(DateTime<Utc>),
    Empty,
}

impl CellValue {
    fn to_string(&self) -> String {
        match self {
            CellValue::String(s) => s.clone(),
            CellValue::Number(n) => n.to_string(),
            CellValue::Boolean(b) => b.to_string(),
            CellValue::Date(d) => d.format("%Y-%m-%d %H:%M:%S").to_string(),
            CellValue::Empty => String::new(),
        }
    }
}

/// Excel 导出结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExcelExportResult {
    /// 导出的数据（JSON 格式，包含可写入 xlsx 的信息）
    pub data: ExcelWorkbook,
    /// 元数据
    pub metadata: ExcelMetadata,
}

/// Excel 工作簿
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExcelWorkbook {
    /// 工作表列表
    pub sheets: Vec<ExcelSheet>,
}

/// Excel 工作表
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExcelSheet {
    /// 工作表名称
    pub name: String,
    /// 表头
    pub headers: Vec<String>,
    /// 数据行
    pub rows: Vec<Vec<CellValue>>,
}

/// Excel 元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExcelMetadata {
    /// 导出时间
    pub exported_at: DateTime<Utc>,
    /// 工作表数量
    pub sheet_count: usize,
    /// 总行数
    pub total_rows: usize,
    /// 实体类型
    pub entity_type: String,
}

impl ExcelMetadata {
    pub fn new(entity_type: String, sheet_count: usize, total_rows: usize) -> Self {
        Self {
            exported_at: Utc::now(),
            sheet_count,
            total_rows,
            entity_type,
        }
    }
}

/// Excel 导出器
pub struct ExcelExporter {
    config: ExcelExportConfig,
}

impl ExcelExporter {
    /// 创建新的 Excel 导出器
    pub fn new() -> Self {
        Self {
            config: ExcelExportConfig::default(),
        }
    }

    /// 创建带有配置的 Excel 导出器
    pub fn with_config(config: ExcelExportConfig) -> Self {
        Self { config }
    }

    /// 导出数据为 Excel
    pub fn export(&self, headers: &[String], rows: &[Vec<serde_json::Value>]) -> ExcelExportResult {
        let sheet = ExcelSheet {
            name: self.config.sheet_name.clone(),
            headers: headers.to_vec(),
            rows: rows.iter().map(|row| {
                row.iter().map(|v| self.json_to_cell(v)).collect()
            }).collect(),
        };

        let total_rows = sheet.rows.len();
        
        ExcelExportResult {
            data: ExcelWorkbook {
                sheets: vec![sheet],
            },
            metadata: ExcelMetadata::new(
                "default".to_string(),
                1,
                total_rows,
            ),
        }
    }

    /// 导出 HashMap 数组为 Excel
    pub fn export_from_map(&self, entity_type: &str, data: &[HashMap<String, serde_json::Value>]) -> ExcelExportResult {
        if data.is_empty() {
            return ExcelExportResult {
                data: ExcelWorkbook { sheets: vec![] },
                metadata: ExcelMetadata::new(entity_type.to_string(), 0, 0),
            };
        }

        // 获取所有字段名
        let headers: Vec<String> = data[0].keys().cloned().collect();

        // 生成数据行
        let rows: Vec<Vec<CellValue>> = data.iter().map(|record| {
            headers.iter()
                .map(|h| {
                    record.get(h)
                        .map(|v| self.json_to_cell(v))
                        .unwrap_or(CellValue::Empty)
                })
                .collect()
        }).collect();

        let sheet = ExcelSheet {
            name: self.config.sheet_name.clone(),
            headers,
            rows,
        };

        let total_rows = sheet.rows.len();

        ExcelExportResult {
            data: ExcelWorkbook {
                sheets: vec![sheet],
            },
            metadata: ExcelMetadata::new(
                entity_type.to_string(),
                1,
                total_rows,
            ),
        }
    }

    /// 导出多个工作表
    pub fn export_multi_sheet(&self, sheets_data: Vec<(&str, &[String], &[Vec<serde_json::Value>])>) -> ExcelExportResult {
        let sheets: Vec<ExcelSheet> = sheets_data.into_iter().map(|(name, headers, rows)| {
            ExcelSheet {
                name: name.to_string(),
                headers: headers.to_vec(),
                rows: rows.iter().map(|row| {
                    row.iter().map(|v| self.json_to_cell(v)).collect()
                }).collect(),
            }
        }).collect();

        let sheet_count = sheets.len();
        let total_rows: usize = sheets.iter().map(|s| s.rows.len()).sum();

        ExcelExportResult {
            data: ExcelWorkbook { sheets },
            metadata: ExcelMetadata::new(
                "multi".to_string(),
                sheet_count,
                total_rows,
            ),
        }
    }

    /// JSON 值转换为单元格值
    fn json_to_cell(&self, value: &serde_json::Value) -> CellValue {
        match value {
            serde_json::Value::String(s) => CellValue::String(s.clone()),
            serde_json::Value::Number(n) => CellValue::Number(n.as_f64().unwrap_or(0.0)),
            serde_json::Value::Bool(b) => CellValue::Boolean(*b),
            serde_json::Value::Null => CellValue::Empty,
            _ => CellValue::String(value.to_string()),
        }
    }

    /// 获取配置
    pub fn get_config(&self) -> &ExcelExportConfig {
        &self.config
    }

    /// 更新配置
    pub fn set_config(&mut self, config: ExcelExportConfig) {
        self.config = config;
    }
}

impl Default for ExcelExporter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_basic() {
        let exporter = ExcelExporter::new();
        
        let headers = vec!["Name".to_string(), "Age".to_string()];
        let rows = vec![
            vec![serde_json::json!("Alice"), serde_json::json!(30)],
            vec![serde_json::json!("Bob"), serde_json::json!(25)],
        ];
        
        let result = exporter.export(&headers, &rows);
        
        assert_eq!(result.data.sheets.len(), 1);
        assert_eq!(result.data.sheets[0].name, "Data");
        assert_eq!(result.metadata.total_rows, 2);
    }

    #[test]
    fn test_export_from_map() {
        let exporter = ExcelExporter::new();
        
        let mut record1 = HashMap::new();
        record1.insert("name".to_string(), serde_json::json!("Alice"));
        record1.insert("age".to_string(), serde_json::json!(30));
        
        let data = vec![record1];
        let result = exporter.export_from_map("test", &data);
        
        assert_eq!(result.data.sheets[0].headers, vec!["name", "age"]);
        assert_eq!(result.metadata.entity_type, "test");
    }

    #[test]
    fn test_json_to_cell() {
        let exporter = ExcelExporter::new();
        
        assert!(matches!(exporter.json_to_cell(&serde_json::json!("test")), CellValue::String(_)));
        assert!(matches!(exporter.json_to_cell(&serde_json::json!(42)), CellValue::Number(_)));
        assert!(matches!(exporter.json_to_cell(&serde_json::json!(true)), CellValue::Boolean(_)));
        assert!(matches!(exporter.json_to_cell(&serde_json::json!(null)), CellValue::Empty));
    }
}
