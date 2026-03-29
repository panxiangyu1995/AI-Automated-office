/**
 * Workspace Types
 * Story 41.5 - Workspace Data Model and Basic Framework
 *
 * Defines the core data models for Workspace, Project, and WorkspaceMember.
 */

// ==================== Enums ====================

/**
 * Workspace role enumeration
 */
export enum WorkspaceRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member',
  Viewer = 'viewer',
}

/**
 * Project status enumeration
 */
export enum ProjectStatus {
  Active = 'active',
  Archived = 'archived',
}

/**
 * Workspace visibility
 */
export enum WorkspaceVisibility {
  Private = 'private',
  Organization = 'organization',
  Public = 'public',
}

// ==================== Interfaces ====================

/**
 * Workspace entity
 * Represents a workspace that contains projects and members
 */
export interface Workspace {
  /** Unique workspace identifier */
  id: string
  /** Workspace name */
  name: string
  /** Workspace description */
  description?: string
  /** Tenant ID this workspace belongs to */
  tenantId: string
  /** Workspace visibility */
  visibility: WorkspaceVisibility
  /** Owner user ID */
  ownerId: string
  /** Creation timestamp */
  createdAt: number
  /** Last update timestamp */
  updatedAt: number
  /** Whether this is the default workspace */
  isDefault: boolean
  /** Workspace settings */
  settings: WorkspaceSettings
  /** Workspace metadata */
  metadata?: Record<string, unknown>
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  /** Default project ID */
  defaultProjectId?: string
  /** Default entry point */
  defaultEntry?: string
  /** Allowed tools in this workspace */
  allowedTools?: string[]
  /** Enabled plugins */
  enabledPlugins?: string[]
  /** Layout preset ID */
  layoutPresetId?: string
  /** Theme settings */
  theme?: {
    primaryColor?: string
    secondaryColor?: string
  }
}

/**
 * Project entity
 * Represents a project within a workspace
 */
export interface Project {
  /** Unique project identifier */
  id: string
  /** Project name */
  name: string
  /** Project description */
  description?: string
  /** Workspace ID this project belongs to */
  workspaceId: string
  /** Project status */
  status: ProjectStatus
  /** Project owner ID */
  ownerId: string
  /** Creation timestamp */
  createdAt: number
  /** Last update timestamp */
  updatedAt: number
  /** Project settings */
  settings: ProjectSettings
  /** Project metadata */
  metadata?: Record<string, unknown>
}

/**
 * Project settings
 */
export interface ProjectSettings {
  /** Allowed tools in this project */
  allowedTools?: string[]
  /** Project-specific plugins */
  plugins?: string[]
  /** Default view */
  defaultView?: string
  /** Custom fields */
  customFields?: Record<string, unknown>
}

/**
 * Workspace member
 * Represents a user's membership in a workspace with a specific role
 */
export interface WorkspaceMember {
  /** Unique membership identifier */
  id: string
  /** Workspace ID */
  workspaceId: string
  /** User ID */
  userId: string
  /** User display name */
  displayName?: string
  /** User email */
  email?: string
  /** User avatar URL */
  avatarUrl?: string
  /** Role in the workspace */
  role: WorkspaceRole
  /** When the user joined */
  joinedAt: number
  /** Last active timestamp */
  lastActiveAt?: number
  /** Member metadata */
  metadata?: Record<string, unknown>
}

// ==================== API Request/Response Types ====================

/**
 * Create workspace request
 */
export interface CreateWorkspaceRequest {
  name: string
  description?: string
  visibility?: WorkspaceVisibility
}

/**
 * Update workspace request
 */
export interface UpdateWorkspaceRequest {
  name?: string
  description?: string
  visibility?: WorkspaceVisibility
  settings?: Partial<WorkspaceSettings>
}

/**
 * Create project request
 */
export interface CreateProjectRequest {
  name: string
  description?: string
  workspaceId: string
}

/**
 * Update project request
 */
export interface UpdateProjectRequest {
  name?: string
  description?: string
  status?: ProjectStatus
  settings?: Partial<ProjectSettings>
}

/**
 * Invite member request
 */
export interface InviteMemberRequest {
  workspaceId: string
  email: string
  role: WorkspaceRole
}

/**
 * Update member role request
 */
export interface UpdateMemberRoleRequest {
  memberId: string
  role: WorkspaceRole
}

// ==================== Store Types ====================

/**
 * Workspace store state
 */
export interface WorkspaceState {
  /** Current workspace ID */
  currentWorkspaceId: string | null
  /** Current project ID */
  currentProjectId: string | null
  /** Workspace list */
  workspaces: Workspace[]
  /** Current workspace */
  currentWorkspace: Workspace | null
  /** Projects in current workspace */
  projects: Project[]
  /** Members in current workspace */
  members: WorkspaceMember[]
  /** Loading states */
  isLoading: boolean
  /** Error state */
  error: string | null
  /** Last fetch timestamp */
  lastFetchedAt: number | null
}

// ==================== Default Values ====================

/**
 * Default workspace settings
 */
export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  defaultProjectId: undefined,
  defaultEntry: undefined,
  allowedTools: undefined,
  enabledPlugins: undefined,
  layoutPresetId: undefined,
  theme: undefined,
}

/**
 * Default project settings
 */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  allowedTools: undefined,
  plugins: undefined,
  defaultView: undefined,
  customFields: undefined,
}
