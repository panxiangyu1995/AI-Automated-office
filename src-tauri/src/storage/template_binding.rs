//! 模板数据绑定引擎
//!
//! 实现 FR1267-FR1272: 数据绑定与 AI 填充
//! - FR1267: AI 可读取模板 Schema 结构，理解数据占位符语义
//! - FR1268: AI 可查询业务数据源，自动填充模板数据占位符
//! - FR1269: AI 填充数据时保持模板定义的样式和布局约束
//! - FR1270: 数据绑定预览 (填充前的模板结构)
//! - FR1271: 数据填充结果预览 (用户确认后再渲染)
//! - FR1272: AI 填充支持增量更新，仅更新变化的数据字段

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use super::template_schema::{
    BindingDataType, ElementBounds, LoopConfig,
    RenderCondition, TemplateElement, TemplateLayer, TemplateSchema,
};

/// 数据绑定结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BindResult {
    /// 填充后的数据映射 (variable -> value)
    pub filled_data: HashMap<String, serde_json::Value>,
    /// 本次更新的变量 (增量更新)
    pub updated_variables: Vec<String>,
    /// 未能填充的变量 (缺少数据源)
    pub unfilled_variables: Vec<String>,
}

/// 数据绑定预览 (FR1270)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BindPreview {
    /// 模板 ID
    pub template_id: String,
    /// 所有占位符定义
    pub placeholders: Vec<PlaceholderInfo>,
    /// 当前已填充的数据
    pub current_data: HashMap<String, serde_json::Value>,
}

/// 占位符信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceholderInfo {
    /// 变量名
    pub variable: String,
    /// 数据类型
    pub data_type: BindingDataType,
    /// 绑定路径
    pub binding_path: Option<String>,
    /// 默认值
    pub default_value: Option<serde_json::Value>,
    /// 是否已填充
    pub is_filled: bool,
    /// 当前值
    pub current_value: Option<serde_json::Value>,
}

/// 模板数据绑定引擎
pub struct TemplateBindEngine;

impl TemplateBindEngine {
    /// FR1267: 分析模板 Schema，提取数据占位符语义
    pub fn analyze_schema(schema: &TemplateSchema) -> Vec<PlaceholderInfo> {
        let bindings = schema.extract_all_bindings();
        bindings
            .into_iter()
            .map(|b| PlaceholderInfo {
                variable: b.variable.clone(),
                data_type: b.data_type,
                binding_path: b.binding_path.clone(),
                default_value: b.default_value.clone(),
                is_filled: false,
                current_value: None,
            })
            .collect()
    }

    /// FR1270: 生成填充前的预览
    pub fn preview_before_fill(
        schema: &TemplateSchema,
        existing_data: &HashMap<String, serde_json::Value>,
    ) -> BindPreview {
        let bindings = schema.extract_all_bindings();
        let placeholders: Vec<PlaceholderInfo> = bindings
            .into_iter()
            .map(|b| {
                let current = existing_data.get(&b.variable).cloned();
                let is_filled = current.is_some();
                PlaceholderInfo {
                    variable: b.variable.clone(),
                    data_type: b.data_type,
                    binding_path: b.binding_path.clone(),
                    default_value: b.default_value.clone(),
                    is_filled,
                    current_value: current,
                }
            })
            .collect();

        BindPreview {
            template_id: schema.template_id.clone(),
            placeholders,
            current_data: existing_data.clone(),
        }
    }

