# Specifications: Workspace 工作台基础架构

## workspace-base

### Description

工作台基础框架。

### Schema

```typescript
interface WorkspaceLayout {
  panels: PanelConfig[];
  order: string[];
}

interface PanelConfig {
  id: string;
  type: PanelType;
  title: string;
  visible: boolean;
  order: number;
}

type PanelType = 'todo_list' | 'task_aggregate' | 'recent' | 'favorite' | 'custom';
```

## workspace-dashboard

### Description

个人工作台和日清列表。

### Schema

```typescript
interface TodoItem {
  id: string;
  title: string;
  source_module: string;
  source_id: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: number;
}

interface TaskAggregate {
  module: string;
  module_name: string;
  pending_count: number;
  in_progress_count: number;
  urgent_count: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/workspace/todos` | 获取日清列表 |
| PUT | `/api/workspace/todos/:id` | 更新待办状态 |
| POST | `/api/workspace/todos/:id/complete` | 完成待办 |
| GET | `/api/workspace/aggregate` | 获取任务聚合 |
| GET | `/api/workspace/recent` | 获取最近访问 |

## workspace-layout

### Description

布局预设管理。

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/workspace/layouts` | 创建预设 |
| GET | `/api/workspace/layouts` | 获取预设列表 |
| PUT | `/api/workspace/layouts/:id` | 更新预设 |
| DELETE | `/api/workspace/layouts/:id` | 删除预设 |
| POST | `/api/workspace/layouts/:id/apply` | 应用预设 |
