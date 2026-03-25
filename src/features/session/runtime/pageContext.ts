/**
 * Page and Resource Context - Runtime Context Integration
 * Task 77: Story 47.2 - Page and Resource Context
 * 
 * This module provides page context integration for the agent runtime:
 * - Page context contract from host runtime
 * - Active resource references
 * - Context resolution per mode (static, dynamic, editor)
 * - Safe exposure to planner and tool runtime
 */

// ==================== Page Context Types ====================

/**
 * Page mode for context resolution
 */
export type PageMode = 
  | 'static'    // Static content display
  | 'dynamic'   // Dynamic form/table rendering
  | 'editor'    // Editor mode with file/content editing
  | 'dashboard' // Dashboard with data visualization
  | 'admin'     // Admin configuration pages
  | 'custom'    // Custom page types

/**
 * Resource type enumeration
 */
export type ResourceType =
  | 'form'          // Dynamic form
  | 'table'         // Data table
  | 'detail'        // Detail view
  | 'document'      // Document/file
  | 'report'        // Report/analysis
  | 'workflow'      // Workflow/approval
  | 'dashboard'     // Dashboard card
  | 'template'      // Template resource
  | 'user'          // User resource
  | 'permission'    // Permission resource
  | 'config'        // Configuration resource
  | 'custom'        // Custom resource type

/**
 * Resource state
 */
export type ResourceState =
  | 'loading'     // Resource is loading
  | 'ready'       // Resource is ready for use
  | 'editing'     // Resource is being edited
  | 'saving'      // Resource is being saved
  | 'error'       // Resource has an error
  | 'locked'      // Resource is locked by another user
  | 'archived'    // Resource is archived

/**
 * Resource reference
 */
export interface ResourceReference {
  /** Unique resource identifier */
  id: string
  /** Resource type */
  type: ResourceType
  /** Resource name/title */
  name: string
  /** Resource state */
  state: ResourceState
  /** Parent resource ID if nested */
  parentId?: string
  /** Version or revision number */
  version?: number
  /** Last modified timestamp */
  lastModified?: number
  /** Modified by user ID */
  modifiedBy?: string
  /** Resource metadata */
  metadata?: Record<string, unknown>
  /** Resource permissions for current user */
  permissions?: string[]
  /** Whether resource is active/focused */
  isActive?: boolean
  /** Edit mode (view, edit, create) */
  editMode?: 'view' | 'edit' | 'create'
}

/**
 * Page location information
 */
export interface PageLocation {
  /** Page route path */
  route: string
  /** Page title */
  title?: string
  /** Page mode */
  mode: PageMode
  /** Query parameters */
  query?: Record<string, string>
  /** Route parameters */
  params?: Record<string, string>
  /** Breadcrumb trail */
  breadcrumbs?: Array<{
    path: string
    title: string
  }>
  /** Timestamp when page was opened */
  openedAt: number
  /** Navigation source (how user arrived) */
  navigationSource?: 'menu' | 'link' | 'back' | 'forward' | 'refresh' | 'search' | 'other'
}

/**
 * Editor context (when in editor mode)
 */
export interface EditorContext {
  /** Editor type */
  editorType: 'text' | 'code' | 'rich' | 'form' | 'table' | 'custom'
  /** Current file/content path */
  contentPath?: string
  /** Content type (mime type) */
  contentType?: string
  /** Whether content is dirty (has unsaved changes) */
  isDirty: boolean
  /** Cursor position information */
  cursorPosition?: {
    line: number
    column: number
    offset: number
  }
  /** Selection information */
  selection?: {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
    text?: string
  }
  /** Editor language mode */
  language?: string
  /** Editor-specific settings */
  settings?: Record<string, unknown>
  /** Undo stack size */
  undoStackSize?: number
  /** Redo stack size */
  redoStackSize?: number
}

/**
 * Dynamic context (for dynamic forms/tables)
 */
