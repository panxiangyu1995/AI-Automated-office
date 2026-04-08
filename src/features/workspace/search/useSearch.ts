/**
 * useWorkspaceSearch Hook
 * 
 * Provides search functionality for the Quick Open dialog.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  SearchResult,
  SearchRequest,
  SearchableResourceType,
  SEARCH_DEBOUNCE_MS,
} from './types'
import { searchAggregator } from './aggregator'
import { useTrackAccess, useRecentItems } from './recentAccess'

/**
 * Search state
 */
interface SearchState {
  query: string
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  total: number
  duration: number
}

/**
 * useWorkspaceSearch options
 */
interface UseWorkspaceSearchOptions {
  workspaceId?: string
  types?: SearchableResourceType[]
  limit?: number
  debounceMs?: number
}

/**
 * External state integration options
 */
interface ExternalStateOptions {
  externalIsOpen?: boolean
  externalOpen?: () => void
  externalClose?: () => void
  onOpen?: () => void
  onClose?: () => void
}

/**
 * useWorkspaceSearch hook
 */
export function useWorkspaceSearch(options?: UseWorkspaceSearchOptions) {
  const {
    workspaceId,
    types,
    limit = 20,
    debounceMs = SEARCH_DEBOUNCE_MS,
  } = options ?? {}
  
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    total: 0,
    duration: 0,
  })
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const _trackAccess = useTrackAccess()

  // Set current workspace
  useEffect(() => {
    searchAggregator.setCurrentWorkspace(workspaceId ?? null)
  }, [workspaceId])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  /**
   * Execute search
   */
  const search = useCallback(async (query: string) => {
    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    if (!query.trim()) {
      // Get recent items when query is empty
      const response = await searchAggregator.getRecentResults(workspaceId, limit)
      setState({
        query: '',
        results: response.results,
        isLoading: false,
        error: null,
        total: response.total,
        duration: response.duration,
      })
      return
    }
    
    setState(s => ({ ...s, isLoading: true, error: null }))
    
    try {
      const request: SearchRequest = {
        query,
        types,
        workspaceId,
        limit,
      }
      
      const response = await searchAggregator.search(request)
      
      setState({
        query,
        results: response.results,
        isLoading: false,
        error: null,
        total: response.total,
        duration: response.duration,
      })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setState(s => ({
          ...s,
          isLoading: false,
          error: (error as Error).message,
        }))
      }
    }
  }, [workspaceId, types, limit])
  
  /**
   * Debounced search trigger
   */
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      search(query)
    }, debounceMs)
  }, [search, debounceMs])
  
  /**
   * Get recent items
   */
  const recentItems = useRecentItems(workspaceId, 10)
  
  return {
    // State
    ...state,
    recentItems,
    
    // Actions
    search: debouncedSearch,
    searchImmediate: search,
    
    // Metadata
    hasResults: state.results.length > 0,
    hasQuery: state.query.trim().length > 0,
  }
}

/**
 * useQuickOpen options
 */
interface UseQuickOpenOptions extends ExternalStateOptions {
  workspaceId?: string
  types?: SearchableResourceType[]
  limit?: number
}

/**
 * useQuickOpen hook - simplified version for Quick Open dialog
 * Integrates with external state (e.g., Zustand store)
 */
export function useQuickOpen(options?: UseQuickOpenOptions) {
  const {
    externalIsOpen,
    externalOpen,
    externalClose,
    workspaceId,
    types,
    limit = 20,
  } = options ?? {}
  
  const searchState = useWorkspaceSearch({ workspaceId, types, limit })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const trackAccess = useTrackAccess()
  
  // Determine if dialog is open
  const isOpen = externalIsOpen ?? false
  
  // Open/close functions - prefer external if provided
  const openSearch = useCallback(() => {
    searchState.search('')
    externalOpen?.()
  }, [searchState, externalOpen])
  
  const closeSearch = useCallback(() => {
    externalClose?.()
  }, [externalClose])
  
  // Update selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchState.results])
  
  // Navigate up
  const navigateUp = useCallback(() => {
    setSelectedIndex(i => Math.max(0, i - 1))
  }, [])
  
  // Navigate down
  const navigateDown = useCallback(() => {
    setSelectedIndex(i => Math.min(searchState.results.length - 1, i + 1))
  }, [searchState.results.length])
  
  // Select current
  const selectCurrent = useCallback(() => {
    const result = searchState.results[selectedIndex]
    if (result) {
      trackAccess(result)
      closeSearch()
      return result
    }
    return null
  }, [searchState.results, selectedIndex, trackAccess, closeSearch])
  
  // Select specific result
  const selectResult = useCallback((result: SearchResult) => {
    trackAccess(result)
    closeSearch()
    return result
  }, [trackAccess, closeSearch])
  
  return {
    ...searchState,
    selectedIndex,
    setSelectedIndex,
    navigateUp,
    navigateDown,
    selectCurrent,
    selectResult,
    currentResult: searchState.results[selectedIndex] ?? null,
    isOpen,
    openSearch,
    closeSearch,
  }
}
