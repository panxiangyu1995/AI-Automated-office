/**
 * Knowledge Retrieval Baseline
 * Task 79: Story 47.4 - Knowledge Retrieval Baseline
 *
 * This module connects the runtime to baseline knowledge retrieval
 * for scoped business context.
 */

// ==================== Types ====================

/**
 * Knowledge source type
 */
export type KnowledgeSourceType =
  | 'document'      // Uploaded documents
  | 'database'      // Database records
  | 'api'           // External API
  | 'vector_store'  // Vector database
  | 'rule_set'      // Business rules
  | 'template'      // Document templates
  | 'knowledge_graph' // Knowledge graph

/**
 * Knowledge scope
 */
export type KnowledgeScope =
  | 'tenant'        // Tenant-wide access
  | 'department'    // Department-specific
  | 'user'          // User-specific
  | 'session'       // Session-specific
  | 'global'        // System-wide

/**
 * Retrieval status
 */
export type RetrievalStatus =
  | 'pending'       // Request created, not executed
  | 'querying'      // Query in progress
  | 'success'       // Retrieval completed successfully
  | 'partial'       // Partial results (some sources failed)
  | 'failed'        // Retrieval failed
  | 'cancelled'     // Request cancelled

/**
 * Knowledge source reference
 */
export interface KnowledgeSourceRef {
  sourceId: string
  sourceType: KnowledgeSourceType
  name: string
  scope: KnowledgeScope
  tenantId?: string
  departmentId?: string
  enabled: boolean
  priority: number // Higher = more important
  metadata?: {
    description?: string
    lastUpdated?: number
    documentCount?: number
    vectorDimension?: number
  }
}

/**
 * Retrieval request
 */
export interface RetrievalRequest {
  requestId: string
  query: string
  scope: KnowledgeScope
  tenantId: string
  departmentId?: string
  userId?: string
  sessionId?: string
  sources: KnowledgeSourceRef[]
  options: RetrievalOptions
  createdAt: number
  status: RetrievalStatus
  context?: {
    pageContext?: string
    userIntent?: string
    previousQueries?: string[]
  }
}

/**
 * Retrieval options
 */
export interface RetrievalOptions {
  maxResults?: number
  minScore?: number      // Minimum relevance score (0-1)
  includeMetadata?: boolean
  timeout?: number       // milliseconds
  filters?: RetrievalFilter[]
  rankingStrategy?: 'relevance' | 'recency' | 'priority' | 'hybrid'
}

/**
 * Retrieval filter
 */
export interface RetrievalFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'
  value: string | number | string[] | number[]
}

/**
 * Retrieved item
 */
export interface RetrievedItem {
  itemId: string
  sourceId: string
  sourceType: KnowledgeSourceType
  content: string
  score: number          // Relevance score (0-1)
  metadata?: {
    title?: string
    url?: string
    createdAt?: number
    updatedAt?: number
    author?: string
    tags?: string[]
    custom?: Record<string, unknown>
  }
  highlights?: {
    field: string
    snippet: string
    positions?: Array<{ start: number; end: number }>
  }[]
}

/**
 * Retrieval result
 */
export interface RetrievalResult {
  requestId: string
  status: RetrievalStatus
  items: RetrievedItem[]
  totalCount: number
  retrievedCount: number
  queryTime: number      // milliseconds
  sourcesQueried: string[]
  sourcesFailed: string[]
  error?: {
    code: string
    message: string
    sourceId?: string
  }
  createdAt: number
  expiresAt?: number
}

/**
 * Retrieval audit entry
 */
export interface RetrievalAuditEntry {
  auditId: string
  requestId: string
  action: 'create' | 'execute' | 'complete' | 'fail' | 'cancel'
  timestamp: number
  actor?: {
    userId?: string
    sessionId?: string
  }
  details?: {
    query?: string
    scope?: KnowledgeScope
    sourceCount?: number
    resultCount?: number
    error?: string
  }
}

