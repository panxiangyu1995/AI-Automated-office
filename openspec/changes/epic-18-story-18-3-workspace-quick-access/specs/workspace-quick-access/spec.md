# Specifications: Workspace 工作台快捷入口管理

## workspace-quick-access

### Description

工作台快捷入口。

### Schema

```typescript
interface QuickAccess {
  id: string;
  user_id: string;
  type: 'favorite' | 'recent' | 'shortcut';
  name: string;
  icon?: string;
  url: string;
  params?: Record<string, string>;
  order: number;
  click_count: number;
  created_at: number;
  updated_at: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/workspace/quick-access` | 添加快捷入口 |
| GET | `/api/workspace/quick-access` | 获取快捷入口列表 |
| PUT | `/api/workspace/quick-access/:id` | 更新快捷入口 |
| DELETE | `/api/workspace/quick-access/:id` | 删除快捷入口 |
| PUT | `/api/workspace/quick-access/reorder` | 重新排序 |
