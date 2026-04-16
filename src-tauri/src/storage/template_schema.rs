//! Template Schema 定义
//!
//! 实现 FR1261-FR1266: 结构化模板文件格式
//! - FR1261: AI友好的结构化格式(JSON/YAML)
//! - FR1262: 画布配置(尺寸、背景色、网格)
//! - FR1263: 图层结构(顺序、名称、类型、样式)
//! - FR1264: 数据占位符(变量名、数据类型、默认值、绑定规则)
//! - FR1265: 条件渲染(根据数据状态显示/隐藏)
//! - FR1266: 循环渲染(根据数组数据动态生成重复元素)
//!
//! 设计器后端支持 (FR1279-FR1284):
//! - FR1284: 模板导入导出(JSON/YAML格式)
//! - Schema 验证

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============ FR1262: 画布配置 ============

/// 画布配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasConfig {
    /// 画布宽度 (px)
    pub width: u32,
    /// 画布高度 (px)
    pub height: u32,
    /// 背景色 (CSS color)
    #[serde(default = "default_bg_color")]
    pub background_color: String,
    /// 网格设置
    #[serde(default)]
    pub grid: GridConfig,
}

impl Default for CanvasConfig {
    fn default() -> Self {
        Self {
            width: 800,
            height: 600,
            background_color: default_bg_color(),
            grid: GridConfig::default(),
        }
    }
}

fn default_bg_color() -> String {
    "#ffffff".to_string()
}

/// 网格配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GridConfig {
    /// 是否启用网格
    pub enabled: bool,
    /// 网格间距 (px)
    #[serde(default = "default_grid_size")]
    pub size: u32,
    /// 网格颜色
    #[serde(default = "default_grid_color")]
    pub color: String,
    /// 是否吸附到网格
    #[serde(default)]
    pub snap: bool,
}

impl Default for GridConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            size: default_grid_size(),
            color: default_grid_color(),
            snap: false,
        }
    }
}

fn default_grid_size() -> u32 {
    10
}

fn default_grid_color() -> String {
    "#e0e0e0".to_string()
}

// ============ FR1263: 图层结构 ============

/// 图层
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateLayer {
    /// 图层 ID
    pub id: String,
    /// 图层名称
    pub name: String,
    /// 图层类型
    pub layer_type: LayerType,
    /// 是否可见
    #[serde(default = "default_true")]
    pub visible: bool,
    /// 透明度 (0.0-1.0)
    #[serde(default = "default_opacity")]
    pub opacity: f32,
    /// 是否锁定
    #[serde(default)]
    pub locked: bool,
    /// 图层顺序 (z-index)
    pub order: i32,
    /// 图形元素列表
    #[serde(default)]
    pub elements: Vec<TemplateElement>,
    /// 子图层 (分组)
    #[serde(default)]
    pub children: Vec<TemplateLayer>,
}

/// 图层类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LayerType {
    /// 普通图层
    Normal,
    /// 分组图层
    Group,
    /// 背景图层
    Background,
}

impl Default for LayerType {
    fn default() -> Self {
        Self::Normal
    }
}

fn default_true() -> bool {
    true
}

fn default_opacity() -> f32 {
    1.0
}

// ============ 图形元素 ============

/// 模板图形元素
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateElement {
    /// 元素 ID
    pub id: String,
    /// 元素类型
    pub element_type: ElementType,
    /// 位置和大小
    pub bounds: ElementBounds,
    /// 样式
    #[serde(default)]
    pub style: ElementStyle,
    /// 文本内容 (文本元素专用)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    /// 图片 URL (图片元素专用)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    /// 数据绑定 (FR1264)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_binding: Option<DataBinding>,
    /// 条件渲染 (FR1265)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub condition: Option<RenderCondition>,
    /// 循环渲染 (FR1266)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loop_config: Option<LoopConfig>,
}

/// 元素类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ElementType {
    /// 矩形
    Rect,
    /// 圆形
    Circle,
    /// 椭圆
    Ellipse,
    /// 直线
    Line,
    /// 折线
    Polyline,
    /// 多边形
    Polygon,
    /// 文本
    Text,
    /// 图片
    Image,
    /// 自定义 (扩展)
    Custom,
}

/// 元素边界 (位置+大小)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementBounds {
    /// X 坐标
    pub x: f32,
    /// Y 坐标
    pub y: f32,
    /// 宽度
    pub width: f32,
    /// 高度
    pub height: f32,
    /// 旋转角度 (度)
    #[serde(default)]
    pub rotation: f32,
}

