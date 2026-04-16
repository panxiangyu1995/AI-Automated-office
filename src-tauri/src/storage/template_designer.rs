//! 模板设计器后端支持
//!
//! 实现 FR1279-FR1284: 模板设计器后端
//! - FR1279: Schema 存储与读写 (通过 TemplateStore)
//! - FR1280: 元素操作 (增删改查)
//! - FR1281: 图层排序
//! - FR1282: Schema 变更追踪 (undo/redo)
//! - FR1283: 元素对齐辅助
//! - FR1284: 模板导入导出 (已在 TemplateSchema 实现)

pub use super::template_designer_types::*;

use super::template_schema::{
    ElementBounds, TemplateElement, TemplateLayer, TemplateSchema, TemplateSchemaError,
};

// ============ FR1283: 对齐辅助 ============

/// 对齐辅助工具
pub struct AlignmentHelper;

impl AlignmentHelper {
    /// 对一组元素的边界进行对齐
    ///
    /// 返回对齐后的边界列表，与输入一一对应
    pub fn align(bounds_list: &[ElementBounds], alignment: Alignment) -> Vec<ElementBounds> {
        if bounds_list.is_empty() {
            return Vec::new();
        }

        let reference = match alignment {
            Alignment::Left => bounds_list.iter().map(|b| b.x).reduce(f32::min).unwrap(),
            Alignment::Right => bounds_list
                .iter()
                .map(|b| b.x + b.width)
                .reduce(f32::max)
                .unwrap(),
            Alignment::CenterH => {
                let min_x = bounds_list.iter().map(|b| b.x).reduce(f32::min).unwrap();
                let max_x = bounds_list
                    .iter()
                    .map(|b| b.x + b.width)
                    .reduce(f32::max)
                    .unwrap();
                (min_x + max_x) / 2.0
            }
            Alignment::Top => bounds_list.iter().map(|b| b.y).reduce(f32::min).unwrap(),
            Alignment::Bottom => bounds_list
                .iter()
                .map(|b| b.y + b.height)
                .reduce(f32::max)
                .unwrap(),
            Alignment::CenterV => {
                let min_y = bounds_list.iter().map(|b| b.y).reduce(f32::min).unwrap();
                let max_y = bounds_list
                    .iter()
                    .map(|b| b.y + b.height)
                    .reduce(f32::max)
                    .unwrap();
                (min_y + max_y) / 2.0
            }
        };

        bounds_list
            .iter()
            .map(|b| match alignment {
                Alignment::Left => ElementBounds {
                    x: reference,
                    ..*b
                },
                Alignment::Right => ElementBounds {
                    x: reference - b.width,
                    ..*b
                },
                Alignment::CenterH => ElementBounds {
                    x: reference - b.width / 2.0,
                    ..*b
                },
                Alignment::Top => ElementBounds {
                    y: reference,
                    ..*b
                },
                Alignment::Bottom => ElementBounds {
                    y: reference - b.height,
                    ..*b
                },
                Alignment::CenterV => ElementBounds {
                    y: reference - b.height / 2.0,
                    ..*b
                },
            })
            .collect()
    }
}

// ============ 设计器引擎 ============

/// 模板设计器引擎
///
/// 组合 Schema、绑定引擎、变更追踪，提供统一的设计器后端
pub struct TemplateDesigner {
    /// 变更追踪器
    pub tracker: SchemaChangeTracker,
}

impl TemplateDesigner {
    pub fn new() -> Self {
        Self {
            tracker: SchemaChangeTracker::new(50),
        }
    }

