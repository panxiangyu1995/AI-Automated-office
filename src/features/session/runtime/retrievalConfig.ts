/**
 * Advanced Retrieval Configuration
 * 
 * Extends the baseline retrieval with advanced RAG features:
 * - Hybrid search (semantic + BM25)
 * - Metadata filtering
 * - Retrieval configuration
 */

// ==================== Types ====================

/**
 * Search method
 */
export type SearchMethod = 'semantic' | 'full_text' | 'hybrid'

/**
 * Reranking mode
 */
export type RerankingMode = 'weighted_score' | 'reciprocal_rank_fusion' | 'rerank_model'

/**
 * Logical operator for combining filters
 */
export type LogicalOperator = 'and' | 'or'

/**
 * Filter condition operator
 */
export type FilterOperator = 
  | 'eq'       // Equal
  | 'ne'       // Not equal
  | 'gt'       // Greater than
  | 'gte'      // Greater than or equal
  | 'lt'       // Less than
  | 'lte'      // Less than or equal
  | 'contains' // Contains (string)
  | 'starts_with' // Starts with
  | 'ends_with'   // Ends with
  | 'in'       // In array
  | 'not_in'   // Not in array

/**
 * Filter value types
 */
export type FilterValue = string | number | boolean | string[] | number[]

/**
 * Single filter condition
 */
export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: FilterValue
}

/**
 * Metadata filter with logical operators
 */
export interface MetadataFilter {
  conditions: FilterCondition[]
  logical_operator: LogicalOperator
}

/**
 * Advanced retrieval configuration
 */
export interface RetrievalConfig {
  /** Search method to use */
  search_method: SearchMethod
  /** Number of results to return */
  top_k: number
  /** Minimum relevance score threshold (0.0 to 1.0) */
  score_threshold: number
  /** Vector search weight in hybrid mode (0.0 to 1.0) */
  vector_weight: number
  /** BM25 weight in hybrid mode (0.0 to 1.0) */
  bm25_weight: number
  /** RRF parameter for hybrid search (default: 60) */
  rrf_k: number
  /** Diversity penalty for reranking (0.0 to 1.0) */
  diversity: number
  /** Metadata filter for filtering results */
  filter?: MetadataFilter
  /** Reranking enabled */
  rerank_enabled: boolean
  /** Reranking model (optional) */
  rerank_model?: string
  /** Reranking mode */
  reranking_mode: RerankingMode
}

/**
 * Cache statistics
 */
export interface CacheStats {
  total_entries: number
  hits: number
  misses: number
  hit_rate: number
}

/**
 * BM25 statistics
 */
export interface Bm25Stats {
  document_count: number
  total_terms: number
  unique_terms: number
  avg_doc_length: number
}

// ==================== Constants ====================

export const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
  search_method: 'hybrid',
  top_k: 10,
  score_threshold: 0.0,
  vector_weight: 0.7,
  bm25_weight: 0.3,
  rrf_k: 60,
  diversity: 0.0,
  filter: undefined,
  rerank_enabled: false,
  rerank_model: undefined,
  reranking_mode: 'weighted_score',
}

// ==================== Builder Functions ====================

/**
 * Create a filter condition
 */
export function createFilterCondition(
  field: string,
  operator: FilterOperator,
  value: FilterValue
): FilterCondition {
  return { field, operator, value }
}

/**
 * Create a metadata filter with conditions
 */
export function createMetadataFilter(
  conditions: FilterCondition[],
  logicalOperator: LogicalOperator = 'and'
): MetadataFilter {
  return { conditions, logical_operator: logicalOperator }
}

/**
 * Create a retrieval config with defaults
 */
export function createRetrievalConfig(
  partial?: Partial<RetrievalConfig>
): RetrievalConfig {
  return {
    ...DEFAULT_RETRIEVAL_CONFIG,
    ...partial,
  }
}

/**
 * Create a semantic search config
 */
export function createSemanticSearchConfig(
  topK: number = 10,
  scoreThreshold: number = 0.5
): RetrievalConfig {
  return createRetrievalConfig({
    search_method: 'semantic',
    top_k: topK,
    score_threshold: scoreThreshold,
  })
}

/**
 * Create a full-text search config
 */
export function createFullTextSearchConfig(
  topK: number = 10,
  scoreThreshold: number = 0.5
): RetrievalConfig {
  return createRetrievalConfig({
    search_method: 'full_text',
    top_k: topK,
    score_threshold: scoreThreshold,
  })
}

/**
 * Create a hybrid search config
 */
export function createHybridSearchConfig(
  options?: {
    topK?: number
    vectorWeight?: number
    bm25Weight?: number
    scoreThreshold?: number
    filter?: MetadataFilter
  }
): RetrievalConfig {
  return createRetrievalConfig({
    search_method: 'hybrid',
    top_k: options?.topK ?? 10,
    vector_weight: options?.vectorWeight ?? 0.7,
    bm25_weight: options?.bm25Weight ?? 0.3,
    score_threshold: options?.scoreThreshold ?? 0.0,
    filter: options?.filter,
  })
}

// ==================== Filter Helpers ====================

/**
 * Create an equality filter
 */
export function eqFilter(field: string, value: string | number | boolean): FilterCondition {
  return createFilterCondition(field, 'eq', value)
}

/**
 * Create a not-equal filter
 */
export function neFilter(field: string, value: string | number | boolean): FilterCondition {
  return createFilterCondition(field, 'ne', value)
}

/**
 * Create a greater-than filter
 */
export function gtFilter(field: string, value: number): FilterCondition {
  return createFilterCondition(field, 'gt', value)
}

