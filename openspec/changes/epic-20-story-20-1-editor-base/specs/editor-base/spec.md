# Specifications: Editor 编辑器基础架构

## editor-core

### Schema

```typescript
interface Document {
  id: string;
  title: string;
  type: 'text' | 'rich_text' | 'spreadsheet' | 'presentation';
  content: any;
  version: number;
  created_at: number;
  updated_at: number;
}

interface EditorState {
  document_id: string;
  content: any;
  cursor_position: { line: number; column: number };
  is_dirty: boolean;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/editor/documents/:id | 获取文档 |
| PUT | /api/editor/documents/:id | 保存文档 |
| GET | /api/editor/documents/:id/versions | 版本历史 |
