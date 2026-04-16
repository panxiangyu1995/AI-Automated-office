export type PanelType = 'properties' | 'diagnostics' | 'preview' | 'ai-suggestions' | 'problems'

export type DiagnosticSeverity = 'info' | 'warning' | 'error'

export interface PropertyItem {
  label: string
  value: string
  copyable?: boolean
}

export interface DiagnosticItem {
  id: string
  severity: DiagnosticSeverity
  message: string
  action?: string
}

export interface AiSuggestion {
  id: string
  content: string
  timestamp: number
  accepted?: boolean
}

export interface PreviewData {
  type: 'image' | 'pdf' | 'document'
  url: string
  zoom?: number
}

export interface PanelState {
  activePanel: PanelType
  properties: PropertyItem[]
  diagnostics: DiagnosticItem[]
  suggestions: AiSuggestion[]
  preview?: PreviewData
}

export interface PanelActions {
  setActivePanel: (panel: PanelType) => void
  setProperties: (properties: PropertyItem[]) => void
  addDiagnostic: (diagnostic: DiagnosticItem) => void
  removeDiagnostic: (id: string) => void
  clearDiagnostics: () => void
  addSuggestion: (suggestion: AiSuggestion) => void
  acceptSuggestion: (id: string) => void
  dismissSuggestion: (id: string) => void
  setPreview: (preview?: PreviewData) => void
}
