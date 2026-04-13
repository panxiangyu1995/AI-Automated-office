# Specifications: Bidding 标书生成与模板管理

## bidding-template-system

### Schema

```typescript
interface BidTemplate {
  id: string;
  name: string;
  content: string;
  variables: TemplateVariable[];
}

interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  required: boolean;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tender/templates | 获取模板列表 |
| POST | /api/tender/templates | 创建模板 |
| POST | /api/tender/generate | 生成标书 |
