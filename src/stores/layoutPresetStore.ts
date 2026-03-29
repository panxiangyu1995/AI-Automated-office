/**
 * Layout Preset Store
 * Story 41.7 - Workspace Layout Presets System
 *
 * Zustand store for layout preset state management with persistence.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  LayoutPreset,
  WorkspaceState,
  PresetType,
  PresetMode,
} from '../features/workspace/types/layout'
import {
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_WORKSPACE_STATE,
  BUILT_IN_PRESETS,
} from '../features/workspace/types/layout'

// ==================== Store Interface ====================

interface LayoutPresetActions {
  // CRUD operations
  createPreset: (preset: Omit<LayoutPreset, 'id' | 'createdAt' | 'updatedAt'>) => LayoutPreset
  updatePreset: (id: string, updates: Partial<LayoutPreset>) => LayoutPreset | null
  deletePreset: (id: string) => boolean
  duplicatePreset: (id: string, newName: string) => LayoutPreset | null

  // Built-in presets
  getBuiltInPresets: () => LayoutPreset[]
  getBuiltInPresetByMode: (mode: PresetMode) => LayoutPreset | null

  // Custom presets
  getCustomPresets: (workspaceId: string) => LayoutPreset[]
  getPresetById: (id: string) => LayoutPreset | null

  // Active preset management
  setActivePresetId: (presetId: string | null) => void
  setActivePresetIdByMode: (mode: PresetMode) => void

  // Workspace state management
  applyPresetToWorkspaceState: (preset: LayoutPreset) => WorkspaceState
  recoverWorkspaceState: (workspaceId: string) => WorkspaceState

  // Initialization
  initializeBuiltInPresets: () => void

  // State management
  clearError: () => void
  reset: () => void
}

interface LayoutPresetState {
  // Custom presets storage
  customPresets: LayoutPreset[]

  // Active preset tracking
  activePresetId: string | null
  activePresetMode: PresetMode | null

  // Error handling
  error: string | null

  // Last sync timestamp
  lastSyncAt: number | null
}

type LayoutPresetStore = LayoutPresetState & LayoutPresetActions

// ==================== Initial State ====================

const initialState: LayoutPresetState = {
  customPresets: [],
  activePresetId: null,
  activePresetMode: null,
  error: null,
  lastSyncAt: null,
}

// ==================== Helper Functions ====================

/**
 * Generate unique preset ID
 */
function generatePresetId(type: PresetType, workspaceId?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  if (type === PresetType.BuiltIn) {
    return `builtin-${timestamp}-${random}`
  }
  return `custom-${workspaceId || 'global'}-${timestamp}-${random}`
}

/**
 * Get current timestamp
 */
function getCurrentTimestamp(): number {
  return Date.now()
}

/**
 * Create a full preset from partial data
 */
function createPresetEntity(
  data: Omit<LayoutPreset, 'id' | 'createdAt' | 'updatedAt'>
): LayoutPreset {
  return {
    ...data,
    id: generatePresetId(data.type, data.workspaceId),
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  }
}

// ==================== Store Implementation ====================