    /// FR1280: 执行元素操作
    pub fn apply_element_operation(
        &mut self,
        schema: &TemplateSchema,
        operation: &ElementOperation,
    ) -> Result<TemplateSchema, TemplateSchemaError> {
        // 记录快照
        self.tracker.push_snapshot("element operation", schema);

        let mut new_schema = schema.clone();

        match operation {
            ElementOperation::Add {
                layer_id,
                element,
            } => {
                let layer = find_layer_mut(&mut new_schema.layers, layer_id)
                    .ok_or_else(|| TemplateSchemaError::InvalidField(
                        format!("layer not found: {}", layer_id),
                    ))?;
                layer.elements.push(element.clone());
            }
            ElementOperation::Remove {
                layer_id,
                element_id,
            } => {
                let layer = find_layer_mut(&mut new_schema.layers, layer_id)
                    .ok_or_else(|| TemplateSchemaError::InvalidField(
                        format!("layer not found: {}", layer_id),
                    ))?;
                layer.elements.retain(|e| &e.id != element_id);
            }
            ElementOperation::Update {
                layer_id,
                element_id,
                updates,
            } => {
                let layer = find_layer_mut(&mut new_schema.layers, layer_id)
                    .ok_or_else(|| TemplateSchemaError::InvalidField(
                        format!("layer not found: {}", layer_id),
                    ))?;
                if let Some(element) = layer.elements.iter_mut().find(|e| &e.id == element_id) {
                    apply_element_updates(element, updates);
                }
            }
            ElementOperation::Move {
                layer_id,
                element_id,
                new_bounds,
            } => {
                let layer = find_layer_mut(&mut new_schema.layers, layer_id)
                    .ok_or_else(|| TemplateSchemaError::InvalidField(
                        format!("layer not found: {}", layer_id),
                    ))?;
                if let Some(element) = layer.elements.iter_mut().find(|e| &e.id == element_id) {
                    element.bounds = new_bounds.clone();
                }
            }
            ElementOperation::MoveToLayer {
                source_layer_id,
                target_layer_id,
                element_id,
            } => {
                // 从源图层取出元素
                let element = {
                    let source = find_layer_mut(&mut new_schema.layers, source_layer_id)
                        .ok_or_else(|| TemplateSchemaError::InvalidField(
                            format!("source layer not found: {}", source_layer_id),
                        ))?;
                    let pos = source.elements.iter().position(|e| &e.id == element_id);
                    match pos {
                        Some(i) => source.elements.remove(i),
                        None => return Ok(new_schema), // 元素不存在，静默返回
                    }
                };
                // 添加到目标图层
                let target = find_layer_mut(&mut new_schema.layers, target_layer_id)
                    .ok_or_else(|| TemplateSchemaError::InvalidField(
                        format!("target layer not found: {}", target_layer_id),
                    ))?;
                target.elements.push(element);
            }
        }

        Ok(new_schema)
    }

    /// FR1281: 执行图层操作
    pub fn apply_layer_operation(
        &mut self,
        schema: &TemplateSchema,
        operation: &LayerOperation,
    ) -> Result<TemplateSchema, TemplateSchemaError> {
        self.tracker.push_snapshot("layer operation", schema);

        let mut new_schema = schema.clone();

        match operation {
            LayerOperation::Add { layer, index } => {
                match index {
                    Some(i) => {
                        let i = (*i).min(new_schema.layers.len());
                        new_schema.layers.insert(i, layer.clone());
                    }
                    None => new_schema.layers.push(layer.clone()),
                }
                reorder_layers(&mut new_schema.layers);
            }
            LayerOperation::Remove { layer_id } => {
                new_schema.layers.retain(|l| &l.id != layer_id);
                reorder_layers(&mut new_schema.layers);
            }
            LayerOperation::Update {
                layer_id,
                name,
                visible,
                opacity,
                locked,
            } => {
                if let Some(layer) = find_layer_mut(&mut new_schema.layers, layer_id) {
                    if let Some(n) = name {
                        layer.name = n.clone();
                    }
                    if let Some(v) = visible {
                        layer.visible = *v;
                    }
                    if let Some(o) = opacity {
                        layer.opacity = *o;
                    }
                    if let Some(l) = locked {
                        layer.locked = *l;
                    }
                }
            }
            LayerOperation::MoveUp { layer_id } => {
                let idx = new_schema.layers.iter().position(|l| &l.id == layer_id);
                if let Some(i) = idx {
                    if i > 0 {
                        new_schema.layers.swap(i, i - 1);
                        reorder_layers(&mut new_schema.layers);
                    }
                }
            }
            LayerOperation::MoveDown { layer_id } => {
                let idx = new_schema.layers.iter().position(|l| &l.id == layer_id);
                if let Some(i) = idx {
                    if i < new_schema.layers.len() - 1 {
                        new_schema.layers.swap(i, i + 1);
                        reorder_layers(&mut new_schema.layers);
                    }
                }
            }
            LayerOperation::MoveTo { layer_id, index } => {
                let idx = new_schema.layers.iter().position(|l| &l.id == layer_id);
                if let Some(i) = idx {
                    let layer = new_schema.layers.remove(i);
                    let target = (*index).min(new_schema.layers.len());
                    new_schema.layers.insert(target, layer);
                    reorder_layers(&mut new_schema.layers);
                }
            }
        }

        Ok(new_schema)
    }