    /// FR1268: 使用数据源填充模板占位符
    ///
    /// data_source: 业务数据查询结果 (binding_path -> value)
    pub fn fill_bindings(
        schema: &TemplateSchema,
        data_source: &HashMap<String, serde_json::Value>,
        existing_data: &HashMap<String, serde_json::Value>,
    ) -> BindResult {
        let bindings = schema.extract_all_bindings();
        let mut filled_data = existing_data.clone();
        let mut updated_variables = Vec::new();
        let mut unfilled_variables = Vec::new();

        for binding in &bindings {
            // 先尝试通过 binding_path 查找
            let value = binding
                .binding_path
                .as_ref()
                .and_then(|path| data_source.get(path).cloned())
                .or_else(|| data_source.get(&binding.variable).cloned())
                .or_else(|| binding.default_value.clone());

            match value {
                Some(v) => {
                    // FR1272: 增量更新 - 仅记录变化的字段
                    let changed = match existing_data.get(&binding.variable) {
                        Some(old) => old != &v,
                        None => true,
                    };
                    if changed {
                        updated_variables.push(binding.variable.clone());
                    }
                    filled_data.insert(binding.variable.clone(), v);
                }
                None => {
                    unfilled_variables.push(binding.variable.clone());
                }
            }
        }

        BindResult {
            filled_data,
            updated_variables,
            unfilled_variables,
        }
    }

    /// FR1271: 应用数据到模板元素，生成填充后的元素
    ///
    /// FR1269: 保持模板定义的样式和布局约束
    pub fn apply_data_to_elements(
        schema: &TemplateSchema,
        data: &HashMap<String, serde_json::Value>,
    ) -> Vec<TemplateLayer> {
        schema
            .layers
            .iter()
            .map(|layer| Self::apply_to_layer(layer, data))
            .collect()
    }

    fn apply_to_layer(
        layer: &TemplateLayer,
        data: &HashMap<String, serde_json::Value>,
    ) -> TemplateLayer {
        TemplateLayer {
            id: layer.id.clone(),
            name: layer.name.clone(),
            layer_type: layer.layer_type,
            visible: layer.visible,
            opacity: layer.opacity,
            locked: layer.locked,
            order: layer.order,
            elements: layer
                .elements
                .iter()
                .filter_map(|el| Self::apply_to_element(el, data))
                .collect(),
            children: layer
                .children
                .iter()
                .map(|child| Self::apply_to_layer(child, data))
                .collect(),
        }
    }

    fn apply_to_element(
        element: &TemplateElement,
        data: &HashMap<String, serde_json::Value>,
    ) -> Option<TemplateElement> {
        // FR1265: 条件渲染 - 检查是否应显示
        if let Some(ref condition) = element.condition {
            if !condition.evaluate(data) {
                return None;
            }
        }

        // 填充数据绑定值
        let filled_text = match (&element.text, &element.data_binding) {
            (Some(_), Some(binding)) => {
                let value = data.get(&binding.variable);
                value.map(|v| match v {
                    serde_json::Value::String(s) => s.clone(),
                    serde_json::Value::Number(n) => n.to_string(),
                    serde_json::Value::Bool(b) => b.to_string(),
                    _ => v.to_string(),
                })
            }
            _ => element.text.clone(),
        };

        Some(TemplateElement {
            id: element.id.clone(),
            element_type: element.element_type,
            bounds: element.bounds.clone(), // FR1269: 保持布局
            style: element.style.clone(),   // FR1269: 保持样式
            text: filled_text,
            image_url: element.image_url.clone(),
            data_binding: element.data_binding.clone(),
            condition: element.condition.clone(),
            loop_config: element.loop_config.clone(),
        })
    }