/// 元素样式 (FR1251)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementStyle {
    /// 填充色
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fill_color: Option<String>,
    /// 描边色
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stroke_color: Option<String>,
    /// 线宽
    #[serde(default)]
    pub stroke_width: f32,
    /// 透明度
    #[serde(default = "default_opacity")]
    pub opacity: f32,
    /// 字体大小 (文本元素)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_size: Option<f32>,
    /// 字体族 (文本元素)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_family: Option<String>,
    /// 文本颜色
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_color: Option<String>,
}

impl Default for ElementStyle {
    fn default() -> Self {
        Self {
            fill_color: None,
            stroke_color: Some("#000000".to_string()),
            stroke_width: 1.0,
            opacity: 1.0,
            font_size: None,
            font_family: None,
            text_color: None,
        }
    }
}

// ============ FR1264: 数据占位符 ============

/// 数据绑定
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataBinding {
    /// 变量名
    pub variable: String,
    /// 数据类型
    pub data_type: BindingDataType,
    /// 默认值
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<serde_json::Value>,
    /// 绑定规则 (数据源路径，如 "hr.employee.name")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub binding_path: Option<String>,
    /// 格式化规则 (如 "date:yyyy-MM-dd", "currency:CNY")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
}

/// 绑定数据类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BindingDataType {
    /// 文本
    Text,
    /// 数字
    Number,
    /// 日期
    Date,
    /// 布尔
    Boolean,
    /// 图片 URL
    Image,
    /// 任意 JSON
    Json,
}

// ============ FR1265: 条件渲染 ============

/// 条件渲染
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderCondition {
    /// 条件变量
    pub variable: String,
    /// 比较操作
    pub operator: ConditionOperator,
    /// 比较值
    pub value: serde_json::Value,
}

/// 条件操作符
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConditionOperator {
    /// 等于
    Eq,
    /// 不等于
    Ne,
    /// 大于
    Gt,
    /// 小于
    Lt,
    /// 大于等于
    Ge,
    /// 小于等于
    Le,
    /// 存在(非null)
    Exists,
    /// 不存在(null)
    NotExists,
}

impl RenderCondition {
    /// 评估条件是否满足
    pub fn evaluate(&self, data: &HashMap<String, serde_json::Value>) -> bool {
        let Some(actual) = data.get(&self.variable) else {
            return self.operator == ConditionOperator::NotExists;
        };

        match self.operator {
            ConditionOperator::Eq => actual == &self.value,
            ConditionOperator::Ne => actual != &self.value,
            ConditionOperator::Exists => !actual.is_null(),
            ConditionOperator::NotExists => actual.is_null(),
            ConditionOperator::Gt | ConditionOperator::Lt
            | ConditionOperator::Ge | ConditionOperator::Le => {
                // 数值比较
                let actual_num = actual.as_f64();
                let value_num = self.value.as_f64();
                match (actual_num, value_num) {
                    (Some(a), Some(v)) => match self.operator {
                        ConditionOperator::Gt => a > v,
                        ConditionOperator::Lt => a < v,
                        ConditionOperator::Ge => a >= v,
                        ConditionOperator::Le => a <= v,
                        _ => false,
                    },
                    _ => false,
                }
            }
        }
    }
}

// ============ FR1266: 循环渲染 ============

/// 循环渲染配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoopConfig {
    /// 数据源变量 (必须是数组)
    pub data_source: String,
    /// 迭代变量名 (模板中引用，如 "item")
    pub item_variable: String,
    /// 循环方向
    #[serde(default)]
    pub direction: LoopDirection,
    /// 间距 (px)
    #[serde(default)]
    pub spacing: f32,
}

/// 循环方向
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LoopDirection {
    /// 水平排列
    Horizontal,
    /// 垂直排列
    Vertical,
    /// 网格排列
    Grid,
}

impl Default for LoopDirection {
    fn default() -> Self {
        Self::Vertical
    }
}

// ============ Template Schema 主体 ============

/// 模板 Schema (FR1261)
///
/// AI 友好的结构化模板定义，可序列化为 JSON/YAML
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateSchema {
    /// Schema 版本
    pub schema_version: String,
    /// 模板 ID
    pub template_id: String,
    /// 模板名称
    pub name: String,
    /// 模板描述
    #[serde(default)]
    pub description: String,
    /// 所属部门
    #[serde(skip_serializing_if = "Option::is_none")]
    pub department: Option<String>,
    /// 标签
    #[serde(default)]
    pub tags: Vec<String>,
    /// 画布配置 (FR1262)
    pub canvas: CanvasConfig,
    /// 图层结构 (FR1263)
    pub layers: Vec<TemplateLayer>,
    /// 全局数据占位符定义 (FR1264)
    #[serde(default)]
    pub data_bindings: Vec<DataBinding>,
    /// 元数据
    #[serde(default)]
    pub metadata: HashMap<String, serde_json::Value>,
}

