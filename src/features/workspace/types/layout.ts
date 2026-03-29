/**
 * Layout Preset Types
 * Story 41.7 - Workspace Layout Presets System
 *
 * Defines types for layout presets and workspace state persistence.
 */

// ==================== Enums ====================

/**
 * Preset type
 */
export enum PresetType {
  BuiltIn = 'built-in',
  Custom = 'custom',
}

/**
 * Preset mode
 */
export enum PresetMode {
  Focus = 'focus',
  Approval = 'approval',
  Draft = 'draft',
  Audit = 'audit',
}

// ==================== Interfaces ====================

/**
 * Layout configuration for a preset
 */
export interface LayoutConfig {
  /** Sidebar width in pixels */
  sidebarWidth: number
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean
  /** Chat panel width in pixels */
  chatPanelWidth: number
  /** Whether chat panel is collapsed */
  chatPanelCollapsed: boolean
  /** Bottom panel height in pixels */
  bottomPanelHeight: number
  /** Whether bottom panel is collapsed */
  bottomPanelCollapsed: boolean
  /** Top bar visibility */
  topBarVisible: boolean
  /** AI panel visibility */
  aiPanelVisible: boolean
  /** Active sidebar tab */
  activeSidebarTab?: string
  /** Column layout configuration */
  columns?: ColumnConfig[]
}

/**
 * Column configuration for workbench
 */
export interface ColumnConfig {
  /** Column identifier */
  id: string
  /** Column width ratio */
  widthRatio: number
  /** Column visibility */
  visible: boolean
  /** Column order */
  order: number
}

/**
 * AI panel configuration
 */
export interface AIPanelConfig {
  /** Panel width */
  width: number
  /** Panel visibility */
  visible: boolean
  /** Active tab */
  activeTab?: string
}

/**
 * Filter state
 */
export interface FilterState {
  /** Filter key */
  key: string
  /** Filter value */
  value: string
}

/**
 * Tab state
 */
export interface TabState {
  /** Tab ID */
  id: string
  /** Tab label */
  label: string
  /** Tab type */
  type: string
  /** Whether tab is active */
  isActive: boolean
  /** Tab order */
  order: number
}

/**
 * Workspace state for persistence
 */
export interface WorkspaceState {
  /** Layout configuration */
  layout: LayoutConfig
  /** AI panel configuration */
  aiPanel?: AIPanelConfig
  /** Open tabs */
  tabs: TabState[]
  /** Active tab ID */
  activeTabId?: string
  /** Filter states */
  filters: FilterState[]
  /** Scroll positions */
  scrollPositions?: Record<string, number>
}

/**
 * Layout preset entity
 */
export interface LayoutPreset {
  /** Unique preset identifier */
  id: string
  /** Preset name */
  name: string
  /** Preset description */
  description?: string
  /** Preset type */
  type: PresetType
  /** Preset mode */
  mode?: PresetMode
  /** Workspace ID this preset belongs to (null for built-in) */
  workspaceId?: string
  /** Layout configuration */
  layout: LayoutConfig
  /** Creator user ID */
  createdBy?: string
  /** Creation timestamp */
  createdAt: number
  /** Last update timestamp */
  updatedAt: number
  /** Whether this is the default preset */
  isDefault: boolean
}

// ==================== Default Values ====================

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  sidebarWidth: 240,
  sidebarCollapsed: false,
  chatPanelWidth: 400,
  chatPanelCollapsed: false,
  bottomPanelHeight: 200,
  bottomPanelCollapsed: true,
  topBarVisible: true,
  aiPanelVisible: true,
  activeSidebarTab: undefined,
  columns: undefined,
}

/**
 * Default workspace state
 */
export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  layout: DEFAULT_LAYOUT_CONFIG,
  tabs: [],
  filters: [],
}

/**
 * Built-in presets
 */
export const BUILT_IN_PRESETS: Omit<LayoutPreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '专注模式',
    description: '适合深度工作的极简布局',
    type: PresetType.BuiltIn,
    mode: PresetMode.Focus,
    layout: {
      sidebarWidth: 60,
      sidebarCollapsed: true,
      chatPanelWidth: 400,
      chatPanelCollapsed: true,
      bottomPanelHeight: 0,
      bottomPanelCollapsed: true,
      topBarVisible: true,
      aiPanelVisible: false,
    },
    isDefault: false,
  },
  {
    name: '审批模式',
    description: '快速处理审批单据的高效布局',
    type: PresetType.BuiltIn,
    mode: PresetMode.Approval,
    layout: {
      sidebarWidth: 200,
      sidebarCollapsed: false,
      chatPanelWidth: 400,
      chatPanelCollapsed: false,
      bottomPanelHeight: 150,
      bottomPanelCollapsed: false,
      topBarVisible: true,
      aiPanelVisible: true,
    },
    isDefault: false,
  },
  {
    name: '起草模式',
    description: '撰写文档和起草内容',
    type: PresetType.BuiltIn,
    mode: PresetMode.Draft,
    layout: {
      sidebarWidth: 240,
      sidebarCollapsed: false,
      chatPanelWidth: 400,
      chatPanelCollapsed: true,
      bottomPanelHeight: 200,
      bottomPanelCollapsed: false,
      topBarVisible: true,
      aiPanelVisible: true,
    },
    isDefault: false,
  },
  {
    name: '审计模式',
    description: '全面查看和审计的布局',
    type: PresetType.BuiltIn,
    mode: PresetMode.Audit,
    layout: {
      sidebarWidth: 240,
      sidebarCollapsed: false,
      chatPanelWidth: 400,
      chatPanelCollapsed: false,
      bottomPanelHeight: 300,
      bottomPanelCollapsed: false,
      topBarVisible: true,
      aiPanelVisible: true,
    },
    isDefault: false,
  },
]