export interface DynamicContext {
  /** Form/table ID */
  dynamicId: string
  /** Schema version */
  schemaVersion: string
  /** Current data binding state */
  dataBinding?: Record<string, unknown>
  /** Validation state */
  validationState?: {
    isValid: boolean
    errors: Array<{
      field: string
      message: string
    }>
    warnings: Array<{
      field: string
      message: string
    }>
  }
  /** Dirty fields */
  dirtyFields?: string[]
  /** Current step (for multi-step forms) */
  currentStep?: number
  /** Total steps (for multi-step forms) */
  totalSteps?: number
  /** Dynamic configuration */
  config?: Record<string, unknown>
}

/**
 * Page context contract
 */
export interface PageContext {
  /** Unique context identifier */
  contextId: string
  /** Context creation timestamp */
  createdAt: number
  /** Context last updated timestamp */
  updatedAt: number
  /** Context expiration timestamp */
  expiresAt?: number
  
  /** Page location information */
  location: PageLocation
  
  /** Active resource references */
  resources: ResourceReference[]
  /** Primary/focused resource */
  primaryResource?: ResourceReference
  /** Secondary/related resources */
  secondaryResources?: ResourceReference[]
  
  /** Editor context (if in editor mode) */
  editor?: EditorContext
  /** Dynamic context (if in dynamic mode) */
  dynamic?: DynamicContext
  
  /** Page-specific metadata */
  metadata?: Record<string, unknown>
  
  /** Feature flags for this page */
  features?: string[]
  
  /** Context source (where context was assembled) */
  source: 'host' | 'url' | 'cache' | 'session'
}

/**
 * Page context envelope with runtime integration
 */
export interface PageContextEnvelope {
  /** Page context */
  page: PageContext
  /** Associated user context ID (from Story 47.1) */
  userContextId?: string
  /** Session ID this context belongs to */
  sessionId?: string
  /** Host ID that provided the context */
  hostId: string
  /** Context freshness indicator */
  freshness: 'fresh' | 'stale' | 'expired'
  /** Whether context has unsaved changes */
  hasUnsavedChanges: boolean
  /** Last sync timestamp */
  lastSyncedAt: number
}

// ==================== Context Resolution Types ====================

/**
 * Context resolution mode
 */
export type ResolutionMode = 
  | 'eager'    // Load all context immediately
  | 'lazy'     // Load context on demand
  | 'cached'   // Use cached context if available

/**
 * Context resolution options
 */
export interface ContextResolutionOptions {
  /** Resolution mode */
  mode?: ResolutionMode
  /** Include inactive resources */
  includeInactive?: boolean
  /** Include resource metadata */
  includeMetadata?: boolean
  /** Include editor context */
  includeEditor?: boolean
  /** Include dynamic context */
  includeDynamic?: boolean
  /** Max resource depth to resolve */
  maxResourceDepth?: number
  /** Custom filters for resources */
  resourceFilter?: (resource: ResourceReference) => boolean
}

/**
 * Resolved context for runtime
 */
export interface ResolvedPageContext {
  /** Resolved page context */
  pageContext: PageContext
  /** Resolution timestamp */
  resolvedAt: number
  /** Resolution duration in ms */
  resolutionTime: number
  /** Resources that failed to resolve */
  failedResources?: string[]
  /** Warnings during resolution */
  warnings?: string[]
  /** Whether context is complete */
  isComplete: boolean
}

// ==================== Factory Functions ====================

/**
 * Generate unique context ID
 */
export function generatePageContextId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = crypto.getRandomValues(new Uint8Array(4))
  const randomHex = Array.from(randomPart).map(b => b.toString(16).padStart(2, '0')).join('')
  return `page_${timestamp}_${randomHex}`
}

/**
 * Create a resource reference
 */
export function createResourceReference(
  id: string,
  type: ResourceType,
  options: Partial<ResourceReference> = {}
): ResourceReference {
  return {
    id,
    type,
    name: options.name ?? `${type}-${id}`,
    state: options.state ?? 'ready',
    parentId: options.parentId,
    version: options.version,
    lastModified: options.lastModified ?? Date.now(),
    modifiedBy: options.modifiedBy,
    metadata: options.metadata,
    permissions: options.permissions ?? [],
    isActive: options.isActive ?? false,
    editMode: options.editMode ?? 'view',
  }
}

/**
 * Create page location
 */