    /// FR1283: 对齐元素
    pub fn align_elements(
        &mut self,
        schema: &TemplateSchema,
        layer_id: &str,
        element_ids: &[String],
        alignment: Alignment,
    ) -> Result<TemplateSchema, TemplateSchemaError> {
        self.tracker.push_snapshot("align elements", schema);

        let mut new_schema = schema.clone();
        let layer = find_layer_mut(&mut new_schema.layers, layer_id)
            .ok_or_else(|| TemplateSchemaError::InvalidField(
                format!("layer not found: {}", layer_id),
            ))?;

        // 收集目标元素的边界
        let target_bounds: Vec<ElementBounds> = element_ids
            .iter()
            .filter_map(|id| layer.elements.iter().find(|e| &e.id == id).map(|e| e.bounds.clone()))
            .collect();

        if target_bounds.len() < 2 {
            return Ok(new_schema); // 少于2个元素无需对齐
        }

        let aligned_bounds = AlignmentHelper::align(&target_bounds, alignment);

        // 应用对齐后的边界
        let mut align_idx = 0;
        for element in &mut layer.elements {
            if element_ids.contains(&element.id) {
                if align_idx < aligned_bounds.len() {
                    element.bounds = aligned_bounds[align_idx].clone();
                    align_idx += 1;
                }
            }
        }

        Ok(new_schema)
    }
}

// ============ 辅助函数 ============

/// 查找图层 (递归)
fn find_layer_mut<'a>(layers: &'a mut Vec<TemplateLayer>, layer_id: &str) -> Option<&'a mut TemplateLayer> {
    for layer in layers.iter_mut() {
        if layer.id == layer_id {
            return Some(layer);
        }
        if let Some(child) = find_layer_mut(&mut layer.children, layer_id) {
            return Some(child);
        }
    }
    None
}

/// 重新编号图层 order
fn reorder_layers(layers: &mut [TemplateLayer]) {
    for (i, layer) in layers.iter_mut().enumerate() {
        layer.order = i as i32;
    }
}

/// 应用元素部分更新
fn apply_element_updates(element: &mut TemplateElement, updates: &ElementUpdates) {
    if let Some(ref text) = updates.text {
        element.text = Some(text.clone());
    }
    if let Some(ref url) = updates.image_url {
        element.image_url = Some(url.clone());
    }
    if let Some(ref style) = updates.style {
        element.style = style.clone();
    }
    if let Some(ref binding) = updates.data_binding {
        element.data_binding = Some(binding.clone());
    }
    if let Some(ref condition) = updates.condition {
        element.condition = Some(condition.clone());
    }
    if let Some(ref loop_config) = updates.loop_config {
        element.loop_config = Some(loop_config.clone());
    }
}

