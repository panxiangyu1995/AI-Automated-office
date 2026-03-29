/**
 * Workspace API Client
 * Story 41.5 - Workspace Data Model and Basic Framework
 *
 * API client for workspace-related operations.
 */

import type {
  Workspace,
  Project,
  WorkspaceMember,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  WorkspaceRole,
} from '../../features/workspace/types'

import { ProjectStatus } from '../../features/workspace/types'

// ==================== API Base ====================

const API_BASE = '/api'

/**
 * Get auth token from storage
 */
async function getAuthToken(): Promise<string | null> {
  // This would typically come from auth store
  return localStorage.getItem('auth_token')
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// ==================== Workspace API ====================

/**
 * Get all workspaces for the current user
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  return apiRequest<Workspace[]>('/workspaces')
}

/**
 * Get a specific workspace by ID
 */
export async function getWorkspace(id: string): Promise<Workspace> {
  return apiRequest<Workspace>(`/workspaces/${id}`)
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  request: CreateWorkspaceRequest
): Promise<Workspace> {
  return apiRequest<Workspace>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Update a workspace
 */
export async function updateWorkspace(
  id: string,
  request: UpdateWorkspaceRequest
): Promise<Workspace> {
  return apiRequest<Workspace>(`/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  })
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(id: string): Promise<void> {
  return apiRequest<void>(`/workspaces/${id}`, {
    method: 'DELETE',
  })
}

// ==================== Project API ====================

/**
 * Get all projects in a workspace
 */
export async function getProjects(workspaceId: string): Promise<Project[]> {
  return apiRequest<Project[]>(`/workspaces/${workspaceId}/projects`)
}

/**
 * Get a specific project by ID
 */
export async function getProject(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`)
}

/**
 * Create a new project
 */
export async function createProject(
  request: CreateProjectRequest
): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  request: UpdateProjectRequest
): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  })
}

/**
 * Archive a project
 */
export async function archiveProject(id: string): Promise<Project> {
  return updateProject(id, { status: ProjectStatus.Archived })
}

/**
 * Restore an archived project
 */
export async function restoreProject(id: string): Promise<Project> {
  return updateProject(id, { status: ProjectStatus.Active })
}

// ==================== Member API ====================

/**
 * Get all members of a workspace
 */
export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  return apiRequest<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`)
}

/**
 * Get a specific member by ID
 */
export async function getMember(memberId: string): Promise<WorkspaceMember> {
  return apiRequest<WorkspaceMember>(`/workspaces/members/${memberId}`)
}

/**
 * Invite a member to a workspace
 */
export async function inviteMember(
  workspaceId: string,
  email: string,
  role: WorkspaceRole
): Promise<WorkspaceMember> {
  return apiRequest<WorkspaceMember>(`/workspaces/${workspaceId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  })
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  memberId: string,
  role: WorkspaceRole
): Promise<WorkspaceMember> {
  return apiRequest<WorkspaceMember>(`/workspaces/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

/**
 * Remove a member from a workspace
 */
export async function removeMember(memberId: string): Promise<void> {
  return apiRequest<void>(`/workspaces/members/${memberId}`, {
    method: 'DELETE',
  })
}

// ==================== Workspace Settings API ====================

/**
 * Get workspace settings
 */
export async function getWorkspaceSettings(
  workspaceId: string
): Promise<Workspace['settings']> {
  const workspace = await getWorkspace(workspaceId)
  return workspace.settings
}

/**
 * Update workspace settings
 */
export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: Partial<Workspace['settings']>
): Promise<Workspace> {
  return updateWorkspace(workspaceId, { settings })
}

// ==================== Utility Functions ====================

/**
 * Check if user has permission in workspace
 */
export async function hasWorkspacePermission(
  workspaceId: string,
  _permission: string
): Promise<boolean> {
  try {
    const members = await getWorkspaceMembers(workspaceId)
    // For now, just check if user is a member
    return members.length > 0
  } catch {
    return false
  }
}

/**
 * Get workspace statistics
 */
export async function getWorkspaceStats(workspaceId: string): Promise<{
  projectCount: number
  memberCount: number
  activeProjectCount: number
}> {
  const [projects, members] = await Promise.all([
    getProjects(workspaceId),
    getWorkspaceMembers(workspaceId),
  ])

  return {
    projectCount: projects.length,
    memberCount: members.length,
    activeProjectCount: projects.filter((p) => p.status === 'active').length,
  }
}

// ==================== Export all API functions ====================

export const workspaceApi = {
  // Workspace
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,

  // Project
  getProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  restoreProject,

  // Member
  getWorkspaceMembers,
  getMember,
  inviteMember,
  updateMemberRole,
  removeMember,

  // Settings
  getWorkspaceSettings,
  updateWorkspaceSettings,

  // Utilities
  hasWorkspacePermission,
  getWorkspaceStats,
}

export default workspaceApi
