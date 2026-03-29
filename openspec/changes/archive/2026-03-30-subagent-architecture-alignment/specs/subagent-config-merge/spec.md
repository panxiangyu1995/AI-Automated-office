# subagent-config-merge

## Overview

实现多层配置优先级和合并逻辑，支持从 Native Config → User Config → Agent Specific 的层层覆盖。

## Functionality

### Core Features

1. **配置层级**
   | 层级 | 来源 | 优先级 |
   |------|------|--------|
   | Native Config | 内置 agent 默认配置 | 最低 |
   | File Config | `.md` 配置文件 | 中 |
   | User Config | 用户界面配置 | 高 |
   | Runtime Override | 运行时覆盖 | 最高 |

2. **合并策略**
   - 浅合并：顶层 key 覆盖
   - 深合并：嵌套对象递归合并
   - 数组替换：数组整体替换而非合并

3. **覆盖规则**
   | 字段 | 覆盖规则 |
   |------|---------|
   | `name` | 不可覆盖 |
   | `mode` | 后者覆盖前者 |
   | `prompt` | 后者覆盖前者 |
   | `permission` | 深度合并，deny 优先 |
   | `model` | 后者覆盖前者 |
   | `options` | 深度合并 |

### User Interactions

1. 用户在界面修改 agent 配置
2. 修改优先于文件配置
3. 文件配置优先于内置默认

### Data Handling

```rust
pub struct AgentConfig {
    pub name: String,
    pub mode: AgentMode,
    pub prompt: Option<String>,
    pub permission: PermissionRuleSet,
    pub model: Option<ModelSelection>,
    pub options: HashMap<String, serde_json::Value>,
}

pub struct ConfigMerger;

impl ConfigMerger {
    pub fn merge(base: AgentConfig, overlay: AgentConfig) -> AgentConfig {
        // 实现深度合并逻辑
    }
}
```

### Edge Cases

- 循环引用：检测并报错
- 类型不匹配：使用 overlay 类型
- 空值处理：空值不覆盖非空值

## Technical Spec

### Merge Algorithm

```rust
fn merge_value(base: &serde_json::Value, overlay: &serde_json::Value) -> serde_json::Value {
    match (base, overlay) {
        (Object(base_map), Object(overlay_map)) => {
            let mut result = base_map.clone();
            for (k, v) in overlay_map {
                result.insert(k.clone(), merge_value(
                    result.get(k).unwrap_or(&serde_json::Value::Null),
                    v,
                ));
            }
            Object(result)
        }
        _ => overlay.clone(),
    }
}
```

## Acceptance Criteria

1. Native Config → File Config → User Config 优先级正确
2. 权限规则正确合并，deny 优先
3. 嵌套对象正确深度合并
4. 数组整体替换而非合并
5. 空值不覆盖非空值
