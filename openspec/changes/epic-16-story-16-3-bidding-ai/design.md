# Design: Bidding 标书生成AI辅助

## Context

利用AI能力辅助生成标书技术方案，提升撰写效率。

## Goals / Non-Goals

### Goals

- [x] 实现标书模板管理
- [x] 实现模板变量配置
- [x] 实现AI生成技术方案
- [x] 实现标书预览和编辑
- [x] 与投标项目关联

### Non-Goals

- [ ] PDF导出（后续Story）
- [ ] 多人协作编辑

## Decisions

### 1. 模板结构

```typescript
interface BidTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;           // 模板内容，支持变量占位符
  variables: TemplateVariable[];
  is_default: boolean;
  created_at: number;
  updated_at: number;
}

interface TemplateVariable {
  key: string;              // 变量名
  label: string;             // 显示标签
  type: 'text' | 'number' | 'date' | 'select' | 'richtext';
  required: boolean;
  default_value?: string;
  options?: string[];       // select类型选项
  placeholder?: string;
}

// 变量占位符格式
// {{variable_name}}
```

### 2. AI生成流程

```
1. 选择项目 → 2. 选择模板 → 3. 填写变量 → 4. AI生成 → 5. 预览确认 → 6. 保存/导出
```

### 3. 数据库Schema

```sql
CREATE TABLE tender_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT NOT NULL DEFAULT '[]', -- JSON
    is_default INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    tenant_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE tender_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    template_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT DEFAULT '{}', -- JSON
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft',
    tenant_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### 4. AI生成Prompt设计

```typescript
const SYSTEM_PROMPT = `你是一位专业的招投标文档撰写专家。请根据以下要求生成标书技术方案。

要求：
1. 语言专业、规范
2. 结构清晰、完整
3. 符合行业标准
4. 突出公司优势`;

function buildGeneratePrompt(template: string, variables: Record<string, string>): string {
  return `请根据以下模板生成技术方案：

模板类型：${template.category}
项目名称：${variables.project_name}
客户名称：${variables.customer_name}
行业领域：${variables.industry}

技术要求：
${template.content}

请生成完整的技术方案内容。`;
}
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI生成内容质量不稳定 | 中 | 提供编辑功能，用户可修改 |
| 内容泄露风险 | 中 | 敏感数据脱敏处理 |
| 生成速度慢 | 低 | 显示加载状态，支持后台生成 |