/**
 * Create a less-than filter
 */
export function ltFilter(field: string, value: number): FilterCondition {
  return createFilterCondition(field, 'lt', value)
}

/**
 * Create a contains filter
 */
export function containsFilter(field: string, value: string): FilterCondition {
  return createFilterCondition(field, 'contains', value)
}

/**
 * Create an IN filter
 */
export function inFilter(field: string, values: string[] | number[]): FilterCondition {
  return createFilterCondition(field, 'in', values)
}

/**
 * Create a NOT IN filter
 */
export function notInFilter(field: string, values: string[] | number[]): FilterCondition {
  return createFilterCondition(field, 'not_in', values)
}

/**
 * Create filter for department
 */
export function departmentFilter(departmentId: string): MetadataFilter {
  return createMetadataFilter([eqFilter('department_id', departmentId)])
}

/**
 * Create filter for document type
 */
export function documentTypeFilter(type: string): MetadataFilter {
  return createMetadataFilter([eqFilter('document_type', type)])
}

/**
 * Create filter for tags
 */
export function tagsFilter(tags: string[]): MetadataFilter {
  return createMetadataFilter([inFilter('tags', tags)])
}

/**
 * Create filter for date range
 */
export function dateRangeFilter(
  field: string,
  startDate: number,
  endDate: number
): MetadataFilter {
  return createMetadataFilter([
    gteFilter(field, startDate),
    lteFilter(field, endDate),
  ])
}

/**
 * Create greater-than-or-equal filter
 */
export function gteFilter(field: string, value: number): FilterCondition {
  return createFilterCondition(field, 'gte', value)
}

/**
 * Create less-than-or-equal filter
 */
export function lteFilter(field: string, value: number): FilterCondition {
  return createFilterCondition(field, 'lte', value)
}

// ==================== Validation ====================

/**
 * Validate retrieval config
 */
export function validateRetrievalConfig(config: RetrievalConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.vector_weight < 0 || config.vector_weight > 1) {
    errors.push('vector_weight must be between 0 and 1')
  }

  if (config.bm25_weight < 0 || config.bm25_weight > 1) {
    errors.push('bm25_weight must be between 0 and 1')
  }

  if (config.score_threshold < 0 || config.score_threshold > 1) {
    errors.push('score_threshold must be between 0 and 1')
  }

  if (config.diversity < 0 || config.diversity > 1) {
    errors.push('diversity must be between 0 and 1')
  }

  if (config.rrf_k === 0) {
    errors.push('rrf_k must be greater than 0')
  }

  if (config.top_k === 0) {
    errors.push('top_k must be greater than 0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ==================== Serialization ====================

/**
 * Serialize filter to JSON
 */
export function serializeFilter(filter: MetadataFilter): string {
  return JSON.stringify(filter)
}

/**
 * Deserialize filter from JSON
 */
export function deserializeFilter(json: string): MetadataFilter {
  return JSON.parse(json) as MetadataFilter
}

/**
 * Serialize config to JSON
 */
export function serializeConfig(config: RetrievalConfig): string {
  return JSON.stringify(config)
}

/**
 * Deserialize config from JSON
 */
export function deserializeConfig(json: string): RetrievalConfig {
  return JSON.parse(json) as RetrievalConfig
}

// ==================== Tauri Integration ====================

/**
 * Check if Tauri is available
 */
function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Invoke Tauri command with error handling
 */
async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriAvailable()) {
    throw new Error('Tauri runtime not available')
  }

  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(cmd, args)
}

/**
 * Get cache statistics from backend
 */
export async function getCacheStats(): Promise<CacheStats | null> {
  try {
    return await tauriInvoke<CacheStats>('get_embedding_cache_stats')
  } catch (error) {
    console.warn('[RetrievalConfig] Failed to get cache stats:', error)
    return null
  }
}

/**
 * Clear embedding cache
 */
export async function clearEmbeddingCache(): Promise<boolean> {
  try {
    await tauriInvoke('clear_embedding_cache')
    return true
  } catch (error) {
    console.warn('[RetrievalConfig] Failed to clear cache:', error)
    return false
  }
}

/**
 * Get BM25 statistics from backend
 */
export async function getBm25Stats(): Promise<Bm25Stats | null> {
  try {
    return await tauriInvoke<Bm25Stats>('get_bm25_stats')
  } catch (error) {
    console.warn('[RetrievalConfig] Failed to get BM25 stats:', error)
    return null
  }
}

/**
 * Search with advanced config
 */
export async function advancedSearch(
  query: string,
  tenantId: string,
  config: RetrievalConfig
): Promise<unknown> {
  try {
    return await tauriInvoke('knowledge_search_advanced', {
      query,
      tenantId,
      config,
    })
  } catch (error) {
    console.error('[RetrievalConfig] Advanced search failed:', error)
    throw error
  }
}

/**
 * Format retrieval config for display
 */
export function formatConfigForDisplay(config: RetrievalConfig): string {
  const parts: string[] = []

  parts.push(`Method: ${config.search_method}`)
  parts.push(`Top-K: ${config.top_k}`)

  if (config.search_method === 'hybrid') {
    parts.push(`Weights: vector=${config.vector_weight}, BM25=${config.bm25_weight}`)
  }

  if (config.score_threshold > 0) {
    parts.push(`Threshold: ${config.score_threshold}`)
  }

  if (config.rerank_enabled) {
    parts.push(`Rerank: ${config.reranking_mode}`)
  }

  if (config.filter && config.filter.conditions.length > 0) {
    parts.push(`Filters: ${config.filter.conditions.length}`)
  }

  return parts.join(' | ')
}