    /// FR1266: 展开循环渲染元素
    ///
    /// 对含 loop_config 的元素，根据数据数组展开为多个元素
    pub fn expand_loops(
        elements: &[TemplateElement],
        data: &HashMap<String, serde_json::Value>,
    ) -> Vec<TemplateElement> {
        let mut expanded = Vec::new();

        for element in elements {
            if let Some(ref loop_config) = element.loop_config {
                if let Some(array) = data.get(&loop_config.data_source).and_then(|v| v.as_array())
                {
                    for (idx, item) in array.iter().enumerate() {
                        // 创建迭代上下文
                        let mut loop_data = data.clone();
                        loop_data.insert(loop_config.item_variable.clone(), item.clone());

                        let mut expanded_el = element.clone();
                        // 更新位置
                        let offset = Self::loop_offset(loop_config, idx, &element.bounds);
                        expanded_el.bounds = ElementBounds {
                            x: element.bounds.x + offset.0,
                            y: element.bounds.y + offset.1,
                            ..element.bounds
                        };
                        expanded_el.id = format!("{}-{}", element.id, idx);

                        // 填充迭代变量
                        if let Some(ref binding) = element.data_binding {
                            if let Some(v) = item.get(&binding.variable) {
                                expanded_el.text = Some(match v {
                                    serde_json::Value::String(s) => s.clone(),
                                    _ => v.to_string(),
                                });
                            }
                        }

                        expanded.push(expanded_el);
                    }
                }
            } else {
                expanded.push(element.clone());
            }
        }

        expanded
    }

    /// 计算循环展开的偏移量
    fn loop_offset(config: &LoopConfig, index: usize, bounds: &ElementBounds) -> (f32, f32) {
        let i = index as f32;
        match config.direction {
            super::template_schema::LoopDirection::Horizontal => {
                (i * (bounds.width + config.spacing), 0.0)
            }
            super::template_schema::LoopDirection::Vertical => {
                (0.0, i * (bounds.height + config.spacing))
            }
            super::template_schema::LoopDirection::Grid => {
                // 每行3个
                let col = i % 3.0;
                let row = (i / 3.0).floor();
                (col * (bounds.width + config.spacing), row * (bounds.height + config.spacing))
            }
        }
    }
}

// ============ 单元测试 ============