export function createPageLocation(
  route: string,
  mode: PageMode,
  options: Partial<PageLocation> = {}
): PageLocation {
  return {
    route,
    title: options.title,
    mode,
    query: options.query ?? {},
    params: options.params ?? {},
    breadcrumbs: options.breadcrumbs ?? [],
    openedAt: options.openedAt ?? Date.now(),
    navigationSource: options.navigationSource,
  }
}

/**
 * Create editor context
 */
export function createEditorContext(
  editorType: EditorContext['editorType'],
  options: Partial<EditorContext> = {}
): EditorContext {
  return {
    editorType,
    contentPath: options.contentPath,
    contentType: options.contentType,
    isDirty: options.isDirty ?? false,
    cursorPosition: options.cursorPosition,
    selection: options.selection,
    language: options.language,
    settings: options.settings,
    undoStackSize: options.undoStackSize ?? 0,
    redoStackSize: options.redoStackSize ?? 0,
  }
}

/**
 * Create dynamic context
 */
export function createDynamicContext(
  dynamicId: string,
  schemaVersion: string,
  options: Partial<DynamicContext> = {}
): DynamicContext {
  return {
    dynamicId,
    schemaVersion,
    dataBinding: options.dataBinding,
    validationState: options.validationState ?? { isValid: true, errors: [], warnings: [] },
    dirtyFields: options.dirtyFields ?? [],
    currentStep: options.currentStep,
    totalSteps: options.totalSteps,
    config: options.config,
  }
}

/**
 * Create page context
 */
export function createPageContext(
  location: PageLocation,
  _hostId: string,
  options: Partial<PageContext> = {}
): PageContext {
  const now = Date.now()
  return {
    contextId: generatePageContextId(),
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    expiresAt: options.expiresAt,
    location,
    resources: options.resources ?? [],
    primaryResource: options.primaryResource,
    secondaryResources: options.secondaryResources,
    editor: options.editor,
    dynamic: options.dynamic,
    metadata: options.metadata,
    features: options.features ?? [],
    source: options.source ?? 'host',
  }
}

/**
 * Create page context envelope
 */
export function createPageContextEnvelope(
  pageContext: PageContext,
  hostId: string,
  options: Partial<PageContextEnvelope> = {}
): PageContextEnvelope {
  return {
    page: pageContext,
    userContextId: options.userContextId,
    sessionId: options.sessionId,
    hostId,
    freshness: options.freshness ?? 'fresh',
    hasUnsavedChanges: options.hasUnsavedChanges ?? false,
    lastSyncedAt: options.lastSyncedAt ?? Date.now(),
  }
}

// ==================== Context Resolution Functions ====================

/**
 * Resolve page context based on mode
 */
export function resolvePageContext(
  pageContext: PageContext,
  options: ContextResolutionOptions = {}
): ResolvedPageContext {
  const startTime = Date.now()
  const warnings: string[] = []
  const failedResources: string[] = []
  
  // Filter resources if needed
  let resources = pageContext.resources
  if (options.resourceFilter) {
    resources = resources.filter(options.resourceFilter)
  }
  if (!options.includeInactive) {
    resources = resources.filter(r => r.isActive !== false)
  }
  
  // Check for failed resources
  for (const resource of resources) {
    if (resource.state === 'error') {
      failedResources.push(resource.id)
    }
  }
  
  // Resolve based on mode
  switch (options.mode ?? 'eager') {
    case 'eager':
      // All context loaded - nothing additional needed
      break
    case 'lazy':
      // Mark for lazy loading - would be handled by runtime
      warnings.push('Lazy resolution mode - resources will be loaded on demand')
      break
    case 'cached':
      // Use cached values
      if (!pageContext.updatedAt) {
        warnings.push('No cached data available')
      }
      break
  }
  
  const resolutionTime = Date.now() - startTime
  const isComplete = failedResources.length === 0 && warnings.length === 0
  
  return {
    pageContext: {
      ...pageContext,
      resources,
    },
    resolvedAt: Date.now(),
    resolutionTime,
    failedResources: failedResources.length > 0 ? failedResources : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    isComplete,
  }
}

/**
 * Resolve context for static mode
 */
