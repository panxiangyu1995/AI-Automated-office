/**
 * Streaming Render Hook - Optimized Message Streaming Display
 * Task 62: Story 43.4 - Streaming Output and Status Sync
 * 
 * This module provides optimized React hooks for streaming message rendering.
 * Features:
 * - Debounced updates to reduce re-renders
 * - Incremental text accumulation
 * - Virtualized list support for long conversations
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PartDeltaEvent, MessageEndEvent } from './runtimeEvents'

// ==================== Types ====================

/**
 * Streaming message state
 */
export interface StreamingState {
  messageId: string
  parts: Map<string, StreamingPart>
  isComplete: boolean
  totalTokens: number
  lastUpdate: number
}

/**
 * Streaming part state
 */
export interface StreamingPart {
  id: string
  content: string
  tokens: number
  isComplete: boolean
}

/**
 * Streaming render options
 */
export interface UseStreamingOptions {
  /** Debounce delay in ms (default: 16ms for 60fps) */
  debounceMs?: number
  /** Maximum parts to keep in memory */
  maxParts?: number
  /** Callback when streaming completes */
  onComplete?: (messageId: string, content: string) => void
  /** Callback on error */
  onError?: (error: string) => void
}

// ==================== Helper Functions ====================

/**
 * Calculate estimated tokens (simple heuristic)
 */
function estimateTokens(text: string): number {
  if (!text) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const chineseTokens = chineseChars / 1.5
  const otherTokens = (text.length - chineseChars) / 4
  return Math.ceil(chineseTokens + otherTokens)
}

/**
 * Accumulate text content from stream chunks
 */
function accumulateContent(chunks: PartDeltaEvent[]): string {
  return chunks.map(c => c.delta).join('')
}

// ==================== Hooks ====================

/**
 * Hook for streaming message content
 */
export function useStreamingMessage(
  messageId: string,
  options: UseStreamingOptions = {}
) {
  const {
    debounceMs = 16,
    maxParts = 100,
    onComplete,
  } = options

  // State
  const [state, setState] = useState<StreamingState>({
    messageId,
    parts: new Map(),
    isComplete: false,
    totalTokens: 0,
    lastUpdate: Date.now(),
  })

  // Refs for tracking
  const chunksRef = useRef<Map<string, PartDeltaEvent[]>>(new Map())
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accumulatedContentRef = useRef<string>('')

  // Update state with debouncing
  const updateState = useCallback((updater: (prev: StreamingState) => StreamingState) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      setState(updater)
    }, debounceMs)
  }, [debounceMs])

  // Handle part delta event
  const handlePartDelta = useCallback((event: PartDeltaEvent) => {
    if (event.messageId !== messageId) return

    // Accumulate chunks
    const existing = chunksRef.current.get(event.partId) || []
    chunksRef.current.set(event.partId, [...existing, event])
    
    // Calculate accumulated content
    const allChunks = Array.from(chunksRef.current.values()).flat()
    accumulatedContentRef.current = accumulateContent(allChunks)
    
    // Update state
    updateState(prev => {
      const newParts = new Map(prev.parts)
      newParts.set(event.partId, {
        id: event.partId,
        content: accumulatedContentRef.current,
        tokens: estimateTokens(accumulatedContentRef.current),
        isComplete: false,
      })
      
      // Trim parts if exceeding max
      if (newParts.size > maxParts) {
        const keys = Array.from(newParts.keys())
        const toRemove = keys.slice(0, newParts.size - maxParts)
        toRemove.forEach(k => newParts.delete(k))
      }
      
      return {
        ...prev,
        parts: newParts,
        totalTokens: estimateTokens(accumulatedContentRef.current),
        lastUpdate: Date.now(),
      }
    })
  }, [messageId, maxParts, updateState])

  // Handle part end event
  const handlePartEnd = useCallback((partId: string) => {
    updateState(prev => {
      const newParts = new Map(prev.parts)
      const part = newParts.get(partId)
      if (part) {
        newParts.set(partId, { ...part, isComplete: true })
      }
      return { ...prev, parts: newParts }
    })
  }, [updateState])

  // Handle message end event
  const handleMessageEnd = useCallback((event: MessageEndEvent) => {
    if (event.messageId !== messageId) return

    // Mark all parts complete
    updateState(prev => {
      const newParts = new Map(prev.parts)
      newParts.forEach((part, id) => {
        newParts.set(id, { ...part, isComplete: true })
      })
      
      const finalContent = Array.from(newParts.values())
        .map(p => p.content)
        .join('')
      
      // Cleanup
      chunksRef.current.clear()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      onComplete?.(messageId, finalContent)
      
      return {
        ...prev,
        parts: newParts,
        isComplete: true,
        lastUpdate: Date.now(),
      }
    })
  }, [messageId, onComplete, updateState])

  // Cleanup on unmount
  useEffect(() => {
    const chunks = chunksRef.current
    const timer = debounceTimerRef.current
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
      chunks.clear()
    }
  }, [])

  return {
    state,
    handlePartDelta,
    handlePartEnd,
    handleMessageEnd,
    getContent: () => Array.from(state.parts.values()).map(p => p.content).join(''),
    getProgress: () => state.isComplete ? 100 : Math.min(95, state.totalTokens / 10),
  }
}

