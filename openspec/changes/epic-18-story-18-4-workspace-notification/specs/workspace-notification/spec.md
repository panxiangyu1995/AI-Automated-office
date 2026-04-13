# Specifications: Workspace 工作台通知与提醒

## workspace-notification

### Description

工作台通知聚合。

### Schema

```typescript
interface WorkspaceNotification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  source_module: string;
  source_id: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
  action_url?: string;
  created_at: number;
}

type NotificationType = 'approval' | 'message' | 'mention' | 'system' | 'deadline';

interface NotificationSettings {
  user_id: string;
  enable_email: boolean;
  enable_push: boolean;
  mute_until?: number;
  categories: Record<NotificationType, boolean>;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/workspace/notifications` | 获取通知列表 |
| PUT | `/api/workspace/notifications/:id/read` | 标记已读 |
| PUT | `/api/workspace/notifications/read-all` | 全部已读 |
| GET | `/api/workspace/notifications/settings` | 获取设置 |
| PUT | `/api/workspace/notifications/settings` | 更新设置 |