export function resolveStaticContext(
  pageContext: PageContext
): ResolvedPageContext {
  // Static mode: minimal context, no editor/dynamic
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { editor, dynamic, ...rest } = pageContext
  return resolvePageContext(
    {
      ...rest,
      editor: undefined,
      dynamic: undefined,
    } as PageContext,
    {
      mode: 'cached',
      includeInactive: false,
      includeEditor: false,
      includeDynamic: false,
    }
  )
}

/**
 * Resolve context for dynamic mode
 */
export function resolveDynamicContext(
  pageContext: PageContext
): ResolvedPageContext {
  // Dynamic mode: include dynamic context
  return resolvePageContext(pageContext, {
    mode: 'eager',
    includeInactive: false,
    includeEditor: false,
    includeDynamic: true,
  })
}

/**
 * Resolve context for editor mode
 */
export function resolveEditorContext(
  pageContext: PageContext
): ResolvedPageContext {
  // Editor mode: include editor context, check for unsaved changes
  const hasUnsavedChanges = pageContext.editor?.isDirty ?? false
  
  const result = resolvePageContext(pageContext, {
    mode: 'eager',
    includeInactive: false,
    includeEditor: true,
    includeDynamic: false,
  })
  
  return {
    ...result,
    pageContext: {
      ...result.pageContext,
      metadata: {
        ...result.pageContext.metadata,
        hasUnsavedChanges,
      },
    },
  }
}

// ==================== Context Attachment Functions ====================

/**
 * Attach resource to context
 */
export function attachResource(
  pageContext: PageContext,
  resource: ResourceReference
): PageContext {
  const existingIndex = pageContext.resources.findIndex(r => r.id === resource.id)
  
  let resources: ResourceReference[]
  if (existingIndex >= 0) {
    // Update existing resource
    resources = [...pageContext.resources]
    resources[existingIndex] = resource
  } else {
    // Add new resource
    resources = [...pageContext.resources, resource]
  }
  
  return {
    ...pageContext,
    resources,
    updatedAt: Date.now(),
  }
}

/**
 * Attach multiple resources
 */
export function attachResources(
  pageContext: PageContext,
  resources: ResourceReference[]
): PageContext {
  let result = pageContext
  for (const resource of resources) {
    result = attachResource(result, resource)
  }
  return result
}

/**
 * Detach resource from context
 */
export function detachResource(
  pageContext: PageContext,
  resourceId: string
): PageContext {
  const resources = pageContext.resources.filter(r => r.id !== resourceId)
  
  return {
    ...pageContext,
    resources,
    primaryResource: pageContext.primaryResource?.id === resourceId 
      ? undefined 
      : pageContext.primaryResource,
    updatedAt: Date.now(),
  }
}

/**
 * Set primary resource
 */
export function setPrimaryResource(
  pageContext: PageContext,
  resourceId: string
): PageContext {
  const resource = pageContext.resources.find(r => r.id === resourceId)
  if (!resource) {
    return pageContext
  }
  
  return {
    ...pageContext,
    primaryResource: resource,
    resources: pageContext.resources.map(r => ({
      ...r,
      isActive: r.id === resourceId,
    })),
    updatedAt: Date.now(),
  }
}

// ==================== Context Exposure Functions ====================

/**
 * Safe context exposure for planner
 */
export function exposeToPlanner(
  pageContext: PageContext
): Pick<PageContext, 'location' | 'resources' | 'features' | 'contextId'> {
  return {
    contextId: pageContext.contextId,
    location: pageContext.location,
    resources: pageContext.resources.map(r => ({
      id: r.id,
      type: r.type,
      name: r.name,
      state: r.state,
      isActive: r.isActive,
      editMode: r.editMode,
    })) as ResourceReference[],
    features: pageContext.features,
  }
}

/**
 * Safe context exposure for tool runtime
 */