// ============ 单元测试 ============

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::template_schema::{ElementType, LayerType};

    fn make_test_schema_with_layers() -> TemplateSchema {
        let mut schema = TemplateSchema::new("tmpl-1".to_string(), "测试模板".to_string());
        schema.layers = vec![
            TemplateLayer {
                id: "layer-1".to_string(),
                name: "背景层".to_string(),
                layer_type: LayerType::Background,
                visible: true,
                opacity: 1.0,
                locked: false,
                order: 0,
                elements: vec![TemplateElement {
                    id: "el-bg".to_string(),
                    element_type: ElementType::Rect,
                    bounds: ElementBounds {
                        x: 0.0,
                        y: 0.0,
                        width: 800.0,
                        height: 600.0,
                        rotation: 0.0,
                    },
                    style: Default::default(),
                    text: None,
                    image_url: None,
                    data_binding: None,
                    condition: None,
                    loop_config: None,
                }],
                children: Vec::new(),
            },
            TemplateLayer {
                id: "layer-2".to_string(),
                name: "内容层".to_string(),
                layer_type: LayerType::Normal,
                visible: true,
                opacity: 1.0,
                locked: false,
                order: 1,
                elements: vec![TemplateElement {
                    id: "el-title".to_string(),
                    element_type: ElementType::Text,
                    bounds: ElementBounds {
                        x: 10.0,
                        y: 10.0,
                        width: 200.0,
                        height: 30.0,
                        rotation: 0.0,
                    },
                    style: Default::default(),
                    text: Some("标题".to_string()),
                    image_url: None,
                    data_binding: None,
                    condition: None,
                    loop_config: None,
                }],
                children: Vec::new(),
            },
        ];
        schema
    }

    #[test]
    fn test_element_operation_add() {
        let schema = make_test_schema_with_layers();
        let mut designer = TemplateDesigner::new();

        let new_element = TemplateElement {
            id: "el-new".to_string(),
            element_type: ElementType::Text,
            bounds: ElementBounds {
                x: 50.0,
                y: 50.0,
                width: 100.0,
                height: 20.0,
                rotation: 0.0,
            },
            style: Default::default(),
            text: Some("新元素".to_string()),
            image_url: None,
            data_binding: None,
            condition: None,
            loop_config: None,
        };

        let op = ElementOperation::Add {
            layer_id: "layer-1".to_string(),
            element: new_element,
        };

        let result = designer.apply_element_operation(&schema, &op).unwrap();
        assert_eq!(result.layers[0].elements.len(), 2);
        assert_eq!(result.layers[0].elements[1].id, "el-new");
        assert!(designer.tracker.can_undo());
    }

    #[test]
    fn test_element_operation_remove() {
        let schema = make_test_schema_with_layers();
        let mut designer = TemplateDesigner::new();

        let op = ElementOperation::Remove {
            layer_id: "layer-2".to_string(),
            element_id: "el-title".to_string(),
        };

        let result = designer.apply_element_operation(&schema, &op).unwrap();
        assert!(result.layers[1].elements.is_empty());
    }

    #[test]
    fn test_element_operation_update() {
        let schema = make_test_schema_with_layers();
        let mut designer = TemplateDesigner::new();

        let updates = ElementUpdates {
            text: Some("新标题".to_string()),
            image_url: None,
            style: None,
            data_binding: None,
            condition: None,
            loop_config: None,
        };

        let op = ElementOperation::Update {
            layer_id: "layer-2".to_string(),
            element_id: "el-title".to_string(),
            updates,
        };

        let result = designer.apply_element_operation(&schema, &op).unwrap();
        assert_eq!(result.layers[1].elements[0].text, Some("新标题".to_string()));
    }

    #[test]
    fn test_element_operation_move_to_layer() {
        let schema = make_test_schema_with_layers();
        let mut designer = TemplateDesigner::new();

        let op = ElementOperation::MoveToLayer {
            source_layer_id: "layer-2".to_string(),
            target_layer_id: "layer-1".to_string(),
            element_id: "el-title".to_string(),
        };

        let result = designer.apply_element_operation(&schema, &op).unwrap();
        assert_eq!(result.layers[0].elements.len(), 2); // bg + title
        assert!(result.layers[1].elements.is_empty());
    }

    #[test]
    fn test_layer_operation_add() {
        let schema = make_test_schema_with_layers();
        let mut designer = TemplateDesigner::new();

        let new_layer = TemplateLayer {
            id: "layer-3".to_string(),
            name: "新图层".to_string(),
            layer_type: LayerType::Normal,
            visible: true,
            opacity: 1.0,
            locked: false,
            order: 2,
            elements: Vec::new(),
            children: Vec::new(),
        };

        let op = LayerOperation::Add {
            layer: new_layer,
            index: None,
        };

        let result = designer.apply_layer_operation(&schema, &op).unwrap();
        assert_eq!(result.layers.len(), 3);
        assert_eq!(result.layers[2].order, 2);
    }

    #[test]
    fn test_layer_operation_move_up() {
        let schema = make_test_schema_with_layers();
        let mut designer = TemplateDesigner::new();

        let op = LayerOperation::MoveUp {
            layer_id: "layer-2".to_string(),
        };

        let result = designer.apply_layer_operation(&schema, &op).unwrap();
        assert_eq!(result.layers[0].id, "layer-2");
        assert_eq!(result.layers[1].id, "layer-1");
    }

    #[test]
    fn test_layer_operation_remove() {
        let schema = make_test_schema_with_layers();
        let mut designer = TemplateDesigner::new();

        let op = LayerOperation::Remove {
            layer_id: "layer-1".to_string(),
        };

        let result = designer.apply_layer_operation(&schema, &op).unwrap();
        assert_eq!(result.layers.len(), 1);
        assert_eq!(result.layers[0].order, 0);
    }

    #[test]
    fn test_change_tracker_undo_redo() {
        let mut tracker = SchemaChangeTracker::new(10);
        let mut schema = TemplateSchema::new("tmpl-1".to_string(), "v1".to_string());

        // 推入快照
        tracker.push_snapshot("initial", &schema);

        // 修改 schema
        schema.name = "v2".to_string();
        tracker.push_snapshot("rename", &schema);

        assert!(tracker.can_undo());
        assert!(!tracker.can_redo());

        // 撤销
        let undone = tracker.undo(&schema).unwrap().unwrap();
        assert_eq!(undone.name, "v1");

        assert!(tracker.can_redo());

        // 重做
        let redone = tracker.redo(&undone).unwrap().unwrap();
        assert_eq!(redone.name, "v2");
    }

    #[test]
    fn test_alignment_helper_left() {
        let bounds = vec![
            ElementBounds { x: 10.0, y: 0.0, width: 100.0, height: 20.0, rotation: 0.0 },
            ElementBounds { x: 50.0, y: 0.0, width: 100.0, height: 20.0, rotation: 0.0 },
            ElementBounds { x: 200.0, y: 0.0, width: 100.0, height: 20.0, rotation: 0.0 },
        ];

        let aligned = AlignmentHelper::align(&bounds, Alignment::Left);
        assert_eq!(aligned[0].x, 10.0);
        assert_eq!(aligned[1].x, 10.0);
        assert_eq!(aligned[2].x, 10.0);
    }

    #[test]
    fn test_alignment_helper_center_v() {
        let bounds = vec![
            ElementBounds { x: 0.0, y: 0.0, width: 100.0, height: 20.0, rotation: 0.0 },
            ElementBounds { x: 0.0, y: 50.0, width: 100.0, height: 40.0, rotation: 0.0 },
        ];

        let aligned = AlignmentHelper::align(&bounds, Alignment::CenterV);
        // center = (0 + 50 + 40) / 2 = 45
        let center = 45.0;
        assert_eq!(aligned[0].y, center - 20.0 / 2.0);
        assert_eq!(aligned[1].y, center - 40.0 / 2.0);
    }

    #[test]
    fn test_designer_align_elements() {
        let schema = make_test_schema_with_layers();
        let mut designer = TemplateDesigner::new();

        // 添加第二个元素到 layer-2
        let mut schema2 = schema.clone();
        schema2.layers[1].elements.push(TemplateElement {
            id: "el-subtitle".to_string(),
            element_type: ElementType::Text,
            bounds: ElementBounds { x: 100.0, y: 100.0, width: 150.0, height: 20.0, rotation: 0.0 },
            style: Default::default(),
            text: Some("副标题".to_string()),
            image_url: None,
            data_binding: None,
            condition: None,
            loop_config: None,
        });

        let result = designer.align_elements(
            &schema2,
            "layer-2",
            &["el-title".to_string(), "el-subtitle".to_string()],
            Alignment::Left,
        ).unwrap();

        // 两个元素应左对齐
        let x1 = result.layers[1].elements[0].bounds.x;
        let x2 = result.layers[1].elements[1].bounds.x;
        assert_eq!(x1, x2);
    }
}
