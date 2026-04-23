//! Workspace 模块 API 封装

import { safeInvoke } from '@/lib/tauri';
import type {
  WorkspaceLayout,
  WorkspaceTodo,
  TaskAggregation,
  LayoutListItem,
  TodoListItem,
  CreateLayoutRequest,
  UpdateLayoutRequest,
  CreateTodoRequest,
  UpdateTodoRequest,
  QueryTodosParams,
  PagedResult,
} from '../types/workspace';

// ==================== 布局 API ====================

export async function createLayout(request: CreateLayoutRequest, userId?: string): Promise<WorkspaceLayout> {
  const result = await safeInvoke<WorkspaceLayout>('workspace_create_layout', { request, userId })
  return result ?? ({} as WorkspaceLayout)
}

export async function getLayout(id: string): Promise<WorkspaceLayout> {
  const result = await safeInvoke<WorkspaceLayout>('workspace_get_layout', { id })
  return result ?? ({} as WorkspaceLayout)
}

export async function listLayouts(userId?: string): Promise<LayoutListItem[]> {
  const result = await safeInvoke<LayoutListItem[]>('workspace_list_layouts', { userId })
  return result ?? []
}

export async function updateLayout(id: string, request: UpdateLayoutRequest): Promise<WorkspaceLayout> {
  const result = await safeInvoke<WorkspaceLayout>('workspace_update_layout', { id, request })
  return result ?? ({} as WorkspaceLayout)
}

export async function deleteLayout(id: string): Promise<void> {
  await safeInvoke('workspace_delete_layout', { id })
}

// ==================== 日清任务 API ====================

export async function createTodo(request: CreateTodoRequest, userId?: string): Promise<WorkspaceTodo> {
  const result = await safeInvoke<WorkspaceTodo>('workspace_create_todo', { request, userId })
  return result ?? ({} as WorkspaceTodo)
}

export async function getTodo(id: string): Promise<WorkspaceTodo> {
  const result = await safeInvoke<WorkspaceTodo>('workspace_get_todo', { id })
  return result ?? ({} as WorkspaceTodo)
}

export async function listTodos(params?: QueryTodosParams, userId?: string): Promise<PagedResult<TodoListItem>> {
  const result = await safeInvoke<PagedResult<TodoListItem>>('workspace_list_todos', { params, userId })
  return result ?? ({} as PagedResult<TodoListItem>)
}

export async function updateTodo(id: string, request: UpdateTodoRequest): Promise<WorkspaceTodo> {
  const result = await safeInvoke<WorkspaceTodo>('workspace_update_todo', { id, request })
  return result ?? ({} as WorkspaceTodo)
}

export async function deleteTodo(id: string): Promise<void> {
  await safeInvoke('workspace_delete_todo', { id })
}

export async function getTaskAggregations(userId?: string): Promise<TaskAggregation[]> {
  const result = await safeInvoke<TaskAggregation[]>('workspace_get_task_aggregations', { userId })
  return result ?? []
}