export const useLayoutPresetStore = create<LayoutPresetStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ==================== CRUD Operations ====================

      createPreset: (
        presetData: Omit<LayoutPreset, 'id' | 'createdAt' | 'updatedAt'>
      ) => {
        const preset = createPresetEntity(presetData)

        set((state) => ({
          customPresets: [...state.customPresets, preset],
          lastSyncAt: getCurrentTimestamp(),
        }))

        return preset
      },

      updatePreset: (id: string, updates: Partial<LayoutPreset>) => {
        const { customPresets } = get()
        const index = customPresets.findIndex((p) => p.id === id)

        if (index === -1) {
          set({ error: 'Preset not found' })
          return null
        }

        const updatedPreset: LayoutPreset = {
          ...customPresets[index],
          ...updates,
          id, // Ensure ID cannot be changed
          updatedAt: getCurrentTimestamp(),
        }

        const newPresets = [...customPresets]
        newPresets[index] = updatedPreset

        set({
          customPresets: newPresets,
          lastSyncAt: getCurrentTimestamp(),
        })

        return updatedPreset
      },

      deletePreset: (id: string) => {
        const { customPresets, activePresetId } = get()
        const preset = customPresets.find((p) => p.id === id)

        if (!preset) {
          set({ error: 'Preset not found' })
          return false
        }

        // Cannot delete built-in presets
        if (preset.type === PresetType.BuiltIn) {
          set({ error: 'Cannot delete built-in preset' })
          return false
        }

        const newPresets = customPresets.filter((p) => p.id !== id)

        set({
          customPresets: newPresets,
          activePresetId: activePresetId === id ? null : activePresetId,
          lastSyncAt: getCurrentTimestamp(),
        })

        return true
      },

      duplicatePreset: (id: string, newName: string) => {
        const { getPresetById } = get()
        const original = getPresetById(id)

        if (!original) {
          set({ error: 'Preset not found' })
          return null
        }

        const duplicate: LayoutPreset = {
          ...original,
          id: generatePresetId(PresetType.Custom, original.workspaceId),
          name: newName,
          type: PresetType.Custom,
          isDefault: false,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        }

        set((state) => ({
          customPresets: [...state.customPresets, duplicate],
          lastSyncAt: getCurrentTimestamp(),
        }))

        return duplicate
      },

      // ==================== Built-in Presets ====================

      getBuiltInPresets: () => {
        const timestamp = getCurrentTimestamp()
        return BUILT_IN_PRESETS.map((preset, index) => ({
          ...preset,
          id: `builtin-${preset.mode || index}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }))
      },

      getBuiltInPresetByMode: (mode: PresetMode) => {
        const timestamp = getCurrentTimestamp()
        const builtin = BUILT_IN_PRESETS.find((p) => p.mode === mode)

        if (!builtin) return null

        return {
          ...builtin,
          id: `builtin-${mode}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      },

      // ==================== Custom Presets ====================

      getCustomPresets: (workspaceId: string) => {
        return get().customPresets.filter(
          (p) => p.workspaceId === workspaceId || !p.workspaceId
        )
      },

      getPresetById: (id: string) => {
        const { customPresets } = get()

        // Check custom presets first
        const custom = customPresets.find((p) => p.id === id)
        if (custom) return custom

        // Check built-in presets
        const builtins = get().getBuiltInPresets()
        return builtins.find((p) => p.id === id) || null
      },

      // ==================== Active Preset Management ====================

      setActivePresetId: (presetId: string | null) => {
        const { getPresetById } = get()

        if (presetId === null) {
          set({ activePresetId: null, activePresetMode: null })
          return
        }

        const preset = getPresetById(presetId)
        if (preset) {
          set({
            activePresetId: presetId,
            activePresetMode: preset.mode || null,
          })
        } else {
          set({ error: 'Preset not found' })
        }
      },

      setActivePresetIdByMode: (mode: PresetMode) => {
        const { getBuiltInPresetByMode } = get()
        const preset = getBuiltInPresetByMode(mode)

        if (preset) {
          set({
            activePresetId: preset.id,
            activePresetMode: mode,
          })
        } else {
          set({ error: `Built-in preset for mode ${mode} not found` })
        }
      },

      // ==================== Workspace State Management ====================

      applyPresetToWorkspaceState: (preset: LayoutPreset) => {
        // Apply preset layout to workspace state
        const newState: WorkspaceState = {
          ...DEFAULT_WORKSPACE_STATE,
          layout: {
            ...preset.layout,
          },
        }

        // Update active preset
        set({
          activePresetId: preset.id,
          activePresetMode: preset.mode || null,
        })

        return newState
      },

      recoverWorkspaceState: (workspaceId: string) => {
        const { customPresets, activePresetId } = get()

        // Find workspace-specific active preset
        const workspacePreset = customPresets.find(
          (p) => p.workspaceId === workspaceId && p.id === activePresetId
        )

        if (workspacePreset) {
          return get().applyPresetToWorkspaceState(workspacePreset)
        }

        // Fallback to default built-in preset
        const defaultPreset = get().getBuiltInPresetByMode(PresetMode.Focus)
        if (defaultPreset) {
          return get().applyPresetToWorkspaceState(defaultPreset)
        }

        // Ultimate fallback to default layout
        return {
          ...DEFAULT_WORKSPACE_STATE,
          layout: { ...DEFAULT_LAYOUT_CONFIG },
        }
      },

      // ==================== Initialization ====================

      initializeBuiltInPresets: () => {
        const { getBuiltInPresets } = get()
        const builtins = getBuiltInPresets()

        // Built-in presets are computed dynamically, not stored
        // This function can be used for any initialization logic
        set({ lastSyncAt: getCurrentTimestamp() })

        return builtins
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
      name: 'layout-preset-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customPresets: state.customPresets,
        activePresetId: state.activePresetId,
        activePresetMode: state.activePresetMode,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
)

// ==================== Selectors ====================

/**
 * Get all presets (built-in + custom) for a workspace
 */
export const selectAllPresetsForWorkspace = (workspaceId: string) => (state: LayoutPresetStore) => {
  const builtins = state.getBuiltInPresets()
  const custom = state.getCustomPresets(workspaceId)
  return [...builtins, ...custom]
}

/**
 * Get active preset
 */
export const selectActivePreset = (state: LayoutPresetStore) => {
  if (!state.activePresetId) return null
  return state.getPresetById(state.activePresetId)
}

/**
 * Get active preset ID
 */
export const selectActivePresetId = (state: LayoutPresetStore) => state.activePresetId

/**
 * Get active preset mode
 */
export const selectActivePresetMode = (state: LayoutPresetStore) => state.activePresetMode

/**
 * Get custom presets for workspace
 */
export const selectCustomPresets = (workspaceId: string) => (state: LayoutPresetStore) =>
  state.getCustomPresets(workspaceId)

/**
 * Get built-in presets
 */
export const selectBuiltInPresets = (state: LayoutPresetStore) => state.getBuiltInPresets()

/**
 * Get preset by ID
 */
export const selectPresetById = (id: string) => (state: LayoutPresetStore) =>
  state.getPresetById(id)

// ==================== Hooks ====================

/**
 * Hook to use layout preset store
 */
export const useLayoutPreset = () => useLayoutPresetStore()

/**
 * Hook to get presets for a specific workspace
 */
export const useWorkspacePresets = (workspaceId: string) => {
  return useLayoutPresetStore((state) => ({
    allPresets: selectAllPresetsForWorkspace(workspaceId)(state),
    builtInPresets: state.getBuiltInPresets(),
    customPresets: state.getCustomPresets(workspaceId),
    activePreset: selectActivePreset(state),
    activePresetId: state.activePresetId,
    activePresetMode: state.activePresetMode,
  }))
}

/**
 * Hook to apply a preset
 */
export const useApplyPreset = () => {
  return useLayoutPresetStore((state) => ({
    applyPreset: state.applyPresetToWorkspaceState,
    setActivePreset: state.setActivePresetId,
    setActivePresetByMode: state.setActivePresetIdByMode,
  }))
}

export default useLayoutPresetStore