/**
 * Knowledge context injection
 */
export interface KnowledgeContextInjection {
  injectionId: string
  requestId: string
  injectedAt: number
  contextType: 'runtime' | 'planner' | 'tool'
  itemsInjected: string[]
  tokenCount?: number
}

// ==================== Constants ====================

const DEFAULT_MAX_RESULTS = 10
const DEFAULT_MIN_SCORE = 0.5
const DEFAULT_TIMEOUT = 30000

// ==================== Helper Functions ====================

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `req_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Generate a unique item ID
 */
export function generateItemId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `item_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Generate a unique audit ID
 */
export function generateAuditId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `audit_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Generate a unique injection ID
 */
export function generateInjectionId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `inj_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

// ==================== Knowledge Source Functions ====================

/**
 * Create a knowledge source reference
 */
export function createKnowledgeSource(
  sourceId: string,
  sourceType: KnowledgeSourceType,
  name: string,
  scope: KnowledgeScope,
  options: {
    tenantId?: string
    departmentId?: string
    enabled?: boolean
    priority?: number
    metadata?: KnowledgeSourceRef['metadata']
  } = {}
): KnowledgeSourceRef {
  return {
    sourceId,
    sourceType,
    name,
    scope,
    tenantId: options.tenantId,
    departmentId: options.departmentId,
    enabled: options.enabled ?? true,
    priority: options.priority ?? 0,
    metadata: options.metadata,
  }
}

/**
 * Filter sources by scope and tenant
 */
export function filterSourcesByScope(
  sources: KnowledgeSourceRef[],
  tenantId: string,
  departmentId?: string,
  _userId?: string
): KnowledgeSourceRef[] {
  return sources.filter(source => {
    if (!source.enabled) return false

    switch (source.scope) {
      case 'global':
        return true
      case 'tenant':
        return source.tenantId === tenantId || !source.tenantId
      case 'department':
        return (
          source.tenantId === tenantId &&
          (!source.departmentId || source.departmentId === departmentId)
        )
      case 'user':
        return source.tenantId === tenantId
      case 'session':
        return source.tenantId === tenantId
      default:
        return false
    }
  })
}

/**
 * Sort sources by priority
 */
export function sortSourcesByPriority(sources: KnowledgeSourceRef[]): KnowledgeSourceRef[] {
  return [...sources].sort((a, b) => b.priority - a.priority)
}

// ==================== Retrieval Request Functions ====================

/**
 * Create a retrieval request
 */
export function createRetrievalRequest(
  query: string,
  scope: KnowledgeScope,
  tenantId: string,
  sources: KnowledgeSourceRef[],
  options: {
    departmentId?: string
    userId?: string
    sessionId?: string
    retrievalOptions?: RetrievalOptions
    context?: RetrievalRequest['context']
  } = {}
): RetrievalRequest {
  return {
    requestId: generateRequestId(),
    query,
    scope,
    tenantId,
    departmentId: options.departmentId,
    userId: options.userId,
    sessionId: options.sessionId,
    sources: sortSourcesByPriority(sources),
    options: {
      maxResults: options.retrievalOptions?.maxResults ?? DEFAULT_MAX_RESULTS,
      minScore: options.retrievalOptions?.minScore ?? DEFAULT_MIN_SCORE,
      includeMetadata: options.retrievalOptions?.includeMetadata ?? true,
      timeout: options.retrievalOptions?.timeout ?? DEFAULT_TIMEOUT,
      filters: options.retrievalOptions?.filters,
      rankingStrategy: options.retrievalOptions?.rankingStrategy ?? 'relevance',
    },
    createdAt: Date.now(),
    status: 'pending',
    context: options.context,
  }
}

/**
 * Validate a retrieval request
 */
