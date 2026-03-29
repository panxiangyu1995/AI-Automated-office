# subagent-mode-classification

## Overview

引入明确的 Agent Mode 分类系统，将 Agent 分为 `primary` 和 `subagent` 两种模式（精简版）。

## Functionality

### Core Features

1. **Mode 定义（精简版）**
   | Mode | 说明 | 可作为默认 | 可被委托 |
   |------|------|-----------|---------|
   | `primary` | 主 Agent，执行主要办公任务 | Yes | No |
   | `subagent` | 子 Agent，被主 Agent 委托 | No | Yes |

2. **Mode 约束**
   - `subagent` 不可设置为默认 agent
   - `subagent` 不可直接被用户选择（仅通过路由委托）
   - `hidden` 的 agent 不在 UI 显示

3. **Mode 继承**
   - 内置 agent 有明确的 mode
   - Custom agent 默认 mode 为 `primary`

### User Interactions

1. 用户在 Agent 注册表看到 mode 标签
2. mode 标签帮助用户理解 agent 用途
3. 创建 agent 时可选择 mode（默认 primary）

### Data Handling

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AgentMode {
    Primary,
    Subagent,
}

pub struct AgentInfo {
    pub name: String,
    pub mode: AgentMode,
    pub native: bool,
    pub hidden: bool,
    // ...
}
```

### Edge Cases

- 尝试将 subagent 设置为默认：返回错误
- 尝试直接选择 subagent：通过路由委托

## Technical Spec

### Backend (Rust)

```rust
// routing.rs
pub async fn default_agent() -> Result<String> {
    let agents = agent_registry.list().await?;
    let primary_visible = agents
        .iter()
        .find(|a| a.mode == AgentMode::Primary && !a.hidden);

    primary_visible
        .map(|a| a.name.clone())
        .ok_or_else(|| Error::no_primary_agent())
}
```

### Frontend (TypeScript)

```typescript
interface AgentInfo {
  name: string
  mode: 'primary' | 'subagent'
  native: boolean
  hidden: boolean
}
```

## Acceptance Criteria

1. Agent 具有明确的 mode 属性
2. UI 正确显示 mode 标签
3. subagent 不可设置为默认 agent
4. subagent 不在 ModeSwitcher 中显示
5. 创建 agent 时可选择 mode（默认 primary）
