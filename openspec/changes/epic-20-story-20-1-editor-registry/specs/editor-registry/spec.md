# Specifications: Editor 编辑器注册表

## editor-registry

### Schema

```typescript
interface EditorRegistry {
  editors: Map<string, EditorFactory>;
}

interface EditorFactory {
  type: string;
  create: () => EditorInstance;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/editor/types | 获取编辑器类型 |
| POST | /api/editor/register | 注册编辑器 |
