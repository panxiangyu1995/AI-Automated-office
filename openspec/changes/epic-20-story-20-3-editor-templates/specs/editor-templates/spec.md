# Specifications: Editor 模板系统

## editor-templates

### Schema

```typescript
interface EditorTemplate {
  id: string;
  name: string;
  category: string;
  content: any;
  thumbnail: string;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/editor/templates | 获取模板列表 |
| POST | /api/editor/templates | 创建模板 |
