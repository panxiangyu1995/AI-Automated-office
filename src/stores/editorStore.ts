import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ActiveEditorDocumentState {
  id: string
  title: string
  isDirty: boolean
  isSaving: boolean
  lastSavedAt?: string
}

export interface EditorStoreState {
  activeDocument: ActiveEditorDocumentState | null
  setActiveDocument: (state: ActiveEditorDocumentState) => void
  clearActiveDocument: () => void
}

type PersistedState = Pick<EditorStoreState, 'activeDocument'>

export const useEditorStore = create<EditorStoreState>()(
  persist<EditorStoreState, [], [], PersistedState>(
    (set) => ({
      activeDocument: null,
      setActiveDocument: (state) => set({ activeDocument: state }),
      clearActiveDocument: () => set({ activeDocument: null }),
    }),
    {
      name: 'app-workspace-editor',
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        activeDocument: state.activeDocument,
      }),
    }
  )
)