#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_schema() -> TemplateSchema {
        let mut schema = TemplateSchema::new("tmpl-1".to_string(), "测试模板".to_string());
        schema.data_bindings = vec![DataBinding {
            variable: "title".to_string(),
            data_type: BindingDataType::Text,
            default_value: Some(serde_json::Value::String("默认标题".to_string())),
            binding_path: Some("report.title".to_string()),
            format: None,
        }];
        schema
    }

    #[test]
    fn test_analyze_schema() {
        let schema = make_test_schema();
        let placeholders = TemplateBindEngine::analyze_schema(&schema);
        assert_eq!(placeholders.len(), 1);
        assert_eq!(placeholders[0].variable, "title");
        assert!(!placeholders[0].is_filled);
    }

    #[test]
    fn test_preview_before_fill() {
        let schema = make_test_schema();
        let existing = HashMap::new();
        let preview = TemplateBindEngine::preview_before_fill(&schema, &existing);
        assert_eq!(preview.template_id, "tmpl-1");
        assert_eq!(preview.placeholders.len(), 1);
        assert!(!preview.placeholders[0].is_filled);
    }

    #[test]
    fn test_preview_with_existing_data() {
        let schema = make_test_schema();
        let mut existing = HashMap::new();
        existing.insert("title".to_string(), serde_json::json!("已有标题"));
        let preview = TemplateBindEngine::preview_before_fill(&schema, &existing);
        assert!(preview.placeholders[0].is_filled);
        assert_eq!(
            preview.placeholders[0].current_value,
            Some(serde_json::json!("已有标题"))
        );
    }

    #[test]
    fn test_fill_bindings_from_data_source() {
        let schema = make_test_schema();
        let mut data_source = HashMap::new();
        data_source.insert("report.title".to_string(), serde_json::json!("月度报告"));
        let existing = HashMap::new();

        let result = TemplateBindEngine::fill_bindings(&schema, &data_source, &existing);
        assert_eq!(result.filled_data.get("title").unwrap(), "月度报告");
        assert!(result.updated_variables.contains(&"title".to_string()));
        assert!(result.unfilled_variables.is_empty());
    }

    #[test]
    fn test_fill_bindings_incremental_update() {
        let schema = make_test_schema();
        let mut data_source = HashMap::new();
        data_source.insert("report.title".to_string(), serde_json::json!("新标题"));

        let mut existing = HashMap::new();
        existing.insert("title".to_string(), serde_json::json!("旧标题"));

        let result = TemplateBindEngine::fill_bindings(&schema, &data_source, &existing);
        assert!(result.updated_variables.contains(&"title".to_string()));

        // 无变化时不记录
        let existing_same = result.filled_data.clone();
        let result2 = TemplateBindEngine::fill_bindings(&schema, &data_source, &existing_same);
        assert!(!result2.updated_variables.contains(&"title".to_string()));
    }

    #[test]
    fn test_fill_bindings_uses_default() {
        let schema = make_test_schema();
        let data_source = HashMap::new(); // 无数据源
        let existing = HashMap::new();

        let result = TemplateBindEngine::fill_bindings(&schema, &data_source, &existing);
        assert_eq!(result.filled_data.get("title").unwrap(), "默认标题");
    }

    #[test]
    fn test_apply_data_to_elements_condition() {
        let mut schema = TemplateSchema::new("tmpl-1".to_string(), "测试".to_string());

        let element = TemplateElement {
            id: "el-1".to_string(),
            element_type: ElementType::Text,
            bounds: ElementBounds {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 20.0,
                rotation: 0.0,
            },
            style: ElementStyle::default(),
            text: Some("可见文本".to_string()),
            image_url: None,
            data_binding: None,
            condition: Some(RenderCondition {
                variable: "show".to_string(),
                operator: super::super::template_schema::ConditionOperator::Eq,
                value: serde_json::json!(true),
            }),
            loop_config: None,
        };

        schema.layers = vec![TemplateLayer {
            id: "layer-1".to_string(),
            name: "图层".to_string(),
            layer_type: super::super::template_schema::LayerType::Normal,
            visible: true,
            opacity: 1.0,
            locked: false,
            order: 1,
            elements: vec![element],
            children: Vec::new(),
        }];

        // 条件满足 -> 元素存在
        let mut data_true = HashMap::new();
        data_true.insert("show".to_string(), serde_json::json!(true));
        let layers = TemplateBindEngine::apply_data_to_elements(&schema, &data_true);
        assert_eq!(layers[0].elements.len(), 1);

        // 条件不满足 -> 元素被过滤
        let mut data_false = HashMap::new();
        data_false.insert("show".to_string(), serde_json::json!(false));
        let layers = TemplateBindEngine::apply_data_to_elements(&schema, &data_false);
        assert_eq!(layers[0].elements.len(), 0);
    }

    #[test]
    fn test_expand_loops() {
        let element = TemplateElement {
            id: "el-loop".to_string(),
            element_type: ElementType::Text,
            bounds: ElementBounds {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 20.0,
                rotation: 0.0,
            },
            style: ElementStyle::default(),
            text: None,
            image_url: None,
            data_binding: Some(DataBinding {
                variable: "name".to_string(),
                data_type: BindingDataType::Text,
                default_value: None,
                binding_path: None,
                format: None,
            }),
            condition: None,
            loop_config: Some(LoopConfig {
                data_source: "items".to_string(),
                item_variable: "item".to_string(),
                direction: super::super::template_schema::LoopDirection::Vertical,
                spacing: 5.0,
            }),
        };

        let mut data = HashMap::new();
        data.insert(
            "items".to_string(),
            serde_json::json!([
                {"name": "项目A"},
                {"name": "项目B"},
                {"name": "项目C"},
            ]),
        );

        let expanded = TemplateBindEngine::expand_loops(&[element], &data);
        assert_eq!(expanded.len(), 3);
        assert_eq!(expanded[0].id, "el-loop-0");
        assert_eq!(expanded[1].id, "el-loop-1");
        assert_eq!(expanded[2].id, "el-loop-2");
        // 垂直排列: y 偏移递增
        assert!(expanded[1].bounds.y > expanded[0].bounds.y);
        assert!(expanded[2].bounds.y > expanded[1].bounds.y);
    }
}