export function validateRetrievalRequest(request: RetrievalRequest): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!request.query || request.query.trim().length === 0) {
    errors.push('Query is required')
  }

  if (!request.tenantId) {
    errors.push('Tenant ID is required')
  }

  if (!request.sources || request.sources.length === 0) {
    errors.push('At least one knowledge source is required')
  }

  if (request.options.maxResults !== undefined && request.options.maxResults < 1) {
    errors.push('maxResults must be at least 1')
  }

  if (request.options.minScore !== undefined && (request.options.minScore < 0 || request.options.minScore > 1)) {
    errors.push('minScore must be between 0 and 1')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ==================== Retrieval Result Functions ====================

/**
 * Create a retrieved item
 */
export function createRetrievedItem(
  sourceId: string,
  sourceType: KnowledgeSourceType,
  content: string,
  score: number,
  metadata?: RetrievedItem['metadata']
): RetrievedItem {
  return {
    itemId: generateItemId(),
    sourceId,
    sourceType,
    content,
    score: Math.max(0, Math.min(1, score)),
    metadata,
  }
}

/**
 * Create a retrieval result
 */
export function createRetrievalResult(
  request: RetrievalRequest,
  items: RetrievedItem[],
  options: {
    queryTime?: number
    sourcesFailed?: string[]
    error?: RetrievalResult['error']
  } = {}
): RetrievalResult {
  const sourcesQueried = request.sources.map(s => s.sourceId)
  const sourcesFailed = options.sourcesFailed ?? []

  let status: RetrievalStatus = 'success'
  if (options.error) {
    status = 'failed'
  } else if (sourcesFailed.length > 0 && items.length === 0) {
    status = 'failed'
  } else if (sourcesFailed.length > 0) {
    status = 'partial'
  }

  return {
    requestId: request.requestId,
    status,
    items,
    totalCount: items.length,
    retrievedCount: items.length,
    queryTime: options.queryTime ?? 0,
    sourcesQueried,
    sourcesFailed,
    error: options.error,
    createdAt: Date.now(),
  }
}

/**
 * Filter items by minimum score
 */
export function filterByMinScore(items: RetrievedItem[], minScore: number): RetrievedItem[] {
  return items.filter(item => item.score >= minScore)
}

/**
 * Sort items by score
 */
export function sortByScore(items: RetrievedItem[], ascending: boolean = false): RetrievedItem[] {
  return [...items].sort((a, b) =>
    ascending ? a.score - b.score : b.score - a.score
  )
}

/**
 * Rank items using strategy
 */
export function rankItems(
  items: RetrievedItem[],
  strategy: RetrievalOptions['rankingStrategy']
): RetrievedItem[] {
  switch (strategy) {
    case 'relevance':
      return sortByScore(items)

    case 'recency':
      return [...items].sort((a, b) => {
        const aTime = a.metadata?.updatedAt ?? a.metadata?.createdAt ?? 0
        const bTime = b.metadata?.updatedAt ?? b.metadata?.createdAt ?? 0
        return bTime - aTime
      })

    case 'priority':
      // Priority would come from source, for now use score
      return sortByScore(items)

    case 'hybrid':
    default:
      // Hybrid: combine recency and relevance
      return [...items].sort((a, b) => {
        const aTime = a.metadata?.updatedAt ?? a.metadata?.createdAt ?? 0
        const bTime = b.metadata?.updatedAt ?? b.metadata?.createdAt ?? 0
        const recencyScore = (timestamp: number) =>
          Math.max(0, 1 - (Date.now() - timestamp) / (30 * 24 * 60 * 60 * 1000)) // Decay over 30 days
        const aCombined = a.score * 0.7 + recencyScore(aTime) * 0.3
        const bCombined = b.score * 0.7 + recencyScore(bTime) * 0.3
        return bCombined - aCombined
      })
  }
}

/**
 * Limit results count
 */
export function limitResults(items: RetrievedItem[], maxResults: number): RetrievedItem[] {
  return items.slice(0, maxResults)
}

// ==================== Audit Functions ====================

/**
 * Create an audit entry
 */
export function createAuditEntry(
  requestId: string,
  action: RetrievalAuditEntry['action'],
  options: {
    userId?: string
    sessionId?: string
    details?: RetrievalAuditEntry['details']
  } = {}
): RetrievalAuditEntry {
  return {
    auditId: generateAuditId(),
    requestId,
    action,
    timestamp: Date.now(),
    actor: {
      userId: options.userId,
      sessionId: options.sessionId,
    },
    details: options.details,
  }
}

// ==================== Context Injection Functions ====================

/**
 * Create a context injection record
 */
export function createContextInjection(
  requestId: string,
  contextType: KnowledgeContextInjection['contextType'],
  items: RetrievedItem[]
): KnowledgeContextInjection {
  return {
    injectionId: generateInjectionId(),
    requestId,
    injectedAt: Date.now(),
    contextType,
    itemsInjected: items.map(i => i.itemId),
    tokenCount: estimateTokenCount(items),
  }
}

/**
 * Estimate token count for items
 */
function estimateTokenCount(items: RetrievedItem[]): number {
  // Rough estimation: ~4 characters per token
  const totalChars = items.reduce((sum, item) => sum + item.content.length, 0)
  return Math.ceil(totalChars / 4)
}

/**
 * Format items for runtime context
 */
export function formatForRuntimeContext(items: RetrievedItem[]): string {
  if (items.length === 0) return ''

  const sections = items.map((item, index) => {
    const source = `[${item.sourceType}:${item.sourceId}]`
    const title = item.metadata?.title ? ` - ${item.metadata.title}` : ''
    return `### Result ${index + 1} ${source}${title}\n\n${item.content}`
  })

  return `## Knowledge Retrieval Results\n\n${sections.join('\n\n')}`
}

/**
 * Format items for planner context
 */
export function formatForPlannerContext(items: RetrievedItem[]): string {
  if (items.length === 0) return ''

  const summaries = items.map(item => {
    const title = item.metadata?.title ?? 'Untitled'
    const preview = item.content.slice(0, 200) + (item.content.length > 200 ? '...' : '')
    return `- ${title} (score: ${item.score.toFixed(2)})\n  ${preview}`
  })

  return `## Relevant Knowledge\n\n${summaries.join('\n\n')}`
}

/**
 * Format items for tool runtime
 */
export function formatForToolRuntime(items: RetrievedItem[], toolName?: string): string {
  if (items.length === 0) return ''

  const relevantItems = items.filter(item =>
    item.score >= DEFAULT_MIN_SCORE
  )

  if (relevantItems.length === 0) {
    return 'No relevant knowledge found for this operation.'
  }

  const details = relevantItems.map(item => {
    const source = `${item.sourceType}:${item.sourceId}`
    return `Source: ${source}\nRelevance: ${(item.score * 100).toFixed(0)}%\nContent: ${item.content}`
  })

  const header = toolName
    ? `## Knowledge Context for ${toolName}`
    : '## Knowledge Context'

  return `${header}\n\n${details.join('\n\n---\n\n')}`
}

// ==================== Query Functions ====================

/**
 * Get items by source
 */
export function getItemsBySource(
  items: RetrievedItem[],
  sourceId: string
): RetrievedItem[] {
  return items.filter(item => item.sourceId === sourceId)
}

/**
 * Get items by source type
 */
export function getItemsBySourceType(
  items: RetrievedItem[],
  sourceType: KnowledgeSourceType
): RetrievedItem[] {
  return items.filter(item => item.sourceType === sourceType)
}

/**
 * Get items above score threshold
 */
export function getItemsAboveScore(
  items: RetrievedItem[],
  threshold: number
): RetrievedItem[] {
  return items.filter(item => item.score >= threshold)
}

/**
 * Search items by content
 */
export function searchItemsByContent(
  items: RetrievedItem[],
  query: string
): RetrievedItem[] {
  const lowerQuery = query.toLowerCase()
  return items.filter(item =>
    item.content.toLowerCase().includes(lowerQuery) ||
    item.metadata?.title?.toLowerCase().includes(lowerQuery) ||
    item.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

// ==================== Serialization ====================

/**
 * Serialize retrieval request
 */
export function serializeRequest(request: RetrievalRequest): string {
  return JSON.stringify(request)
}

/**
 * Deserialize retrieval request
 */
export function deserializeRequest(data: string): RetrievalRequest {
  return JSON.parse(data) as RetrievalRequest
}

/**
 * Serialize retrieval result
 */
export function serializeResult(result: RetrievalResult): string {
  return JSON.stringify(result)
}

/**
 * Deserialize retrieval result
 */
export function deserializeResult(data: string): RetrievalResult {
  return JSON.parse(data) as RetrievalResult
}

/**
 * Validate retrieval result
 */
export function validateRetrievalResult(result: unknown): result is RetrievalResult {
  if (!result || typeof result !== 'object') return false

  const r = result as Partial<RetrievalResult>
  if (!r.requestId || !r.status || !Array.isArray(r.items)) return false

  const validStatuses: RetrievalStatus[] = ['pending', 'querying', 'success', 'partial', 'failed', 'cancelled']
  if (!validStatuses.includes(r.status as RetrievalStatus)) return false

  return true
}

// ==================== Mock Retrieval (for testing) ====================

/**
 * Mock retrieval for testing purposes
 */
export function mockRetrieve(
  request: RetrievalRequest
): RetrievalResult {
  const startTime = Date.now()

  // Generate mock items based on query
  const mockItems: RetrievedItem[] = request.sources
    .filter(s => s.enabled)
    .slice(0, request.options.maxResults ?? DEFAULT_MAX_RESULTS)
    .map((source, index) => createRetrievedItem(
      source.sourceId,
      source.sourceType,
      `Mock content for query "${request.query}" from source ${source.name}`,
      1 - (index * 0.1), // Decreasing scores
      {
        title: `Result ${index + 1} from ${source.name}`,
        createdAt: Date.now() - Math.random() * 1000000,
      }
    ))

  return createRetrievalResult(request, mockItems, {
    queryTime: Date.now() - startTime,
  })
}

// ==================== Tauri Backend Retrieval ====================

/**
 * Check if Tauri runtime is available
 */
function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Knowledge source info for Tauri backend
 */
interface TauriKnowledgeSourceInfo {
  source_id: string
  source_type: string
  name: string
  scope: string
  tenant_id?: string
  department_id?: string
  enabled?: boolean
  priority?: number
}

/**
 * Retrieval result from Tauri backend
 */
interface TauriRetrievalResult {
  request_id: string
  status: RetrievalStatus
  items: RetrievedItem[]
  total_count: number
  retrieved_count: number
  query_time_ms: number
  sources_queried: string[]
  sources_failed: string[]
  error?: {
    code: string
    message: string
    source_id?: string
  }
  created_at: number
  expires_at?: number
}

/**
 * Real retrieval using Tauri backend
 */
export async function retrieveKnowledge(
  request: RetrievalRequest,
  useCache: boolean = false
): Promise<RetrievalResult> {
  if (!isTauriAvailable()) {
    console.warn('[KnowledgeRetrieval] Tauri not available, using mock')
    return mockRetrieve(request)
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')

    const sources: TauriKnowledgeSourceInfo[] = request.sources.map(s => ({
      source_id: s.sourceId,
      source_type: s.sourceType,
      name: s.name,
      scope: s.scope,
      tenant_id: s.tenantId,
      department_id: s.departmentId,
      enabled: s.enabled,
      priority: s.priority,
    }))

    const backendRequest = {
      query: request.query,
      scope: request.scope,
      tenant_id: request.tenantId,
      department_id: request.departmentId,
      user_id: request.userId,
      session_id: request.sessionId,
      sources,
      max_results: request.options.maxResults,
      min_score: request.options.minScore,
      timeout_ms: request.options.timeout,
    }

    let result: TauriRetrievalResult

    if (useCache) {
      result = await invoke<TauriRetrievalResult>('retrieve_knowledge_cached', { request: backendRequest })
    } else {
      result = await invoke<TauriRetrievalResult>('retrieve_knowledge', { request: backendRequest })
    }

    // Convert backend result to frontend format
    return {
      requestId: result.request_id,
      status: result.status,
      items: result.items,
      totalCount: result.total_count,
      retrievedCount: result.retrieved_count,
      queryTime: result.query_time_ms,
      sourcesQueried: result.sources_queried,
      sourcesFailed: result.sources_failed,
      error: result.error,
      createdAt: result.created_at,
      expiresAt: result.expires_at,
    }
  } catch (error) {
    console.error('[KnowledgeRetrieval] Retrieval failed:', error)
    // Fallback to mock on error
    return mockRetrieve(request)
  }
}

/**
 * Format retrieval result for planner context using backend
 */
export async function formatKnowledgeForPlanner(result: RetrievalResult): Promise<string> {
  if (!isTauriAvailable()) {
    return formatForPlannerContext(result.items)
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')

    // Convert frontend result to backend format
    const backendResult: TauriRetrievalResult = {
      request_id: result.requestId,
      status: result.status,
      items: result.items,
      total_count: result.totalCount,
      retrieved_count: result.retrievedCount,
      query_time_ms: result.queryTime,
      sources_queried: result.sourcesQueried,
      sources_failed: result.sourcesFailed,
      error: result.error,
      created_at: result.createdAt,
      expires_at: result.expiresAt,
    }

    return await invoke<string>('format_knowledge_for_planner', { result: backendResult })
  } catch (error) {
    console.error('[KnowledgeRetrieval] Format for planner failed:', error)
    return formatForPlannerContext(result.items)
  }
}

/**
 * Format retrieval result for runtime context using backend
 */
export async function formatKnowledgeForRuntime(result: RetrievalResult): Promise<string> {
  if (!isTauriAvailable()) {
    return formatForRuntimeContext(result.items)
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')

    const backendResult: TauriRetrievalResult = {
      request_id: result.requestId,
      status: result.status,
      items: result.items,
      total_count: result.totalCount,
      retrieved_count: result.retrievedCount,
      query_time_ms: result.queryTime,
      sources_queried: result.sourcesQueried,
      sources_failed: result.sourcesFailed,
      error: result.error,
      created_at: result.createdAt,
      expires_at: result.expiresAt,
    }

    return await invoke<string>('format_knowledge_for_runtime', { result: backendResult })
  } catch (error) {
    console.error('[KnowledgeRetrieval] Format for runtime failed:', error)
    return formatForRuntimeContext(result.items)
  }
}

/**
 * Format retrieval result for tool context using backend
 */
export async function formatKnowledgeForTool(result: RetrievalResult, toolName?: string): Promise<string> {
  if (!isTauriAvailable()) {
    return formatForToolRuntime(result.items, toolName)
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')

    const backendResult: TauriRetrievalResult = {
      request_id: result.requestId,
      status: result.status,
      items: result.items,
      total_count: result.totalCount,
      retrieved_count: result.retrievedCount,
      query_time_ms: result.queryTime,
      sources_queried: result.sourcesQueried,
      sources_failed: result.sourcesFailed,
      error: result.error,
      created_at: result.createdAt,
      expires_at: result.expiresAt,
    }

    return await invoke<string>('format_knowledge_for_tool', { result: backendResult, toolName })
  } catch (error) {
    console.error('[KnowledgeRetrieval] Format for tool failed:', error)
    return formatForToolRuntime(result.items, toolName)
  }
}