impl TemplateSchema {
    /// 创建新的模板 Schema
    pub fn new(template_id: String, name: String) -> Self {
        Self {
            schema_version: "1.0".to_string(),
            template_id,
            name,
            description: String::new(),
            department: None,
            tags: Vec::new(),
            canvas: CanvasConfig::default(),
            layers: Vec::new(),
            data_bindings: Vec::new(),
            metadata: HashMap::new(),
        }
    }

    /// 提取所有数据绑定 (包括元素内的)
    pub fn extract_all_bindings(&self) -> Vec<DataBinding> {
        let mut bindings = self.data_bindings.clone();
        for layer in &self.layers {
            Self::extract_layer_bindings(layer, &mut bindings);
        }
        bindings
    }

    fn extract_layer_bindings(layer: &TemplateLayer, bindings: &mut Vec<DataBinding>) {
        for element in &layer.elements {
            if let Some(ref binding) = element.data_binding {
                bindings.push(binding.clone());
            }
        }
        for child in &layer.children {
            Self::extract_layer_bindings(child, bindings);
        }
    }

    // ---- FR1284: 导入导出 ----

    /// 序列化为 JSON 字符串
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }

    /// 从 JSON 反序列化
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    // ---- 验证 ----

    /// 验证 Schema 完整性
    pub fn validate(&self) -> Result<(), TemplateSchemaError> {
        if self.template_id.is_empty() {
            return Err(TemplateSchemaError::InvalidField(
                "template_id cannot be empty".to_string(),
            ));
        }
        if self.name.is_empty() {
            return Err(TemplateSchemaError::InvalidField(
                "name cannot be empty".to_string(),
            ));
        }
        if self.canvas.width == 0 || self.canvas.height == 0 {
            return Err(TemplateSchemaError::InvalidField(
                "canvas dimensions must be positive".to_string(),
            ));
        }
        // 验证图层 ID 唯一性
        let mut layer_ids = Vec::new();
        Self::check_layer_ids(&self.layers, &mut layer_ids)?;
        Ok(())
    }

    fn check_layer_ids(
        layers: &[TemplateLayer],
        ids: &mut Vec<String>,
    ) -> Result<(), TemplateSchemaError> {
        for layer in layers {
            if ids.contains(&layer.id) {
                return Err(TemplateSchemaError::DuplicateId(layer.id.clone()));
            }
            ids.push(layer.id.clone());
            Self::check_layer_ids(&layer.children, ids)?;
        }
        Ok(())
    }
}

/// Schema 验证错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TemplateSchemaError {
    /// 字段无效
    InvalidField(String),
    /// ID 重复
    DuplicateId(String),
    /// 序列化错误
    SerializationError(String),
}

impl std::fmt::Display for TemplateSchemaError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidField(msg) => write!(f, "invalid field: {}", msg),
            Self::DuplicateId(id) => write!(f, "duplicate layer ID: {}", id),
            Self::SerializationError(msg) => write!(f, "serialization error: {}", msg),
        }
    }
}

impl std::error::Error for TemplateSchemaError {}

