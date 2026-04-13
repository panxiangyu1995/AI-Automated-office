# Specifications: Workspace 工作台模板管理

## workspace-templates

### Schema

```typescript
interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  layout: WorkspaceLayout;
  author: string;
  downloads: number;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workspace/templates | 获取模板列表 |
| POST | /api/workspace/templates | 创建模板 |
| GET | /api/workspace/templates/:id | 获取模板详情 |
