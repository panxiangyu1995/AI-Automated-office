//! Workspace 模块类型定义

export type TodoSourceModule = 'hr' | 'finance' | 'approval' | 'service' | 'sales' | 'warehouse' | 'marketing' | 'tender' | 'system';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkspaceLayout {
  id: string;
  userId: string;
  name: string;
  description?: string;
  layout: Record<string, unknown>;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceTodo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  sourceModule: TodoSourceModule;
  sourceId: string;
  priority: TodoPriority;
  dueDate?: string;
  status: TodoStatus;
  createdAt: number;
  completedAt?: number;
}

export interface TaskAggregation {
  module: string;
  moduleName: string;
  taskCount: number;
  pendingCount: number;
  inProgressCount: number;
  icon: string;
}

export interface CreateLayoutRequest {
  name: string;
  description?: string;
  layout: Record<string, unknown>;
  isDefault?: boolean;
}

export interface UpdateLayoutRequest {
  name?: string;
  description?: string;
  layout?: Record<string, unknown>;
  isDefault?: boolean;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  sourceModule: TodoSourceModule;
  sourceId: string;
  priority?: TodoPriority;
  dueDate?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: TodoPriority;
  dueDate?: string;
  status?: TodoStatus;
}

export interface QueryTodosParams {
  status?: TodoStatus;
  priority?: TodoPriority;
  sourceModule?: TodoSourceModule;
  dueDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LayoutListItem {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface TodoListItem {
  id: string;
  title: string;
  sourceModule: TodoSourceModule;
  priority: TodoPriority;
  dueDate?: string;
  status: TodoStatus;
  createdAt: number;
}

export const todoPriorityMeta: Record<TodoPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-gray-100 text-gray-800' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-800' },
  high: { label: '高', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-800' },
};

export const todoStatusMeta: Record<TodoStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600' },
};

export const sourceModuleMeta: Record<TodoSourceModule, { label: string; icon: string }> = {
  hr: { label: '人事', icon: 'Users' },
  finance: { label: '财务', icon: 'Wallet' },
  approval: { label: '审批', icon: 'ClipboardCheck' },
  service: { label: '售后', icon: 'HeadphonesIcon' },
  sales: { label: '销售', icon: 'ShoppingCart' },
  warehouse: { label: '仓储', icon: 'Package' },
  marketing: { label: '市场', icon: 'Megaphone' },
  tender: { label: '招投标', icon: 'FileText' },
  system: { label: '系统', icon: 'Settings' },
};