// ============ 单元测试 ============

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_canvas_config_default() {
        let config = CanvasConfig::default();
        assert_eq!(config.width, 800);
        assert_eq!(config.height, 600);
        assert_eq!(config.background_color, "#ffffff");
        assert!(!config.grid.enabled);
    }

    #[test]
    fn test_template_schema_new() {
        let schema = TemplateSchema::new("tmpl-1".to_string(), "测试模板".to_string());
        assert_eq!(schema.schema_version, "1.0");
        assert_eq!(schema.template_id, "tmpl-1");
        assert_eq!(schema.name, "测试模板");
        assert!(schema.layers.is_empty());
        assert!(schema.data_bindings.is_empty());
    }

    #[test]
    fn test_template_schema_validate_valid() {
        let schema = TemplateSchema::new("tmpl-1".to_string(), "测试模板".to_string());
        assert!(schema.validate().is_ok());
    }

    #[test]
    fn test_template_schema_validate_empty_id() {
        let mut schema = TemplateSchema::new(String::new(), "测试模板".to_string());
        schema.template_id = String::new();
        assert!(schema.validate().is_err());
    }

    #[test]
    fn test_template_schema_validate_zero_canvas() {
        let mut schema = TemplateSchema::new("tmpl-1".to_string(), "测试模板".to_string());
        schema.canvas.width = 0;
        assert!(schema.validate().is_err());
    }

    #[test]
    fn test_template_schema_validate_duplicate_layer_id() {
        let mut schema = TemplateSchema::new("tmpl-1".to_string(), "测试模板".to_string());
        let layer = TemplateLayer {
            id: "layer-1".to_string(),
            name: "图层1".to_string(),
            layer_type: LayerType::Normal,
            visible: true,
            opacity: 1.0,
            locked: false,
            order: 1,
            elements: Vec::new(),
            children: vec![TemplateLayer {
                id: "layer-1".to_string(), // 重复 ID
                name: "子图层".to_string(),
                layer_type: LayerType::Normal,
                visible: true,
                opacity: 1.0,
                locked: false,
                order: 2,
                elements: Vec::new(),
                children: Vec::new(),
            }],
        };
        schema.layers = vec![layer];
        assert!(schema.validate().is_err());
    }

    #[test]
    fn test_template_schema_json_roundtrip() {
        let schema = TemplateSchema::new("tmpl-1".to_string(), "测试模板".to_string());
        let json = schema.to_json().unwrap();
        let restored = TemplateSchema::from_json(&json).unwrap();
        assert_eq!(restored.template_id, "tmpl-1");
        assert_eq!(restored.name, "测试模板");
    }

    #[test]
    fn test_extract_all_bindings() {
        let mut schema = TemplateSchema::new("tmpl-1".to_string(), "测试模板".to_string());

        // 全局绑定
        schema.data_bindings = vec![DataBinding {
            variable: "company_name".to_string(),
            data_type: BindingDataType::Text,
            default_value: Some(serde_json::Value::String("示例公司".to_string())),
            binding_path: Some("company.name".to_string()),
            format: None,
        }];

        // 元素内绑定
        let element = TemplateElement {
            id: "el-1".to_string(),
            element_type: ElementType::Text,
            bounds: ElementBounds {
                x: 10.0,
                y: 10.0,
                width: 200.0,
                height: 30.0,
                rotation: 0.0,
            },
            style: ElementStyle::default(),
            text: Some("{{title}}".to_string()),
            image_url: None,
            data_binding: Some(DataBinding {
                variable: "title".to_string(),
                data_type: BindingDataType::Text,
                default_value: None,
                binding_path: Some("report.title".to_string()),
                format: None,
            }),
            condition: None,
            loop_config: None,
        };

        schema.layers = vec![TemplateLayer {
            id: "layer-1".to_string(),
            name: "标题层".to_string(),
            layer_type: LayerType::Normal,
            visible: true,
            opacity: 1.0,
            locked: false,
            order: 1,
            elements: vec![element],
            children: Vec::new(),
        }];

        let bindings = schema.extract_all_bindings();
        assert_eq!(bindings.len(), 2);
        assert_eq!(bindings[0].variable, "company_name");
        assert_eq!(bindings[1].variable, "title");
    }

    #[test]
    fn test_render_condition_evaluate() {
        let mut data = HashMap::new();
        data.insert("status".to_string(), serde_json::json!("approved"));
        data.insert("amount".to_string(), serde_json::json!(1000));
        data.insert("active".to_string(), serde_json::json!(true));

        // 等于
        let cond_eq = RenderCondition {
            variable: "status".to_string(),
            operator: ConditionOperator::Eq,
            value: serde_json::json!("approved"),
        };
        assert!(cond_eq.evaluate(&data));

        // 不等于
        let cond_ne = RenderCondition {
            variable: "status".to_string(),
            operator: ConditionOperator::Ne,
            value: serde_json::json!("draft"),
        };
        assert!(cond_ne.evaluate(&data));

        // 大于
        let cond_gt = RenderCondition {
            variable: "amount".to_string(),
            operator: ConditionOperator::Gt,
            value: serde_json::json!(500),
        };
        assert!(cond_gt.evaluate(&data));

        // 不存在
        let cond_not_exists = RenderCondition {
            variable: "missing".to_string(),
            operator: ConditionOperator::NotExists,
            value: serde_json::Value::Null,
        };
        assert!(cond_not_exists.evaluate(&data));

        // 存在
        let cond_exists = RenderCondition {
            variable: "active".to_string(),
            operator: ConditionOperator::Exists,
            value: serde_json::Value::Null,
        };
        assert!(cond_exists.evaluate(&data));
    }

    #[test]
    fn test_element_type_serde() {
        let et = ElementType::Rect;
        let json = serde_json::to_string(&et).unwrap();
        assert!(json.contains("rect"));
    }

    #[test]
    fn test_binding_data_type_serde() {
        let dt = BindingDataType::Date;
        let json = serde_json::to_string(&dt).unwrap();
        assert!(json.contains("date"));
    }

    #[test]
    fn test_loop_direction_default() {
        assert_eq!(LoopDirection::default(), LoopDirection::Vertical);
    }
}
