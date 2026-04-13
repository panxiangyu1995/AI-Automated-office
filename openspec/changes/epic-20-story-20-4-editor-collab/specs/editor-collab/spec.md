# Specifications: Editor 协作文档编辑

## editor-collab

### Schema

```typescript
interface CollabSession {
  id: string;
  document_id: string;
  participants: CollabUser[];
  status: 'active' | 'ended';
}

interface CollabUser {
  user_id: string;
  color: string;
  cursor_position?: CursorPosition;
  is_online: boolean;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/editor/collab/sessions | 创建会话 |
| POST | /api/editor/collab/sessions/:id/join | 加入会话 |
| POST | /api/editor/collab/sync | 同步变更 |
