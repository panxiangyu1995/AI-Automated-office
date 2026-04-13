# Specifications: Bidding 标书生成AI辅助

## bidding-template

### Description

标书模板管理。

### Schema

```typescript
interface BidTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  is_default: boolean;
  usage_count: number;
  created_at: number;
  updated_at: number;
}

interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'richtext';
  required: boolean;
  default_value?: string;
  options?: string[];
  placeholder?: string;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/tender/templates` | 创建模板 |
| GET | `/api/tender/templates` | 获取模板列表 |
| GET | `/api/tender/templates/:id` | 获取模板详情 |
| PUT | `/api/tender/templates/:id` | 更新模板 |
| DELETE | `/api/tender/templates/:id` | 删除模板 |
| POST | `/api/tender/templates/:id/render` | 渲染模板 |

## bidding-ai-generate

### Description

AI生成标书技术方案。

### Schema

```typescript
interface GenerateRequest {
  project_id: string;
  template_id: string;
  variables: Record<string, string>;
}

interface GeneratedDocument {
  id: string;
  project_id: string;
  template_id: string;
  title: string;
  content: string;
  variables: Record<string, string>;
  status: 'generating' | 'completed' | 'failed';
  created_at: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/tender/ai/generate` | AI生成技术方案 |
| GET | `/api/tender/ai/generate/:id/status` | 获取生成状态 |
| GET | `/api/tender/ai/content/:id` | 获取生成结果 |
| POST | `/api/tender/ai/optimize` | AI优化内容 |

### Components

#### TemplateList

模板列表组件。

#### TemplateEditor

模板编辑器，支持变量配置。

#### VariableForm

变量填写表单。

#### AIGeneratePanel

AI生成面板，显示生成进度。

#### DocumentPreview

文档预览组件。
