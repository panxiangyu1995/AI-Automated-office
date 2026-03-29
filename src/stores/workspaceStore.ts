/**
 * Workspace Store
 * Story 41.5 - Workspace Data Model and Basic Framework
 *
 * Zustand store for workspace state management with persistence.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Workspace,
  Project,
  WorkspaceMember,
  WorkspaceState,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  WorkspaceRole,
} from '../features/workspace/types'

import { ProjectStatus } from '../features/workspace/types'

// ==================== Store Interface ====================

interface WorkspaceActions {
  // Workspace CRUD
  createWorkspace: (request: CreateWorkspaceRequest) => Promise<Workspace | null>
  updateWorkspace: (id: string, request: UpdateWorkspaceRequest) => Promise<Workspace | null>
  deleteWorkspace: (id: string) => Promise<boolean>
  fetchWorkspaces: () => Promise<void>
  fetchWorkspace: (id: string) => Promise<Workspace | null>

  // Project CRUD
  createProject: (request: CreateProjectRequest) => Promise<Project | null>
  updateProject: (id: string, request: UpdateProjectRequest) => Promise<Project | null>
  archiveProject: (id: string) => Promise<boolean>
  fetchProjects: (workspaceId: string) => Promise<void>

  // Member management
  fetchMembers: (workspaceId: string) => Promise<void>
  inviteMember: (workspaceId: string, email: string, role: WorkspaceRole) => Promise<WorkspaceMember | null>
  updateMemberRole: (memberId: string, role: WorkspaceRole) => Promise<boolean>
  removeMember: (memberId: string) => Promise<boolean>

  // Workspace switching
  setCurrentWorkspace: (workspaceId: string) => Promise<void>
  setCurrentProject: (projectId: string | null) => void

  // State management
  clearError: () => void
  reset: () => void
}

type WorkspaceStore = WorkspaceState & WorkspaceActions

// ==================== Initial State ====================

const initialState: WorkspaceState = {
  currentWorkspaceId: null,
  currentProjectId: null,
  workspaces: [],
  currentWorkspace: null,
  projects: [],
  members: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
}

// ==================== Store Implementation ====================

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ==================== Workspace CRUD ====================

      createWorkspace: async (request: CreateWorkspaceRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })

          if (!response.ok) {
            throw new Error('Failed to create workspace')
          }

          const workspace: Workspace = await response.json()

          set((state) => ({
            workspaces: [...state.workspaces, workspace],
            isLoading: false,
          }))

          return workspace
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return null
        }
      },

      updateWorkspace: async (id: string, request: UpdateWorkspaceRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/workspaces/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })

          if (!response.ok) {
            throw new Error('Failed to update workspace')
          }

          const workspace: Workspace = await response.json()

          set((state) => ({
            workspaces: state.workspaces.map((w) => (w.id === id ? workspace : w)),
            currentWorkspace: state.currentWorkspaceId === id ? workspace : state.currentWorkspace,
            isLoading: false,
          }))

          return workspace
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return null
        }
      },

      deleteWorkspace: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/workspaces/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete workspace')
          }

          set((state) => {
            const newWorkspaces = state.workspaces.filter((w) => w.id !== id)
            const newCurrentWorkspaceId =
              state.currentWorkspaceId === id
                ? newWorkspaces[0]?.id || null
                : state.currentWorkspaceId

            return {
              workspaces: newWorkspaces,
              currentWorkspaceId: newCurrentWorkspaceId,
              currentWorkspace:
                state.currentWorkspaceId === id ? null : state.currentWorkspace,
              isLoading: false,
            }
          })

          return true
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return false
        }
      },

      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/workspaces')

          if (!response.ok) {
            throw new Error('Failed to fetch workspaces')
          }

          const workspaces: Workspace[] = await response.json()

          set({
            workspaces,
            isLoading: false,
            lastFetchedAt: Date.now(),
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
        }
      },

      fetchWorkspace: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/workspaces/${id}`)

          if (!response.ok) {
            throw new Error('Failed to fetch workspace')
          }

          const workspace: Workspace = await response.json()

          set((state) => ({
            workspaces: state.workspaces.some((w) => w.id === id)
              ? state.workspaces.map((w) => (w.id === id ? workspace : w))
              : [...state.workspaces, workspace],
            isLoading: false,
          }))

          return workspace
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return null
        }
      },

      // ==================== Project CRUD ====================

      createProject: async (request: CreateProjectRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })

          if (!response.ok) {
            throw new Error('Failed to create project')
          }

          const project: Project = await response.json()

          set((state) => ({
            projects: [...state.projects, project],
            isLoading: false,
          }))

          return project
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return null
        }
      },

      updateProject: async (id: string, request: UpdateProjectRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })

          if (!response.ok) {
            throw new Error('Failed to update project')
          }

          const project: Project = await response.json()

          set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? project : p)),
            isLoading: false,
          }))

          return project
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return null
        }
      },

      archiveProject: async (id: string) => {
        const result = await get().updateProject(id, { status: ProjectStatus.Archived })
        return result !== null
      },

      fetchProjects: async (workspaceId: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}/projects`)

          if (!response.ok) {
            throw new Error('Failed to fetch projects')
          }

          const projects: Project[] = await response.json()

          set({ projects, isLoading: false })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
        }
      },

      // ==================== Member Management ====================

      fetchMembers: async (workspaceId: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}/members`)

          if (!response.ok) {
            throw new Error('Failed to fetch members')
          }

          const members: WorkspaceMember[] = await response.json()

          set({ members, isLoading: false })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
        }
      },

      inviteMember: async (workspaceId: string, email: string, role: WorkspaceRole) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role }),
          })

          if (!response.ok) {
            throw new Error('Failed to invite member')
          }

          const member: WorkspaceMember = await response.json()

          set((state) => ({
            members: [...state.members, member],
            isLoading: false,
          }))

          return member
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return null
        }
      },

      updateMemberRole: async (memberId: string, role: WorkspaceRole) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/workspaces/members/${memberId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
          })

          if (!response.ok) {
            throw new Error('Failed to update member role')
          }

          const member: WorkspaceMember = await response.json()

          set((state) => ({
            members: state.members.map((m) => (m.id === memberId ? member : m)),
            isLoading: false,
          }))

          return true
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return false
        }
      },

      removeMember: async (memberId: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/workspaces/members/${memberId}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to remove member')
          }

          set((state) => ({
            members: state.members.filter((m) => m.id !== memberId),
            isLoading: false,
          }))

          return true
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          set({ isLoading: false, error: message })
          return false
        }
      },

      // ==================== Workspace Switching ====================

      setCurrentWorkspace: async (workspaceId: string) => {
        const { workspaces, fetchProjects, fetchMembers } = get()

        // Find workspace from cache or fetch
        let workspace = workspaces.find((w) => w.id === workspaceId)

        if (!workspace) {
          workspace = await get().fetchWorkspace(workspaceId) || undefined
        }

        if (!workspace) {
          set({ error: 'Workspace not found' })
          return
        }

        // Update current workspace
        set({
          currentWorkspaceId: workspaceId,
          currentWorkspace: workspace,
          currentProjectId: workspace.settings.defaultProjectId || null,
        })

        // Fetch projects and members for the new workspace
        await Promise.all([
          fetchProjects(workspaceId),
          fetchMembers(workspaceId),
        ])
      },

      setCurrentProject: (projectId: string | null) => {
        set({ currentProjectId: projectId })
      },

      // ==================== State Management ====================

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'workspace-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
)

// ==================== Selectors ====================

/**
 * Get current workspace ID
 */
