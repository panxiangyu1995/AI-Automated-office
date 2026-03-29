# subagent-template-system

## Overview

提供 Agent 模板系统，预设 2 种核心模板类型（精简版），帮助用户快速创建符合办公场景的 Agent。后续可按需扩展更多业务模板。

## Functionality

### Core Features

1. **内置模板类型（精简版）**
   | 模板 | 名称 | 说明 | 默认 Skills | 默认 Tools | Mode |
   |------|------|------|-----------|-----------|------|
   | `general` | 通用助手 | 日常办公咨询和跨部门协调 | 对话、搜索、总结、协作 | department_query, document_read | primary |
   | `specialist` | 领域专家 | 专注特定业务领域 | 专业知识、领域分析 | full_department_access, approval_submit | subagent |

2. **模板配置**
   - 预设 Role 定义（符合办公场景）
   - 推荐 Skills 列表
   - 推荐 Tools 列表
   - 推荐权限范围

3. **模板选择 UI**
   - 创建 agent 时显示模板选择
   - 点击模板预览详情
   - 选择后自动填充推荐配置

### User Interactions

1. 用户点击"创建 Agent"
2. 选择模板类型（general 或 specialist）
3. 查看模板预览
4. 填写/修改配置
5. 确认创建

### Data Handling

```typescript
interface AgentTemplate {
  type: 'general' | 'specialist'
  name: string
  description: string
  icon: ReactNode
  color: string
  mode: 'primary' | 'subagent'
  defaultRole: string
  suggestedSkills: string[]
  suggestedTools: string[]
  suggestedMcpTools: string[]
  suggestedPermissions: string[]
}

const TEMPLATE_CONFIG: Record<AgentTemplate, AgentTemplateInfo> = {
  general: {
    type: 'general',
    name: '通用助手',
    description: '适用于日常办公咨询和跨部门协调',
    mode: 'primary',
    defaultRole: '通用办公 AI 助手，负责日常对话、信息查询和跨部门协调',
    suggestedSkills: ['对话', '搜索', '总结', '协作'],
    suggestedTools: ['department_query', 'document_read'],
    suggestedPermissions: ['department:ask', 'document:allow'],
  },
  specialist: {
    type: 'specialist',
    name: '领域专家',
    description: '专注特定业务领域的高级 Agent',
    mode: 'subagent',
    defaultRole: '业务领域专家，提供专业知识和深度分析',
    suggestedSkills: ['专业知识', '领域分析', '报告生成'],
    suggestedTools: ['full_department_access', 'approval_submit'],
    suggestedPermissions: ['department:allow', 'approval:allow', 'document:allow'],
  },
}
```

### Edge Cases

- 自定义 agent 无模板：从空白开始
- 切换模板：确认是否覆盖已有配置

## Technical Spec

### Template Selection Component

```typescript
interface TemplateSelectorProps {
  value: AgentTemplate | null
  onChange: (template: AgentTemplate) => void
}

const TemplateCard: Component<{ template: AgentTemplateInfo }> = (props) => {
  return (
    <Card>
      <TemplateIcon icon={props.template.icon} />
      <TemplateName name={props.template.name} />
      <TemplateDescription desc={props.template.description} />
      <TemplateModeBadge mode={props.template.mode} />
    </Card>
  )
}
```

## Acceptance Criteria

1. 提供 2 种内置模板（general/specialist）
2. 模板选择 UI 友好直观
3. 选择模板后自动填充推荐配置
4. 用户可修改/覆盖推荐配置
5. 模板定义易于扩展（后续可添加 hr/finance/sales 等专业模板）
