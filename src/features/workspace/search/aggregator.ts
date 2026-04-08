/**
 * Search Aggregator
 * 
 * Coordinates search across all providers, merges results,
 * and applies ranking/sorting logic.
 */

import {
  SearchResult,
  SearchRequest,
  SearchResponse,
  SearchProvider,
  RankingWeights,
  DEFAULT_RANKING_WEIGHTS,
  MAX_RESULTS_PER_PROVIDER,
  SearchableResourceType,
} from './types'
import { allProviders } from './providers'

/**
 * Search Aggregator
 * 
 * Manages all search providers and provides unified search interface
 */
export class SearchAggregator {
  private providers: Map<SearchableResourceType, SearchProvider> = new Map()
  private currentWorkspaceId: string | null = null
  private weights: RankingWeights
  
  constructor(
    providers: SearchProvider[] = allProviders,
    weights: RankingWeights = DEFAULT_RANKING_WEIGHTS
  ) {
    // Register all providers
    for (const provider of providers) {
      this.providers.set(provider.type, provider)
    }
    this.weights = weights
  }
  
  /**
   * Set the current workspace context
   */
  setCurrentWorkspace(workspaceId: string | null): void {
    this.currentWorkspaceId = workspaceId
  }
  
  /**
   * Get the current workspace ID
   */
  getCurrentWorkspace(): string | null {
    return this.currentWorkspaceId
  }
  
  /**
   * Update ranking weights
   */
  setWeights(weights: Partial<RankingWeights>): void {
    this.weights = { ...this.weights, ...weights }
  }
  
  /**
   * Search across all registered providers
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = performance.now()
    const {
      query,
      types,
      workspaceId,
      limit = 20,
    } = request
    
    const effectiveWorkspaceId = workspaceId ?? this.currentWorkspaceId
    
    // If no query, return recent items
    if (!query.trim()) {
      return this.getRecentResults(effectiveWorkspaceId, limit)
    }
    
    // Filter providers by requested types
    const targetProviders = types
      ? Array.from(this.providers.values()).filter(p => types.includes(p.type))
      : Array.from(this.providers.values())
    
    // Execute search in parallel
    const searchPromises = targetProviders.map(provider =>
      provider.search(query, {
        workspaceId: effectiveWorkspaceId ?? undefined,
        limit: MAX_RESULTS_PER_PROVIDER,
      }).catch(error => {
        console.error(`Search failed for ${provider.type}:`, error)
        return []
      })
    )
    
    const resultsArrays = await Promise.all(searchPromises)
    
    // Flatten and deduplicate results
    const allResults = this.deduplicateResults(resultsArrays.flat())
    
    // Apply ranking
    const rankedResults = this.rankResults(allResults, query, effectiveWorkspaceId)
    
    // Apply limit
    const finalResults = rankedResults.slice(0, limit)
    
    const duration = performance.now() - startTime
    
    return {
      results: finalResults,
      total: allResults.length,
      query,
      duration,
    }
  }
  
  /**
   * Get recent items from all providers
   */
  async getRecentResults(workspaceId?: string | null, limit = 20): Promise<SearchResponse> {
    const startTime = performance.now()
    const effectiveWorkspaceId = workspaceId ?? this.currentWorkspaceId
    
    const recentPromises = Array.from(this.providers.values()).map(provider => {
      if (provider.getRecent) {
        return provider.getRecent(MAX_RESULTS_PER_PROVIDER)
          .catch(() => [])
      }
      return Promise.resolve([])
    })
    
    const resultsArrays = await Promise.all(recentPromises)
    let allResults = resultsArrays.flat()
    
    // Filter by workspace if specified
    if (effectiveWorkspaceId) {
      allResults = allResults.filter(r => r.workspaceId === effectiveWorkspaceId)
    }
    
    // Sort by last accessed
    allResults.sort((a, b) => {
      const aTime = a.lastAccessedAt?.getTime() ?? 0
      const bTime = b.lastAccessedAt?.getTime() ?? 0
      return bTime - aTime
    })
    
    const duration = performance.now() - startTime
    
    return {
      results: allResults.slice(0, limit),
      total: allResults.length,
      query: '',
      duration,
    }
  }
  
  /**
   * Register a new search provider
   */
  registerProvider(provider: SearchProvider): void {
    this.providers.set(provider.type, provider)
  }
  
  /**
   * Unregister a search provider
   */
  unregisterProvider(type: SearchableResourceType): void {
    this.providers.delete(type)
  }
  
  /**
   * Get a specific provider
   */
  getProvider(type: SearchableResourceType): SearchProvider | undefined {
    return this.providers.get(type)
  }
  
  /**
   * Deduplicate results by ID
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Map<string, SearchResult>()
    
    for (const result of results) {
      if (!seen.has(result.id)) {
        seen.set(result.id, result)
      }
    }
    
    return Array.from(seen.values())
  }
  
  /**
   * Rank results based on multiple factors
   */
  private rankResults(
    results: SearchResult[],
    query: string,
    workspaceId: string | null
  ): SearchResult[] {
    const lowerQuery = query.toLowerCase()
    
    return results.map(result => {
      let score = result.score
      
      // 1. Current workspace bonus
      if (workspaceId && result.workspaceId === workspaceId) {
        score += this.weights.currentWorkspace
      }
      
      // 2. Recent access bonus
      if (result.lastAccessedAt) {
        const daysSinceAccess = (Date.now() - result.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceAccess < 7) {
          score += this.weights.recentAccess * (1 - daysSinceAccess / 7)
        }
      }
      
      // 3. Type weight
      score += this.weights.typeWeight[result.type] ?? 0
      
      // 4. Exact name match bonus
      if (result.title.toLowerCase().startsWith(lowerQuery)) {
        score += this.weights.nameMatch
      }
      
      return { ...result, score }
    }).sort((a, b) => b.score - a.score)
  }
}

// Singleton instance
export const searchAggregator = new SearchAggregator()
