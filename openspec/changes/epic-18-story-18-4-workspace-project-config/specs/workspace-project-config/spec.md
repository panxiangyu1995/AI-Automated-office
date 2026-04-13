# Specifications: Workspace 项目配置面板

## workspace-project-config

### Schema

```typescript
interface ProjectConfig {
  project_id: string;
  settings: Record<string, any>;
  team_ids: string[];
  notification_preferences: NotificationPrefs;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workspace/project/config | 获取配置 |
| PUT | /api/workspace/project/config | 更新配置 |
