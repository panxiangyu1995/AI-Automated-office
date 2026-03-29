# subagent-config-file

## Overview

支持从 Markdown + YAML front matter 格式的配置文件加载 Agent 定义。

## Functionality

### Core Features

1. **配置文件格式**
   ```yaml
   ---
   name: document-drafting
   description: 文档起草助手
   mode: subagent
   model: provider/model-id
   color: "#38A3EE"
   hidden: false
   ---

   You are a professional document drafting assistant...
   ```

2. **配置文件扫描**
   - 扫描目录：`{app_data}/agents/*.md`
   - 支持递归扫描子目录
   - 忽略以 `_` 开头的文件

3. **配置解析**
   - 解析 YAML front matter
   - 提取 prompt 内容作为 system prompt
   - 验证必填字段

4. **热重载（可选）**
   - 文件变更时自动重新加载
   - 支持 watch 模式

### User Interactions

1. 用户在 agents 目录创建/编辑 `.md` 文件
2. 应用启动时自动加载配置
3. 配置变更后自动更新

### Data Handling

**配置结构**：
```typescript
interface AgentConfig {
  name: string
  description: string
  mode: 'primary' | 'subagent' | 'all'
  model?: string
  color?: string
  hidden?: boolean
  prompt?: string
  permission?: PermissionRule[]
}
```

### Edge Cases

- 配置文件语法错误：记录错误日志，跳过该文件
- 重复的 agent 名称：后者覆盖前者
- 缺少必填字段：使用默认值或跳过

## Technical Spec

### File Structure

```
{app_data}/
└── agents/
    ├── docs.md
    ├── translator.md
    └── custom/
        └── my-agent.md
```

### Config Loader Module

```rust
pub struct AgentConfigLoader {
    config_dir: PathBuf,
}

impl AgentConfigLoader {
    pub async fn load_all(&self) -> Result<Vec<AgentConfig>>
    pub async fn load_file(&self, path: &Path) -> Result<AgentConfig>
    pub async fn watch_changes<F>(&self, callback: F) -> Result<()>
}
```

## Acceptance Criteria

1. 能够正确解析 YAML front matter
2. 能够提取 Markdown body 作为 prompt
3. 支持扫描目录加载多个配置文件
4. 配置文件变更时能够热重载
5. 解析错误时记录日志但不崩溃
