//! Workspace 模块 API 封装

import { invoke } from '@tauri-apps/api/core';
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
  return invoke('workspace_create_layout', { request, userId });
}

export async function getLayout(id: string): Promise<WorkspaceLayout> {
  return invoke('workspace_get_layout', { id });
}

export async function listLayouts(userId?: string): Promise<LayoutListItem[]> {
  return invoke('workspace_list_layouts', { userId });
}

export async function updateLayout(id: string, request: UpdateLayoutRequest): Promise<WorkspaceLayout> {
  return invoke('workspace_update_layout', { id, request });
}

export async function deleteLayout(id: string): Promise<void> {
  return invoke('workspace_delete_layout', { id });
}

// ==================== 日清任务 API ====================

export async function createTodo(request: CreateTodoRequest, userId?: string): Promise<WorkspaceTodo> {
  return invoke('workspace_create_todo', { request, userId });
}

export async function getTodo(id: string): Promise<WorkspaceTodo> {
  return invoke('workspace_get_todo', { id });
}

export async function listTodos(params?: QueryTodosParams, userId?: string): Promise<PagedResult<TodoListItem>> {
  return invoke('workspace_list_todos', { params, userId });
}

export async function updateTodo(id: string, request: UpdateTodoRequest): Promise<WorkspaceTodo> {
  return invoke('workspace_update_todo', { id, request });
}

export async function deleteTodo(id: string): Promise<void> {
  return invoke('workspace_delete_todo', { id });
}

export async function getTaskAggregations(userId?: string): Promise<TaskAggregation[]> {
  return invoke('workspace_get_task_aggregations', { userId });
}
