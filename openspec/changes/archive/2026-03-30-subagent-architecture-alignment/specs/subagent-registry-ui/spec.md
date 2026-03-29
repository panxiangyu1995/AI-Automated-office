# subagent-registry-ui

## Overview

重构 Agent 注册表 UI，提供更精细的管理功能，包括创建、编辑、删除、导入、导出等操作。

## Functionality

### Core Features

1. **注册表列表**
   - 显示所有已注册的 agent
   - 支持搜索和过滤
   - 显示 agent 状态、模式、创建时间

2. **Agent 详情（可展开）**
   - Role 定义
   - Skills 列表
   - Tools 列表
   - MCP Tools 列表
   - Permissions 列表

3. **CRUD 操作**
   - 创建：选择模板，填写配置
   - 编辑：修改 agent 属性
   - 复制：基于现有 agent 创建副本
   - 删除：确认后删除

4. **导入/导出**
   - 导出为 JSON 文件
   - 从 JSON 文件导入
   - 验证导入配置有效性

### User Interactions

1. 用户进入设置 → Agent 管理
2. 浏览已注册的 agent 列表
3. 点击展开查看详情
4. 进行创建/编辑/删除操作

### Data Handling

```typescript
interface SubAgent {
  id: string
  name: string
  description: string
  template: 'general' | 'specialist' | 'analyst' | 'coordinator'
  mode: 'primary' | 'subagent' | 'all'
  role: string
  skills: string[]
  tools: string[]
  mcpTools: string[]
  permissions: string[]
  createdAt: string
  updatedAt: string
  enabled: boolean
}
```

### Edge Cases

- 删除正在使用的 agent：提示用户先解除关联
- 导入重复名称：询问是覆盖还是重命名
- 编辑内置 agent：仅允许修改部分字段

## Technical Spec

### Component Structure

```
SubAgentRegistry
├── StatsCards (统计卡片)
├── FilterBar (过滤栏)
├── AgentList (agent 列表)
│   └── AgentCard (单个 agent)
│       └── ExpandedDetails (展开详情)
├── CreateDialog (创建对话框)
└── EditDialog (编辑对话框)
```

## Acceptance Criteria

1. 正确显示所有注册的 agent
2. 支持搜索、过滤功能
3. 创建/编辑/删除操作正常工作
4. 导入/导出功能正常
5. 展开详情显示完整信息
6. 模板选择提供合理的默认值
