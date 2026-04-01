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
import type { Message } from '../../message/runtime/messageModel'
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
  /** Enable virtualized rendering */
  virtualized?: boolean
  /** Callback when streaming completes */
  onComplete?: (messageId: string, content: string) => void
  /** Callback on error */
  onError?: (error: string) => void
}

// ==================== Helper Functions ====================

/**
 * Accumulate text content from stream chunks
 */
function accumulateContent(chunks: PartDeltaEvent[]): string {
  return chunks.map(c => c.delta).join('')
}

/**
 * Calculate estimated tokens (simple heuristic)
 */
function estimateTokens(text: string): number {
  if (!text) return 0
  // Rough estimate: ~4 chars per token for English, ~1.5 for Chinese
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const chineseTokens = chineseChars / 1.5
  const otherTokens = (text.length - chineseChars) / 4
  return Math.ceil(chineseTokens + otherTokens)
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
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      chunksRef.current.clear()
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

/**
 * Hook for managing multiple streaming messages
 */
export function useStreamingManager() {
  const [activeStreams, setActiveStreams] = useState<Map<string, StreamingState>>(new Map())
  const streamsRef = useRef<Map<string, ReturnType<typeof useStreamingMessage>>>(new Map())

  // Start tracking a new message
  const startStream = useCallback((messageId: string, options?: UseStreamingOptions) => {
    const hook = useStreamingMessage(messageId, options)
    streamsRef.current.set(messageId, hook)
    
    setActiveStreams(prev => {
      const next = new Map(prev)
      next.set(messageId, hook.state)
      return next
    })
    
    return hook
  }, [])

  // Stop tracking a message
  const stopStream = useCallback((messageId: string) => {
    streamsRef.current.delete(messageId)
    
    setActiveStreams(prev => {
      const next = new Map(prev)
      next.delete(messageId)
      return next
    })
  }, [])

  // Get stream hook by ID
  const getStream = useCallback((messageId: string) => {
    return streamsRef.current.get(messageId)
  }, [])

  // Get all active stream IDs
  const getActiveIds = useCallback(() => {
    return Array.from(streamsRef.current.keys())
  }, [])

  return {
    activeStreams,
    startStream,
    stopStream,
    getStream,
    getActiveIds,
  }
}

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
    const charsPerSecond = 100 // Adjust for speed

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

  return { displayText, setTargetText, isComplete: displayText.length >= targetTextRef.current.length }
}

// ==================== Component Helpers ====================

/**
 * Virtualized message list for long conversations
 */
export interface VirtualizedMessageListProps {
  messages: Message[]
  itemHeight: number
  visibleCount: number
  renderItem: (message: Message, index: number) => React.ReactNode
}

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
 * Memoized streaming content component
 */
export function createStreamingContent(
  content: string,
  isStreaming: boolean,
  className?: string
): React.ReactNode {
  return (
    <span className={className}>
      {content}
      {isStreaming && <span className="streaming-cursor">|</span>}
    </span>
  )
}