export function exposeToToolRuntime(
  pageContext: PageContext
): {
  contextId: string
  pageMode: PageMode
  route: string
  primaryResource: ResourceReference | undefined
  resources: ResourceReference[]
  hasEditorContext: boolean
  hasDynamicContext: boolean
} {
  return {
    contextId: pageContext.contextId,
    pageMode: pageContext.location.mode,
    route: pageContext.location.route,
    primaryResource: pageContext.primaryResource,
    resources: pageContext.resources.filter(r => r.isActive),
    hasEditorContext: pageContext.editor !== undefined,
    hasDynamicContext: pageContext.dynamic !== undefined,
  }
}

/**
 * Check if context is valid for tool execution
 */
export function isValidForToolExecution(
  pageContext: PageContext
): { valid: boolean; reason?: string } {
  // Check if context is expired
  if (pageContext.expiresAt && Date.now() > pageContext.expiresAt) {
    return { valid: false, reason: 'Context has expired' }
  }
  
  // Check if there are any resources in error state
  const errorResources = pageContext.resources.filter(r => r.state === 'error')
  if (errorResources.length > 0) {
    return { 
      valid: false, 
      reason: `Resources in error state: ${errorResources.map(r => r.id).join(', ')}` 
    }
  }
  
  // Check if primary resource is locked
  if (pageContext.primaryResource?.state === 'locked') {
    return { valid: false, reason: 'Primary resource is locked' }
  }
  
  return { valid: true }
}

// ==================== Validation Functions ====================

/**
 * Validate page context
 */
export function validatePageContext(
  pageContext: PageContext
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!pageContext.contextId) {
    errors.push('Missing contextId')
  }
  if (!pageContext.location) {
    errors.push('Missing location')
  }
  if (!pageContext.location?.route) {
    errors.push('Missing location.route')
  }
  if (!pageContext.location?.mode) {
    errors.push('Missing location.mode')
  }
  if (!pageContext.location?.openedAt) {
    errors.push('Missing location.openedAt')
  }
  
  // Validate resources
  if (pageContext.resources && Array.isArray(pageContext.resources)) {
    for (const resource of pageContext.resources) {
      if (!resource.id) {
        errors.push('Resource missing id')
      }
      if (!resource.type) {
        errors.push(`Resource ${resource.id} missing type`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if context is expired
 */
export function isPageContextExpired(pageContext: PageContext): boolean {
  if (!pageContext.expiresAt) {
    return false
  }
  return Date.now() > pageContext.expiresAt
}

/**
 * Check if context is stale
 */
export function isPageContextStale(
  pageContext: PageContext, 
  staleThresholdMs: number = 5 * 60 * 1000 // 5 minutes default
): boolean {
  const now = Date.now()
  const timeSinceUpdate = now - pageContext.updatedAt
  return timeSinceUpdate > staleThresholdMs
}

// ==================== Utility Functions ====================

/**
 * Get active resources
 */
export function getActiveResources(pageContext: PageContext): ResourceReference[] {
  return pageContext.resources.filter(r => r.isActive)
}

/**
 * Get resources by type
 */
export function getResourcesByType(
  pageContext: PageContext, 
  type: ResourceType
): ResourceReference[] {
  return pageContext.resources.filter(r => r.type === type)
}

/**
 * Get resources by state
 */
export function getResourcesByState(
  pageContext: PageContext, 
  state: ResourceState
): ResourceReference[] {
  return pageContext.resources.filter(r => r.state === state)
}

/**
 * Get dirty resources (with unsaved changes)
 */
export function getDirtyResources(pageContext: PageContext): ResourceReference[] {
  return pageContext.resources.filter(r => r.editMode === 'edit')
}

/**
 * Merge page contexts
 */
export function mergePageContexts(
  base: PageContext,
  overlay: Partial<PageContext>
): PageContext {
  return {
    ...base,
    ...overlay,
    resources: overlay.resources ?? base.resources,
    updatedAt: Date.now(),
  }
}

/**
 * Clone page context with new ID
 */
export function clonePageContext(
  pageContext: PageContext,
  options: Partial<PageContext> = {}
): PageContext {
  return {
    ...pageContext,
    contextId: generatePageContextId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...options,
  }
}

/**
 * Create minimal page context
 */
export function createMinimalPageContext(
  route: string,
  hostId: string,
  mode: PageMode = 'static'
): PageContext {
  const location = createPageLocation(route, mode)
  return createPageContext(location, hostId)
}
