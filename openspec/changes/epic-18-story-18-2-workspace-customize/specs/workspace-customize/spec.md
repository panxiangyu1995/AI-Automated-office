# Specifications: Workspace 工作台个性化定制

## workspace-customize

### Description

工作台个性化定制。

### Schema

```typescript
interface WorkspaceConfig {
  user_id: string;
  layout: WorkspaceLayout;
  shortcuts: ShortcutConfig[];
  theme: 'light' | 'dark' | 'auto';
  widget_positions: Record<string, number>;
  created_at: number;
  updated_at: number;
}

interface ShortcutConfig {
  id: string;
  name: string;
  action: string;
  shortcut: string;
  icon?: string;
  visible: boolean;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/workspace/config` | 获取用户配置 |
| PUT | `/api/workspace/config` | 更新用户配置 |
| POST | `/api/workspace/shortcuts` | 添加快捷方式 |
| DELETE | `/api/workspace/shortcuts/:id` | 删除快捷方式 |
