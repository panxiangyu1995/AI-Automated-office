/**
 * Search Types and Interfaces
 * 
 * Defines the core types for the workspace search system.
 */

import { ComponentType } from 'react'

/**
 * Resource types that can be searched
 */
export type SearchableResourceType = 
  | 'project' 
  | 'document' 
  | 'template' 
  | 'knowledge' 
  | 'user'

/**
 * Core search result interface
 */
export interface SearchResult {
  id: string
  type: SearchableResourceType
  title: string
  subtitle: string
  workspaceId?: string
  workspaceName?: string
  lastAccessedAt?: Date
  score: number
  icon?: ComponentType<{ className?: string }>
  metadata?: Record<string, unknown>
}

/**
 * Search request parameters
 */
export interface SearchRequest {
  query: string
  types?: SearchableResourceType[]
  workspaceId?: string
  limit?: number
  offset?: number
}

/**
 * Search response with results and metadata
 */
export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  duration: number
}

/**
 * Search provider interface
 * Each resource type implements this interface
 */
export interface SearchProvider {
  /** Provider identifier */
  readonly type: SearchableResourceType
  /** Display name for this resource type */
  readonly displayName: string
  
  /**
   * Execute search for this resource type
   * @param query Search query string
   * @param options Additional search options
   * @returns Promise resolving to search results
   */
  search(query: string, options?: SearchProviderOptions): Promise<SearchResult[]>
  
  /**
   * Check if this provider supports the given resource type
   */
  supports(type: SearchableResourceType): boolean
  
  /**
   * Get recent items for this resource type
   */
  getRecent?(limit?: number): Promise<SearchResult[]>
}

/**
 * Options for search provider
 */
export interface SearchProviderOptions {
  workspaceId?: string
  limit?: number
  includeArchived?: boolean
}

/**
 * Search ranking weights configuration
 */
export interface RankingWeights {
  currentWorkspace: number
  recentAccess: number
  typeWeight: Record<SearchableResourceType, number>
  nameMatch: number
  fuzzyMatch: number
}

/**
 * Default ranking weights
 */
export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  currentWorkspace: 100,
  recentAccess: 50,
  typeWeight: {
    project: 40,
    document: 30,
    template: 20,
    knowledge: 15,
    user: 25,
  },
  nameMatch: 30,
  fuzzyMatch: 10,
}

/**
 * Search debounce configuration
 */
export const SEARCH_DEBOUNCE_MS = 300

/**
 * Maximum results per provider
 */
export const MAX_RESULTS_PER_PROVIDER = 10

/**
 * Maximum recent items to track
 */
export const MAX_RECENT_ITEMS = 20
