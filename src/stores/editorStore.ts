import { create } from 'zustand'

export interface ActiveEditorDocumentState {
  id: string
  title: string
  isDirty: boolean
  isSaving: boolean
  lastSavedAt?: string
}

interface EditorStoreState {
  activeDocument: ActiveEditorDocumentState | null
  setActiveDocument: (state: ActiveEditorDocumentState) => void
  clearActiveDocument: () => void
}

export const useEditorStore = create<EditorStoreState>((set) => ({
  activeDocument: null,
  setActiveDocument: (state) => set({ activeDocument: state }),
  clearActiveDocument: () => set({ activeDocument: null }),
}))

