# Specifications: Editor 文档模板管理

## editor-template

### Schema

```typescript
interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  content: any;
  variables: TemplateVariable[];
  usage_count: number;
}

interface TemplateVariable {
  key: string;
  label: string;
  type: string;
  required: boolean;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/editor/templates | 创建模板 |
| GET | /api/editor/templates | 获取模板列表 |
| POST | /api/editor/templates/:id/apply | 应用模板 |
