/**
 * Knowledge 模块 Store
 */

import { create } from 'zustand'
import type { KnowledgeDocument } from '../types/knowledge.types'

interface KnowledgeState {
  documents: KnowledgeDocument[]
  isLoading: boolean
  error: string | null
  fetchDocuments: () => Promise<void>
  clearError: () => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  documents: [], isLoading: false, error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null })
    set({ documents: [], isLoading: false })
  },
  clearError: () => set({ error: null }),
}))