export const selectCurrentWorkspaceId = (state: WorkspaceStore) => state.currentWorkspaceId

/**
 * Get current project ID
 */
export const selectCurrentProjectId = (state: WorkspaceStore) => state.currentProjectId

/**
 * Get current workspace
 */
export const selectCurrentWorkspace = (state: WorkspaceStore) => state.currentWorkspace

/**
 * Get all workspaces
 */
export const selectWorkspaces = (state: WorkspaceStore) => state.workspaces

/**
 * Get projects in current workspace
 */
export const selectProjects = (state: WorkspaceStore) => state.projects

/**
 * Get active projects (non-archived)
 */
export const selectActiveProjects = (state: WorkspaceStore) =>
  state.projects.filter((p) => p.status === 'active')

/**
 * Get workspace members
 */
export const selectMembers = (state: WorkspaceStore) => state.members

/**
 * Get workspace loading state
 */
export const selectIsLoading = (state: WorkspaceStore) => state.isLoading

/**
 * Get workspace error
 */
export const selectError = (state: WorkspaceStore) => state.error

/**
 * Check if current user is workspace owner
 */
export const selectIsOwner = (state: WorkspaceStore) =>
  state.currentWorkspace?.ownerId === state.currentWorkspace?.ownerId

/**
 * Check if current user has admin role or higher
 */
export const selectIsAdmin = (state: WorkspaceStore) => {
  const member = state.members.find(
    (m) => m.workspaceId === state.currentWorkspaceId
  )
  return member?.role === 'owner' || member?.role === 'admin'
}

// ==================== Hooks ====================

/**
 * Hook to use workspace store
 */
export const useWorkspace = () => useWorkspaceStore()

/**
 * Hook to get current workspace context
 */
export const useCurrentWorkspace = () => {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId)
  const workspace = useWorkspaceStore((state) => state.currentWorkspace)
  const projectId = useWorkspaceStore((state) => state.currentProjectId)

  return { workspaceId, workspace, projectId }
}

/**
 * Hook to get workspace actions
 */
export const useWorkspaceActions = () => {
  const store = useWorkspaceStore()

  return {
    createWorkspace: store.createWorkspace,
    updateWorkspace: store.updateWorkspace,
    deleteWorkspace: store.deleteWorkspace,
    fetchWorkspaces: store.fetchWorkspaces,
    setCurrentWorkspace: store.setCurrentWorkspace,
    createProject: store.createProject,
    updateProject: store.updateProject,
    archiveProject: store.archiveProject,
    setCurrentProject: store.setCurrentProject,
    inviteMember: store.inviteMember,
    updateMemberRole: store.updateMemberRole,
    removeMember: store.removeMember,
  }
}

export default useWorkspaceStore
