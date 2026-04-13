# Specifications: Workspace 工作台预设管理

## workspace-presets

### Schema

```typescript
interface WorkspacePreset {
  id: string;
  name: string;
  category: string;
  layout: WorkspaceLayout;
  is_public: boolean;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workspace/presets | 创建预设 |
| GET | /api/workspace/presets | 获取预设列表 |
| POST | /api/workspace/presets/import | 导入预设 |
| POST | /api/workspace/presets/export | 导出预设 |
