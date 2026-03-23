/**
 * Session Memory Summary
 * Task 78: Story 47.3 - Session Memory Summary
 *
 * This module provides memory summary and key fact extraction for active sessions.
 * Summarizes recent session history into reusable memory entries.
 */

import type { Message, Part, TextPart, ToolCallPart, ToolResultPart, ReasoningPart } from '../../message/runtime/messageModel'

// ==================== Types ====================

/**
 * Memory entry type
 */
export type MemoryEntryType =
  | 'fact'           // Key fact extracted from conversation
  | 'preference'     // User preference learned
  | 'context'        // Contextual information
  | 'decision'       // Decision made during session
  | 'action_result'  // Result of a tool action
  | 'summary'        // Summarized content

/**
 * Memory importance level
 */
export type MemoryImportance =
  | 'critical'       // Must retain for session continuity
  | 'high'           // Important for current task
  | 'medium'         // Useful context
  | 'low'            // Nice to have

/**
 * Memory entry
 */
export interface MemoryEntry {
  id: string
  type: MemoryEntryType
  content: string
  importance: MemoryImportance
  source: {
    messageId: string
    partId?: string
    timestamp: number
  }
  metadata?: {
    toolName?: string
    topic?: string
    entities?: string[]
    confidence?: number // 0-1
  }
  expiresAt?: number
  accessedAt: number
  accessCount: number
}

/**
 * Key fact extracted from session
 */
export interface KeyFact {
  id: string
  fact: string
  category: string
  confidence: number
  source: {
    messageId: string
    timestamp: number
  }
  verified: boolean
  mentionedCount: number
}

/**
 * Session memory summary
 */
export interface SessionMemorySummary {
  summaryId: string
  sessionId: string
  createdAt: number
  updatedAt: number
  entries: MemoryEntry[]
  keyFacts: KeyFact[]
  statistics: {
    totalMessages: number
    totalParts: number
    toolCallsCount: number
    errorsCount: number
    userMessagesCount: number
    assistantMessagesCount: number
  }
  contextSnapshot?: {
    pageContext?: string
    userContext?: string
    activeResources?: string[]
  }
}

/**
 * Summary generation options
 */
export interface SummaryOptions {
  maxEntries?: number
  maxFacts?: number
  minImportance?: MemoryImportance
  includeToolResults?: boolean
  includeReasoning?: boolean
  extractEntities?: boolean
  contextSnapshot?: SessionMemorySummary['contextSnapshot']
}

/**
 * Memory refresh trigger
 */
export type MemoryRefreshTrigger =
  | 'message_count'    // After N messages
  | 'tool_completion'  // After tool execution
  | 'error_recovery'   // After error handling
  | 'milestone'        // After important milestone
  | 'user_request'     // User requested refresh
  | 'time_interval'    // Time-based refresh

/**
 * Refresh configuration
 */
export interface RefreshConfig {
  trigger: MemoryRefreshTrigger
  threshold?: number // For count-based triggers
  interval?: number  // For time-based triggers (ms)
}

// ==================== Constants ====================

const DEFAULT_MAX_ENTRIES = 50
const DEFAULT_MAX_FACTS = 20

const IMPORTANCE_PRIORITY: Record<MemoryImportance, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

// ==================== Helper Functions ====================

/**
 * Generate a unique memory ID
 */
export function generateMemoryId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `mem_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Generate a unique summary ID
 */
export function generateSummaryId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `sum_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Generate a unique fact ID
 */