// ==================== Streaming Manager ====================

/**
 * Streaming manager data
 */
interface StreamingManagerData {
  state: StreamingState
  chunksRef: Map<string, PartDeltaEvent[]>
  accumulatedContentRef: string
  options: UseStreamingOptions
}

/**
 * Hook for managing multiple streaming messages
 */
export function useStreamingManager() {
  const [activeStreams, setActiveStreams] = useState<Map<string, StreamingState>>(new Map())
  const streamsDataRef = useRef<Map<string, StreamingManagerData>>(new Map())
  const updateTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Update stream state with debouncing
  const updateStreamState = useCallback((
    messageId: string,
    updater: (prev: StreamingState) => StreamingState
  ) => {
    // Clear existing timer
    const existingTimer = updateTimerRef.current.get(messageId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    // Set new timer
    updateTimerRef.current.set(messageId, setTimeout(() => {
      setActiveStreams(prev => {
        const next = new Map(prev)
        const data = streamsDataRef.current.get(messageId)
        if (data) {
          const newParts = updater({ ...data.state, parts: new Map(data.state.parts) })
          next.set(messageId, newParts)
          data.state = newParts
        }
        return next
      })
      updateTimerRef.current.delete(messageId)
    }, 16))
  }, [])

  // Start tracking a new message
  const startStream = useCallback((
    messageId: string,
    options?: UseStreamingOptions
  ) => {
    const initialState: StreamingState = {
      messageId,
      parts: new Map(),
      isComplete: false,
      totalTokens: 0,
      lastUpdate: Date.now(),
    }
    
    const data: StreamingManagerData = {
      state: initialState,
      chunksRef: new Map(),
      accumulatedContentRef: '',
      options: options || {},
    }
    
    streamsDataRef.current.set(messageId, data)
    
    setActiveStreams(prev => {
      const next = new Map(prev)
      next.set(messageId, initialState)
      return next
    })
    
    return messageId
  }, [])

  // Handle part delta
  const handlePartDelta = useCallback((event: PartDeltaEvent) => {
    const data = streamsDataRef.current.get(event.messageId)
    if (!data) return
    
    // Accumulate chunks
    const existing = data.chunksRef.get(event.partId) || []
    data.chunksRef.set(event.partId, [...existing, event])
    
    // Calculate accumulated content
    const allChunks = Array.from(data.chunksRef.values()).flat()
    data.accumulatedContentRef = accumulateContent(allChunks)
    
    const maxParts = data.options.maxParts || 100
    
    updateStreamState(event.messageId, prev => {
      const newParts = new Map(prev.parts)
      newParts.set(event.partId, {
        id: event.partId,
        content: data.accumulatedContentRef,
        tokens: estimateTokens(data.accumulatedContentRef),
        isComplete: false,
      })
      
      if (newParts.size > maxParts) {
        const keys = Array.from(newParts.keys())
        const toRemove = keys.slice(0, newParts.size - maxParts)
        toRemove.forEach(k => newParts.delete(k))
      }
      
      return {
        ...prev,
        parts: newParts,
        totalTokens: estimateTokens(data.accumulatedContentRef),
        lastUpdate: Date.now(),
      }
    })
  }, [updateStreamState])

  // Handle part end
  const handlePartEnd = useCallback((messageId: string, partId: string) => {
    const data = streamsDataRef.current.get(messageId)
    if (!data) return
    
    updateStreamState(messageId, prev => {
      const newParts = new Map(prev.parts)
      const part = newParts.get(partId)
      if (part) {
        newParts.set(partId, { ...part, isComplete: true })
      }
      return { ...prev, parts: newParts }
    })
  }, [updateStreamState])

  // Handle message end
  const handleMessageEnd = useCallback((event: MessageEndEvent) => {
    const data = streamsDataRef.current.get(event.messageId)
    if (!data) return
    
    updateStreamState(event.messageId, prev => {
      const newParts = new Map(prev.parts)
      newParts.forEach((part, id) => {
        newParts.set(id, { ...part, isComplete: true })
      })
      
      const finalContent = Array.from(newParts.values())
        .map(p => p.content)
        .join('')
      
      data.chunksRef.clear()
      data.options.onComplete?.(event.messageId, finalContent)
      
      return {
        ...prev,
        parts: newParts,
        isComplete: true,
        lastUpdate: Date.now(),
      }
    })
  }, [updateStreamState])

  // Stop tracking a message
  const stopStream = useCallback((messageId: string) => {
    // Clear timer
    const timer = updateTimerRef.current.get(messageId)
    if (timer) {
      clearTimeout(timer)
      updateTimerRef.current.delete(messageId)
    }
    
    // Remove data
    streamsDataRef.current.delete(messageId)
    
    // Update state
    setActiveStreams(prev => {
      const next = new Map(prev)
      next.delete(messageId)
      return next
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    const timers = updateTimerRef.current
    const streams = streamsDataRef.current
    return () => {
      timers.forEach(timer => clearTimeout(timer))
      timers.clear()
      streams.clear()
    }
  }, [])

  return {
    activeStreams,
    startStream,
    stopStream,
    handlePartDelta,
    handlePartEnd,
    handleMessageEnd,
    getContent: (messageId: string) => {
      const data = streamsDataRef.current.get(messageId)
      return data?.accumulatedContentRef || ''
    },
    getActiveIds: () => Array.from(streamsDataRef.current.keys()),
  }
}

// ==================== Hooks ====================

/**
 * Hook for rendering streaming text with animation
 */
export function useStreamingText(initialText: string = '') {
  const [displayText, setDisplayText] = useState(initialText)
  const targetTextRef = useRef(initialText)
  const animationFrameRef = useRef<number | null>(null)

  // Update target text
  const setTargetText = useCallback((text: string) => {
    targetTextRef.current = text
  }, [])

  // Start animation loop
  useEffect(() => {
    let lastTime = performance.now()
    const charsPerSecond = 100

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      setDisplayText(prev => {
        const target = targetTextRef.current
        if (prev.length < target.length) {
          const charsToAdd = Math.max(1, Math.floor(deltaTime * charsPerSecond))
          const newLength = Math.min(target.length, prev.length + charsToAdd)
          return target.slice(0, newLength)
        }
        return prev
      })

      if (displayText.length < targetTextRef.current.length) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [displayText.length])

  return { 
    displayText, 
    setTargetText, 
    isComplete: displayText.length >= targetTextRef.current.length 
  }
}

// ==================== Helpers ====================

/**
 * Get visible range for virtualization
 */
export function getVisibleRange(
  scrollTop: number,
  itemHeight: number,
  visibleCount: number,
  totalCount: number
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2)
  const end = Math.min(totalCount, start + visibleCount + 4)
  return { start, end }
}

/**
 * Create streaming content state
 */
export function createStreamingContentState(
  content: string,
  isStreaming: boolean,
  className?: string
) {
  return {
    content,
    isStreaming,
    className,
  }
}
