//! 模板设计器类型定义 + 变更追踪器
//!
//! 从 template_designer.rs 提取的类型和 SchemaChangeTracker，保持主文件在 800 行限制内

use serde::{Deserialize, Serialize};

use super::template_schema::{
    DataBinding, ElementBounds, LoopConfig,
    RenderCondition, TemplateElement, TemplateLayer, TemplateSchema,
};

// ============ FR1280: 元素操作 ============

/// 元素操作指令
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ElementOperation {
    /// 添加元素
    Add {
        layer_id: String,
        element: TemplateElement,
    },
    /// 删除元素
    Remove {
        layer_id: String,
        element_id: String,
    },
    /// 更新元素属性
    Update {
        layer_id: String,
        element_id: String,
        updates: ElementUpdates,
    },
    /// 移动元素位置
    Move {
        layer_id: String,
        element_id: String,
        new_bounds: ElementBounds,
    },
    /// 在图层间移动元素
    MoveToLayer {
        source_layer_id: String,
        target_layer_id: String,
        element_id: String,
    },
}

/// 元素属性更新 (部分更新)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementUpdates {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<super::template_schema::ElementStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_binding: Option<DataBinding>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub condition: Option<RenderCondition>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loop_config: Option<LoopConfig>,
}

// ============ FR1281: 图层排序 ============

/// 图层排序指令
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum LayerOperation {
    /// 添加图层
    Add {
        layer: TemplateLayer,
        /// 插入位置索引
        index: Option<usize>,
    },
    /// 删除图层
    Remove {
        layer_id: String,
    },
    /// 更新图层属性
    Update {
        layer_id: String,
        name: Option<String>,
        visible: Option<bool>,
        opacity: Option<f32>,
        locked: Option<bool>,
    },
    /// 图层上移
    MoveUp {
        layer_id: String,
    },
    /// 图层下移
    MoveDown {
        layer_id: String,
    },
    /// 移动到指定位置
    MoveTo {
        layer_id: String,
        index: usize,
    },
}

// ============ FR1282: 变更追踪 ============

/// Schema 快照 (用于 undo/redo)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaSnapshot {
    /// 操作描述
    pub label: String,
    /// Schema 的 JSON 快照
    pub schema_json: String,
    /// 时间戳
    pub timestamp: i64,
}

/// 变更追踪器
#[derive(Debug, Clone)]
pub struct SchemaChangeTracker {
    /// 撤销栈
    undo_stack: Vec<SchemaSnapshot>,
    /// 重做栈
    redo_stack: Vec<SchemaSnapshot>,
    /// 最大历史记录数
    max_history: usize,
}

impl SchemaChangeTracker {
    pub fn new(max_history: usize) -> Self {
        Self {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
            max_history,
        }
    }

    /// 记录变更前快照
    pub fn push_snapshot(&mut self, label: &str, schema: &TemplateSchema) {
        let snapshot = SchemaSnapshot {
            label: label.to_string(),
            schema_json: schema.to_json().unwrap_or_default(),
            timestamp: now_timestamp(),
        };

        self.undo_stack.push(snapshot);
        if self.undo_stack.len() > self.max_history {
            self.undo_stack.remove(0);
        }
        // 新操作清空 redo 栈
        self.redo_stack.clear();
    }

    /// 撤销: 弹出 undo 栈顶，当前状态压入 redo 栈
    pub fn undo(
        &mut self,
        current_schema: &TemplateSchema,
    ) -> Option<Result<TemplateSchema, serde_json::Error>> {
        let snapshot = self.undo_stack.pop()?;

        // 当前状态压入 redo
        let redo_snapshot = SchemaSnapshot {
            label: format!("redo: {}", snapshot.label),
            schema_json: current_schema.to_json().unwrap_or_default(),
            timestamp: now_timestamp(),
        };
        self.redo_stack.push(redo_snapshot);

        Some(TemplateSchema::from_json(&snapshot.schema_json))
    }

    /// 重做: 弹出 redo 栈顶，当前状态压入 undo 栈
    pub fn redo(
        &mut self,
        current_schema: &TemplateSchema,
    ) -> Option<Result<TemplateSchema, serde_json::Error>> {
        let snapshot = self.redo_stack.pop()?;

        // 当前状态压入 undo
        let undo_snapshot = SchemaSnapshot {
            label: format!("undo: {}", snapshot.label),
            schema_json: current_schema.to_json().unwrap_or_default(),
            timestamp: now_timestamp(),
        };
        self.undo_stack.push(undo_snapshot);

        Some(TemplateSchema::from_json(&snapshot.schema_json))
    }

    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }

    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }

    pub fn undo_count(&self) -> usize {
        self.undo_stack.len()
    }

    pub fn redo_count(&self) -> usize {
        self.redo_stack.len()
    }
}

fn now_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

// ============ FR1283: 对齐辅助 ============

/// 对齐方向
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Alignment {
    Left,
    CenterH,
    Right,
    Top,
    CenterV,
    Bottom,
}