export function generateFactId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `fact_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

// ==================== Memory Entry Creation ====================

/**
 * Create a memory entry
 */
export function createMemoryEntry(
  type: MemoryEntryType,
  content: string,
  source: MemoryEntry['source'],
  options: {
    importance?: MemoryImportance
    metadata?: MemoryEntry['metadata']
    expiresAt?: number
  } = {}
): MemoryEntry {
  const now = Date.now()
  return {
    id: generateMemoryId(),
    type,
    content,
    importance: options.importance ?? 'medium',
    source,
    metadata: options.metadata,
    expiresAt: options.expiresAt,
    accessedAt: now,
    accessCount: 0,
  }
}

/**
 * Create a key fact
 */
export function createKeyFact(
  fact: string,
  category: string,
  source: KeyFact['source'],
  confidence: number = 0.8
): KeyFact {
  return {
    id: generateFactId(),
    fact,
    category,
    confidence,
    source,
    verified: false,
    mentionedCount: 1,
  }
}

// ==================== Memory Extraction ====================

/**
 * Extract memory entries from a message
 */
export function extractMemoryFromMessage(
  message: Message,
  options: SummaryOptions = {}
): MemoryEntry[] {
  const entries: MemoryEntry[] = []
  const { includeToolResults = true, includeReasoning = true } = options

  for (const part of message.parts) {
    const entry = extractMemoryFromPart(part, message)
    if (entry) {
      // Filter based on options
      if (part.type === 'tool_result' && !includeToolResults) continue
      if (part.type === 'reasoning' && !includeReasoning) continue

      // Skip low importance if filtering
      if (options.minImportance && entry.importance === 'low') {
        const minPriority = IMPORTANCE_PRIORITY[options.minImportance]
        if (IMPORTANCE_PRIORITY[entry.importance] < minPriority) continue
      }

      entries.push(entry)
    }
  }

  return entries
}

/**
 * Extract memory entry from a part
 */
export function extractMemoryFromPart(part: Part, message: Message): MemoryEntry | null {
  const source = {
    messageId: message.id,
    partId: part.id,
    timestamp: part.createdAt,
  }

  switch (part.type) {
    case 'text': {
      const textPart = part as TextPart
      const importance = assessTextImportance(textPart.content)
      const type = classifyTextType(textPart.content)

      return createMemoryEntry(type, textPart.content, source, {
        importance,
        metadata: {
          confidence: 0.9,
        },
      })
    }

    case 'reasoning': {
      const reasoningPart = part as ReasoningPart
      return createMemoryEntry('decision', reasoningPart.content, source, {
        importance: 'high',
        metadata: {
          confidence: 0.85,
          topic: reasoningPart.thinkingProcess,
        },
      })
    }

    case 'tool_call': {
      const toolCallPart = part as ToolCallPart
      return createMemoryEntry('action_result', `Tool call: ${toolCallPart.toolName}`, source, {
        importance: 'medium',
        metadata: {
          toolName: toolCallPart.toolName,
          confidence: 0.95,
        },
      })
    }

    case 'tool_result': {
      const toolResultPart = part as ToolResultPart
      const content = typeof toolResultPart.result === 'string'
        ? toolResultPart.result
        : JSON.stringify(toolResultPart.result)

      return createMemoryEntry('action_result', content, source, {
        importance: toolResultPart.success ? 'medium' : 'high',
        metadata: {
          toolName: toolResultPart.toolName,
          confidence: toolResultPart.success ? 0.95 : 0.7,
        },
      })
    }

    case 'error': {
      return createMemoryEntry('fact', `Error: ${part.message || 'Unknown error'}`, source, {
        importance: 'high',
        metadata: {
          confidence: 1.0,
        },
      })
    }

    case 'confirmation':
    case 'ui_patch':
      // These types don't typically contribute to memory
      return null

    default:
      return null
  }
}

/**
 * Assess importance of text content
 */
function assessTextImportance(content: string): MemoryImportance {
  // Check for critical indicators
  const criticalPatterns = [
    /important/i,
    /critical/i,
    /must/i,
    /required/i,
    /error/i,
    /failed/i,
  ]

  for (const pattern of criticalPatterns) {
    if (pattern.test(content)) return 'critical'
  }

  // Check for high importance indicators
  const highPatterns = [
    /decision/i,
    /choose/i,
    /selected/i,
    /confirmed/i,
    /completed/i,
    /result/i,
  ]

  for (const pattern of highPatterns) {
    if (pattern.test(content)) return 'high'
  }

  // Check length - longer content might be more important
  if (content.length > 500) return 'medium'

  return 'low'
}

/**
 * Classify text type based on content
 */
function classifyTextType(content: string): MemoryEntryType {
  // Check for preference indicators
  const preferencePatterns = [
    /i prefer/i,
    /i like/i,
    /i want/i,
    /please use/i,
    /always use/i,
  ]

  for (const pattern of preferencePatterns) {
    if (pattern.test(content)) return 'preference'
  }

  // Check for decision indicators
  const decisionPatterns = [
    /i decide/i,
    /let's go with/i,
    /we will use/i,
    /the plan is/i,
  ]

  for (const pattern of decisionPatterns) {
    if (pattern.test(content)) return 'decision'
  }

  // Check for context indicators
  const contextPatterns = [
    /the context is/i,
    /background:/i,
    /for context/i,
    /the situation is/i,
  ]

  for (const pattern of contextPatterns) {
    if (pattern.test(content)) return 'context'
  }

  return 'fact'
}

// ==================== Key Fact Extraction ====================

/**
 * Extract key facts from messages
 */
export function extractKeyFacts(
  messages: Message[],
  options: SummaryOptions = {}
): KeyFact[] {
  const facts: KeyFact[] = []
  const { maxFacts = DEFAULT_MAX_FACTS } = options

  for (const message of messages) {
    const messageFacts = extractFactsFromMessage(message)
    facts.push(...messageFacts)
  }

  // Deduplicate and rank
  const uniqueFacts = deduplicateFacts(facts)

  // Sort by confidence and mentioned count
  uniqueFacts.sort((a, b) => {
    if (a.mentionedCount !== b.mentionedCount) {
      return b.mentionedCount - a.mentionedCount
    }
    return b.confidence - a.confidence
  })

  return uniqueFacts.slice(0, maxFacts)
}

/**
 * Extract facts from a single message
 */
function extractFactsFromMessage(message: Message): KeyFact[] {
  const facts: KeyFact[] = []

  for (const part of message.parts) {
    if (part.type === 'text') {
      const textPart = part as TextPart
      const sentences = extractFactualSentences(textPart.content)

      for (const sentence of sentences) {
        facts.push(createKeyFact(
          sentence,
          'general',
          {
            messageId: message.id,
            timestamp: part.createdAt,
          },
          0.75
        ))
      }
    }
  }

  return facts
}

/**
 * Extract factual sentences from text
 */
function extractFactualSentences(text: string): string[] {
  // Simple sentence extraction
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200)

  // Filter for factual content
  const factualPatterns = [
    /^the\s+/i,
    /^a\s+/i,
    /^this\s+/i,
    /^there\s+(is|are)/i,
    /^it\s+(is|was|will)/i,
    /^\w+\s+(is|are|was|were|has|have|will)\s+/i,
  ]

  return sentences.filter(sentence => {
    return factualPatterns.some(pattern => pattern.test(sentence))
  })
}

/**
 * Deduplicate facts
 */
function deduplicateFacts(facts: KeyFact[]): KeyFact[] {
  const factMap = new Map<string, KeyFact>()

  for (const fact of facts) {
    const normalizedFact = fact.fact.toLowerCase().trim()

    if (factMap.has(normalizedFact)) {
      const existing = factMap.get(normalizedFact)!
      existing.mentionedCount++
      existing.confidence = Math.min(1.0, existing.confidence + 0.1)
    } else {
      factMap.set(normalizedFact, fact)
    }
  }

  return Array.from(factMap.values())
}

// ==================== Summary Generation ====================

/**
 * Create a session memory summary
 */
export function createSessionMemorySummary(
  sessionId: string,
  options: SummaryOptions = {}
): SessionMemorySummary {
  const now = Date.now()
  const { contextSnapshot } = options

  return {
    summaryId: generateSummaryId(),
    sessionId,
    createdAt: now,
    updatedAt: now,
    entries: [],
    keyFacts: [],
    statistics: {
      totalMessages: 0,
      totalParts: 0,
      toolCallsCount: 0,
      errorsCount: 0,
      userMessagesCount: 0,
      assistantMessagesCount: 0,
    },
    contextSnapshot,
  }
}

/**
 * Summarize session messages into memory entries
 */
export function summarizeSession(
  sessionId: string,
  messages: Message[],
  options: SummaryOptions = {}
): SessionMemorySummary {
  const summary = createSessionMemorySummary(sessionId, options)
  const { maxEntries = DEFAULT_MAX_ENTRIES } = options

  // Extract memory entries from all messages
  const allEntries: MemoryEntry[] = []
  let toolCallsCount = 0
  let errorsCount = 0
  let userMessagesCount = 0
  let assistantMessagesCount = 0
  let totalParts = 0

  for (const message of messages) {
    // Count statistics
    totalParts += message.parts.length

    if (message.role === 'user') userMessagesCount++
    if (message.role === 'assistant') assistantMessagesCount++

    for (const part of message.parts) {
      if (part.type === 'tool_call') toolCallsCount++
      if (part.type === 'error') errorsCount++
    }

    // Extract entries
    const entries = extractMemoryFromMessage(message, options)
    allEntries.push(...entries)
  }

  // Sort by importance and recency
  allEntries.sort((a, b) => {
    const importanceDiff = IMPORTANCE_PRIORITY[b.importance] - IMPORTANCE_PRIORITY[a.importance]
    if (importanceDiff !== 0) return importanceDiff
    return b.source.timestamp - a.source.timestamp
  })

  // Take top entries
  summary.entries = allEntries.slice(0, maxEntries)

  // Extract key facts
  summary.keyFacts = extractKeyFacts(messages, options)

  // Update statistics
  summary.statistics = {
    totalMessages: messages.length,
    totalParts,
    toolCallsCount,
    errorsCount,
    userMessagesCount,
    assistantMessagesCount,
  }

  summary.updatedAt = Date.now()

  return summary
}

// ==================== Memory Management ====================

/**
 * Add entry to summary
 */
export function addMemoryEntry(
  summary: SessionMemorySummary,
  entry: MemoryEntry
): SessionMemorySummary {
  return {
    ...summary,
    entries: [...summary.entries, entry],
    updatedAt: Date.now(),
  }
}

/**
 * Remove entry from summary
 */
export function removeMemoryEntry(
  summary: SessionMemorySummary,
  entryId: string
): SessionMemorySummary {
  return {
    ...summary,
    entries: summary.entries.filter(e => e.id !== entryId),
    updatedAt: Date.now(),
  }
}

/**
 * Update entry access
 */
export function touchMemoryEntry(
  summary: SessionMemorySummary,
  entryId: string
): SessionMemorySummary {
  const now = Date.now()
  return {
    ...summary,
    entries: summary.entries.map(e =>
      e.id === entryId
        ? { ...e, accessedAt: now, accessCount: e.accessCount + 1 }
        : e
    ),
    updatedAt: now,
  }
}

/**
 * Prune expired entries
 */
export function pruneExpiredEntries(
  summary: SessionMemorySummary
): SessionMemorySummary {
  const now = Date.now()
  const validEntries = summary.entries.filter(
    e => !e.expiresAt || e.expiresAt > now
  )

  return {
    ...summary,
    entries: validEntries,
    updatedAt: now,
  }
}

/**
 * Merge two summaries
 */
export function mergeSummaries(
  primary: SessionMemorySummary,
  secondary: SessionMemorySummary,
  options: SummaryOptions = {}
): SessionMemorySummary {
  const { maxEntries = DEFAULT_MAX_ENTRIES } = options

  // Combine entries
  const combinedEntries = [...primary.entries, ...secondary.entries]

  // Deduplicate by content similarity
  const uniqueEntries = deduplicateEntries(combinedEntries)

  // Sort and limit
  uniqueEntries.sort((a, b) => {
    const importanceDiff = IMPORTANCE_PRIORITY[b.importance] - IMPORTANCE_PRIORITY[a.importance]
    if (importanceDiff !== 0) return importanceDiff
    return b.source.timestamp - a.source.timestamp
  })

  // Combine facts
  const combinedFacts = [...primary.keyFacts, ...secondary.keyFacts]
  const uniqueFacts = deduplicateFacts(combinedFacts)

  // Merge statistics
  const mergedStats = {
    totalMessages: primary.statistics.totalMessages + secondary.statistics.totalMessages,
    totalParts: primary.statistics.totalParts + secondary.statistics.totalParts,
    toolCallsCount: primary.statistics.toolCallsCount + secondary.statistics.toolCallsCount,
    errorsCount: primary.statistics.errorsCount + secondary.statistics.errorsCount,
    userMessagesCount: primary.statistics.userMessagesCount + secondary.statistics.userMessagesCount,
    assistantMessagesCount: primary.statistics.assistantMessagesCount + secondary.statistics.assistantMessagesCount,
  }

  return {
    summaryId: primary.summaryId,
    sessionId: primary.sessionId,
    createdAt: Math.min(primary.createdAt, secondary.createdAt),
    updatedAt: Date.now(),
    entries: uniqueEntries.slice(0, maxEntries),
    keyFacts: uniqueFacts.slice(0, options.maxFacts ?? DEFAULT_MAX_FACTS),
    statistics: mergedStats,
    contextSnapshot: primary.contextSnapshot ?? secondary.contextSnapshot,
  }
}

/**
 * Deduplicate memory entries
 */
function deduplicateEntries(entries: MemoryEntry[]): MemoryEntry[] {
  const seen = new Map<string, MemoryEntry>()

  for (const entry of entries) {
    const key = entry.content.toLowerCase().trim()

    if (seen.has(key)) {
      const existing = seen.get(key)!
      // Keep the one with higher importance or more recent
      if (IMPORTANCE_PRIORITY[entry.importance] > IMPORTANCE_PRIORITY[existing.importance]) {
        seen.set(key, entry)
      } else if (
        IMPORTANCE_PRIORITY[entry.importance] === IMPORTANCE_PRIORITY[existing.importance] &&
        entry.source.timestamp > existing.source.timestamp
      ) {
        seen.set(key, entry)
      }
    } else {
      seen.set(key, entry)
    }
  }

  return Array.from(seen.values())
}

// ==================== Refresh Logic ====================

/**
 * Check if memory refresh is needed
 */
export function shouldRefreshMemory(
  summary: SessionMemorySummary,
  config: RefreshConfig,
  messages: Message[]
): boolean {
  switch (config.trigger) {
    case 'message_count':
      return messages.length >= (config.threshold ?? 10)

    case 'tool_completion':
      const recentToolCalls = summary.statistics.toolCallsCount
      return recentToolCalls > 0 && recentToolCalls % (config.threshold ?? 5) === 0

    case 'error_recovery':
      return summary.statistics.errorsCount > 0

    case 'time_interval':
      if (!config.interval) return false
      const timeSinceUpdate = Date.now() - summary.updatedAt
      return timeSinceUpdate >= config.interval

    case 'milestone':
    case 'user_request':
      // These are externally triggered
      return false

    default:
      return false
  }
}

/**
 * Refresh memory summary with new messages
 */
export function refreshMemorySummary(
  summary: SessionMemorySummary,
  newMessages: Message[],
  options: SummaryOptions = {}
): SessionMemorySummary {
  // Prune expired entries first
  const prunedSummary = pruneExpiredEntries(summary)

  // Extract new entries
  const newEntries: MemoryEntry[] = []
  for (const message of newMessages) {
    const entries = extractMemoryFromMessage(message, options)
    newEntries.push(...entries)
  }

  // Merge with existing
  const allEntries = [...prunedSummary.entries, ...newEntries]
  const uniqueEntries = deduplicateEntries(allEntries)

  // Sort and limit
  uniqueEntries.sort((a, b) => {
    const importanceDiff = IMPORTANCE_PRIORITY[b.importance] - IMPORTANCE_PRIORITY[a.importance]
    if (importanceDiff !== 0) return importanceDiff
    return b.source.timestamp - a.source.timestamp
  })

  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES

  return {
    ...prunedSummary,
    entries: uniqueEntries.slice(0, maxEntries),
    updatedAt: Date.now(),
  }
}

// ==================== Query Functions ====================

/**
 * Get entries by type
 */
export function getEntriesByType(
  summary: SessionMemorySummary,
  type: MemoryEntryType
): MemoryEntry[] {
  return summary.entries.filter(e => e.type === type)
}

/**
 * Get entries by importance
 */
export function getEntriesByImportance(
  summary: SessionMemorySummary,
  minImportance: MemoryImportance
): MemoryEntry[] {
  const minPriority = IMPORTANCE_PRIORITY[minImportance]
  return summary.entries.filter(
    e => IMPORTANCE_PRIORITY[e.importance] >= minPriority
  )
}

/**
 * Search entries by content
 */
export function searchEntries(
  summary: SessionMemorySummary,
  query: string
): MemoryEntry[] {
  const lowerQuery = query.toLowerCase()
  return summary.entries.filter(e =>
    e.content.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get facts by category
 */
export function getFactsByCategory(
  summary: SessionMemorySummary,
  category: string
): KeyFact[] {
  return summary.keyFacts.filter(f => f.category === category)
}

/**
 * Get verified facts
 */
export function getVerifiedFacts(summary: SessionMemorySummary): KeyFact[] {
  return summary.keyFacts.filter(f => f.verified)
}

// ==================== Serialization ====================

/**
 * Serialize summary for storage
 */
export function serializeSummary(summary: SessionMemorySummary): string {
  return JSON.stringify(summary)
}

/**
 * Deserialize summary from storage
 */
export function deserializeSummary(data: string): SessionMemorySummary {
  return JSON.parse(data) as SessionMemorySummary
}

/**
 * Validate summary structure
 */
export function validateSummary(summary: unknown): summary is SessionMemorySummary {
  if (!summary || typeof summary !== 'object') return false

  const s = summary as Partial<SessionMemorySummary>
  if (!s.summaryId || !s.sessionId || !s.createdAt || !s.updatedAt) return false
  if (!Array.isArray(s.entries) || !Array.isArray(s.keyFacts)) return false
  if (!s.statistics) return false

  return true
}
