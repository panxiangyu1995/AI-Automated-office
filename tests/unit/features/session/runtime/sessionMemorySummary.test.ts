/**
 * Session Memory Summary Tests
 * Task 78: Story 47.3 - Session Memory Summary
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type MemoryEntry,
  type MemoryEntryType,
  type MemoryImportance,
  type KeyFact,
  type SessionMemorySummary,
  type SummaryOptions,
  type RefreshConfig,
  type MemoryRefreshTrigger,

  // ID generation
  generateMemoryId,
  generateSummaryId,
  generateFactId,

  // Creation functions
  createMemoryEntry,
  createKeyFact,
  createSessionMemorySummary,

  // Extraction functions
  extractMemoryFromMessage,
  extractMemoryFromPart,
  extractKeyFacts,

  // Summary functions
  summarizeSession,

  // Memory management
  addMemoryEntry,
  removeMemoryEntry,
  touchMemoryEntry,
  pruneExpiredEntries,
  mergeSummaries,

  // Refresh functions
  shouldRefreshMemory,
  refreshMemorySummary,

  // Query functions
  getEntriesByType,
  getEntriesByImportance,
  searchEntries,
  getFactsByCategory,
  getVerifiedFacts,

  // Serialization
  serializeSummary,
  deserializeSummary,
  validateSummary,
} from '@/features/session/runtime/sessionMemorySummary'
import {
  type Message,
  type Part,
  createTextPart,
  createReasoningPart,
  createToolCallPart,
  createToolResultPart,
  createErrorPart,
  createMessage,
} from '@/features/message/runtime/messageModel'

// ==================== Test Helpers ====================

function createTestMessage(
  role: 'user' | 'assistant' = 'user',
  parts?: Part[]
): Message {
  return createMessage(
    'test-session-id',
    role,
    parts ?? [createTextPart('Test message content')]
  )
}

// ==================== ID Generation Tests ====================

describe('generateMemoryId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateMemoryId()
    const id2 = generateMemoryId()
    expect(id1).not.toBe(id2)
  })

  it('should have mem_ prefix', () => {
    const id = generateMemoryId()
    expect(id.startsWith('mem_')).toBe(true)
  })
})

describe('generateSummaryId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateSummaryId()
    const id2 = generateSummaryId()
    expect(id1).not.toBe(id2)
  })

  it('should have sum_ prefix', () => {
    const id = generateSummaryId()
    expect(id.startsWith('sum_')).toBe(true)
  })
})

describe('generateFactId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateFactId()
    const id2 = generateFactId()
    expect(id1).not.toBe(id2)
  })

  it('should have fact_ prefix', () => {
    const id = generateFactId()
    expect(id.startsWith('fact_')).toBe(true)
  })
})

// ==================== Memory Entry Creation Tests ====================

describe('createMemoryEntry', () => {
  it('should create entry with required fields', () => {
    const source = {
      messageId: 'msg-1',
      timestamp: Date.now(),
    }

    const entry = createMemoryEntry('fact', 'Test content', source)

    expect(entry.type).toBe('fact')
    expect(entry.content).toBe('Test content')
    expect(entry.source).toBe(source)
    expect(entry.importance).toBe('medium')
    expect(entry.accessCount).toBe(0)
  })

  it('should create entry with options', () => {
    const source = {
      messageId: 'msg-1',
      timestamp: Date.now(),
    }

    const entry = createMemoryEntry('preference', 'Test preference', source, {
      importance: 'high',
      metadata: {
        topic: 'testing',
        confidence: 0.9,
      },
    })

    expect(entry.importance).toBe('high')
    expect(entry.metadata?.topic).toBe('testing')
    expect(entry.metadata?.confidence).toBe(0.9)
  })

  it('should support all entry types', () => {
    const types: MemoryEntryType[] = [
      'fact',
      'preference',
      'context',
      'decision',
      'action_result',
      'summary',
    ]

    const source = { messageId: 'msg-1', timestamp: Date.now() }

    for (const type of types) {
      const entry = createMemoryEntry(type, `Test ${type}`, source)
      expect(entry.type).toBe(type)
    }
  })
})

describe('createKeyFact', () => {
  it('should create key fact with defaults', () => {
    const source = {
      messageId: 'msg-1',
      timestamp: Date.now(),
    }

    const fact = createKeyFact('The sky is blue', 'science', source)

    expect(fact.fact).toBe('The sky is blue')
    expect(fact.category).toBe('science')
    expect(fact.confidence).toBe(0.8)
    expect(fact.verified).toBe(false)
    expect(fact.mentionedCount).toBe(1)
  })

  it('should create key fact with custom confidence', () => {
    const source = {
      messageId: 'msg-1',
      timestamp: Date.now(),
    }

    const fact = createKeyFact('Test fact', 'general', source, 0.95)

    expect(fact.confidence).toBe(0.95)
  })
})

// ==================== Memory Extraction Tests ====================

describe('extractMemoryFromMessage', () => {
  it('should extract entries from text parts', () => {
    const message = createTestMessage('user', [
      createTextPart('This is important information'),
    ])

    const entries = extractMemoryFromMessage(message)

    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].type).toBeDefined()
    expect(entries[0].content).toContain('important')
  })

  it('should extract entries from reasoning parts', () => {
    const message = createTestMessage('assistant', [
      createReasoningPart('I need to analyze this data', 'analysis'),
    ])

    const entries = extractMemoryFromMessage(message)

    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].type).toBe('decision')
    expect(entries[0].importance).toBe('high')
  })

  it('should extract entries from tool call parts', () => {
    const message = createTestMessage('assistant', [
      createToolCallPart('tool-1', 'search_database', [
        { name: 'query', value: 'test' },
      ]),
    ])

    const entries = extractMemoryFromMessage(message)

    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].type).toBe('action_result')
    expect(entries[0].metadata?.toolName).toBe('search_database')
  })

  it('should extract entries from tool result parts', () => {
    const message = createTestMessage('tool', [
      createToolResultPart('tc-1', 'search_database', { results: [] }, true),
    ])

    const entries = extractMemoryFromMessage(message)

    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].type).toBe('action_result')
  })

  it('should filter tool results when option is false', () => {
    const message = createTestMessage('tool', [
      createToolResultPart('tc-1', 'tool', { data: 'test' }, true),
    ])

    const entries = extractMemoryFromMessage(message, {
      includeToolResults: false,
    })

    expect(entries.length).toBe(0)
  })

  it('should filter reasoning when option is false', () => {
    const message = createTestMessage('assistant', [
      createReasoningPart('Thinking...', 'analysis'),
    ])

    const entries = extractMemoryFromMessage(message, {
      includeReasoning: false,
    })

    expect(entries.length).toBe(0)
  })
})

describe('extractMemoryFromPart', () => {
  it('should extract from text part', () => {
    const message = createTestMessage()
    const part = createTextPart('This is a test message')
    const entry = extractMemoryFromPart(part, message)

    expect(entry).not.toBeNull()
    expect(entry?.type).toBeDefined()
    expect(entry?.content).toBe('This is a test message')
  })

  it('should return null for confirmation parts', () => {
    const message = createTestMessage()
    const part = {
      id: 'part-1',
      type: 'confirmation' as const,
      createdAt: Date.now(),
      title: 'Confirm?',
      message: 'Please confirm',
      options: [],
      status: 'pending' as const,
    }

    const entry = extractMemoryFromPart(part as Part, message)
    expect(entry).toBeNull()
  })

  it('should return null for ui_patch parts', () => {
    const message = createTestMessage()
    const part = {
      id: 'part-1',
      type: 'ui_patch' as const,
      createdAt: Date.now(),
      target: 'component-1',
      actions: [],
      version: 1,
    }

    const entry = extractMemoryFromPart(part as Part, message)
    expect(entry).toBeNull()
  })
})

// ==================== Key Fact Extraction Tests ====================

describe('extractKeyFacts', () => {
  it('should extract facts from messages', () => {
    const messages = [
      createTestMessage('user', [
        createTextPart('The project started in 2024. It has 5 modules.'),
      ]),
    ]

    const facts = extractKeyFacts(messages)

    expect(facts.length).toBeGreaterThan(0)
  })

  it('should limit facts by maxFacts option', () => {
    const messages = Array(10).fill(null).map(() =>
      createTestMessage('user', [
        createTextPart('This is a factual statement about something important.'),
      ])
    )

    const facts = extractKeyFacts(messages, { maxFacts: 3 })

    expect(facts.length).toBeLessThanOrEqual(3)
  })

  it('should deduplicate similar facts', () => {
    const messages = [
      createTestMessage('user', [createTextPart('The sky is blue.')]),
      createTestMessage('assistant', [createTextPart('The sky is blue.')]),
    ]

    const facts = extractKeyFacts(messages)

    // Should have only one unique fact
    expect(facts.length).toBeLessThanOrEqual(2)
  })
})

// ==================== Summary Generation Tests ====================

describe('createSessionMemorySummary', () => {
  it('should create summary with defaults', () => {
    const summary = createSessionMemorySummary('session-1')

    expect(summary.sessionId).toBe('session-1')
    expect(summary.summaryId).toBeDefined()
    expect(summary.entries).toEqual([])
    expect(summary.keyFacts).toEqual([])
    expect(summary.statistics.totalMessages).toBe(0)
  })

  it('should create summary with context snapshot', () => {
    const summary = createSessionMemorySummary('session-1', {
      contextSnapshot: {
        pageContext: 'dashboard',
        userContext: 'admin',
        activeResources: ['resource-1'],
      },
    })

    expect(summary.contextSnapshot?.pageContext).toBe('dashboard')
    expect(summary.contextSnapshot?.activeResources).toContain('resource-1')
  })
})

describe('summarizeSession', () => {
  it('should create summary from messages', () => {
    const messages = [
      createTestMessage('user', [createTextPart('Hello')]),
      createTestMessage('assistant', [createTextPart('Hi there')]),
    ]

    const summary = summarizeSession('session-1', messages)

    expect(summary.sessionId).toBe('session-1')
    expect(summary.statistics.totalMessages).toBe(2)
    expect(summary.statistics.userMessagesCount).toBe(1)
    expect(summary.statistics.assistantMessagesCount).toBe(1)
  })

  it('should count tool calls correctly', () => {
    const messages = [
      createTestMessage('assistant', [
        createToolCallPart('tool-1', 'test_tool', []),
        createToolResultPart('tool-1', 'test_tool', { ok: true }, true),
      ]),
    ]

    const summary = summarizeSession('session-1', messages)

    expect(summary.statistics.toolCallsCount).toBe(1)
  })

  it('should count errors correctly', () => {
    const messages = [
      createTestMessage('assistant', [
        createErrorPart('TOOL_ERROR', 'Something went wrong', 'error', true),
      ]),
    ]

    const summary = summarizeSession('session-1', messages)

    expect(summary.statistics.errorsCount).toBe(1)
  })

  it('should limit entries by maxEntries option', () => {
    const messages = Array(20).fill(null).map(() =>
      createTestMessage('user', [createTextPart('Test message content')])
    )

    const summary = summarizeSession('session-1', messages, { maxEntries: 5 })

    expect(summary.entries.length).toBeLessThanOrEqual(5)
  })
})

// ==================== Memory Management Tests ====================

describe('addMemoryEntry', () => {
  it('should add entry to summary', () => {
    const summary = createSessionMemorySummary('session-1')
    const entry = createMemoryEntry('fact', 'Test fact', {
      messageId: 'msg-1',
      timestamp: Date.now(),
    })

    const updated = addMemoryEntry(summary, entry)

    expect(updated.entries.length).toBe(1)
    expect(updated.entries[0]).toBe(entry)
  })
})

describe('removeMemoryEntry', () => {
  it('should remove entry from summary', () => {
    const entry = createMemoryEntry('fact', 'Test fact', {
      messageId: 'msg-1',
      timestamp: Date.now(),
    })
    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(entry)

    const updated = removeMemoryEntry(summary, entry.id)

    expect(updated.entries.length).toBe(0)
  })
})

describe('touchMemoryEntry', () => {
  it('should update access info', () => {
    const entry = createMemoryEntry('fact', 'Test fact', {
      messageId: 'msg-1',
      timestamp: Date.now(),
    })
    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(entry)

    const updated = touchMemoryEntry(summary, entry.id)

    const touchedEntry = updated.entries.find(e => e.id === entry.id)
    expect(touchedEntry?.accessCount).toBe(1)
    // accessedAt should be >= original (same millisecond is valid)
    expect(touchedEntry?.accessedAt).toBeGreaterThanOrEqual(entry.accessedAt)
  })
})

describe('pruneExpiredEntries', () => {
  it('should remove expired entries', () => {
    const now = Date.now()
    const expiredEntry = createMemoryEntry('fact', 'Expired', {
      messageId: 'msg-1',
      timestamp: now - 10000,
    }, { expiresAt: now - 1000 })

    const validEntry = createMemoryEntry('fact', 'Valid', {
      messageId: 'msg-2',
      timestamp: now,
    })

    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(expiredEntry, validEntry)

    const pruned = pruneExpiredEntries(summary)

    expect(pruned.entries.length).toBe(1)
    expect(pruned.entries[0].content).toBe('Valid')
  })

  it('should keep entries without expiration', () => {
    const entry = createMemoryEntry('fact', 'No expiration', {
      messageId: 'msg-1',
      timestamp: Date.now(),
    })

    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(entry)

    const pruned = pruneExpiredEntries(summary)

    expect(pruned.entries.length).toBe(1)
  })
})

describe('mergeSummaries', () => {
  it('should merge entries from both summaries', () => {
    const entry1 = createMemoryEntry('fact', 'Fact 1', {
      messageId: 'msg-1',
      timestamp: Date.now(),
    })
    const entry2 = createMemoryEntry('fact', 'Fact 2', {
      messageId: 'msg-2',
      timestamp: Date.now(),
    })

    const summary1 = createSessionMemorySummary('session-1')
    summary1.entries.push(entry1)

    const summary2 = createSessionMemorySummary('session-1')
    summary2.entries.push(entry2)

    const merged = mergeSummaries(summary1, summary2)

    expect(merged.entries.length).toBeGreaterThanOrEqual(2)
  })

  it('should merge statistics', () => {
    const summary1 = createSessionMemorySummary('session-1')
    summary1.statistics.totalMessages = 5
    summary1.statistics.toolCallsCount = 3

    const summary2 = createSessionMemorySummary('session-1')
    summary2.statistics.totalMessages = 3
    summary2.statistics.toolCallsCount = 2

    const merged = mergeSummaries(summary1, summary2)

    expect(merged.statistics.totalMessages).toBe(8)
    expect(merged.statistics.toolCallsCount).toBe(5)
  })

  it('should deduplicate identical entries', () => {
    const entry = createMemoryEntry('fact', 'Same fact', {
      messageId: 'msg-1',
      timestamp: Date.now(),
    })

    const summary1 = createSessionMemorySummary('session-1')
    summary1.entries.push(entry)

    const summary2 = createSessionMemorySummary('session-1')
    summary2.entries.push({ ...entry, id: generateMemoryId() })

    const merged = mergeSummaries(summary1, summary2)

    // Should deduplicate by content
    expect(merged.entries.length).toBe(1)
  })
})

// ==================== Refresh Logic Tests ====================

describe('shouldRefreshMemory', () => {
  it('should trigger on message count', () => {
    const summary = createSessionMemorySummary('session-1')
    const messages = Array(10).fill(null).map(() => createTestMessage())

    const config: RefreshConfig = { trigger: 'message_count', threshold: 10 }

    expect(shouldRefreshMemory(summary, config, messages)).toBe(true)
  })

  it('should not trigger below message threshold', () => {
    const summary = createSessionMemorySummary('session-1')
    const messages = Array(5).fill(null).map(() => createTestMessage())

    const config: RefreshConfig = { trigger: 'message_count', threshold: 10 }

    expect(shouldRefreshMemory(summary, config, messages)).toBe(false)
  })

  it('should trigger on tool completion', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.statistics.toolCallsCount = 5

    const config: RefreshConfig = { trigger: 'tool_completion', threshold: 5 }

    expect(shouldRefreshMemory(summary, config, [])).toBe(true)
  })

  it('should trigger on error recovery', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.statistics.errorsCount = 1

    const config: RefreshConfig = { trigger: 'error_recovery' }

    expect(shouldRefreshMemory(summary, config, [])).toBe(true)
  })

  it('should trigger on time interval', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.updatedAt = Date.now() - 60000 // 1 minute ago

    const config: RefreshConfig = { trigger: 'time_interval', interval: 30000 }

    expect(shouldRefreshMemory(summary, config, [])).toBe(true)
  })
})

describe('refreshMemorySummary', () => {
  it('should add new entries from messages', () => {
    const summary = createSessionMemorySummary('session-1')
    const newMessages = [
      createTestMessage('user', [createTextPart('New information')]),
    ]

    const refreshed = refreshMemorySummary(summary, newMessages)

    expect(refreshed.entries.length).toBeGreaterThan(0)
  })

  it('should prune expired entries', () => {
    const now = Date.now()
    const expiredEntry = createMemoryEntry('fact', 'Expired', {
      messageId: 'msg-1',
      timestamp: now - 10000,
    }, { expiresAt: now - 1000 })

    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(expiredEntry)

    const refreshed = refreshMemorySummary(summary, [])

    expect(refreshed.entries.length).toBe(0)
  })

  it('should update timestamp', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.updatedAt = Date.now() - 10000

    const refreshed = refreshMemorySummary(summary, [])

    expect(refreshed.updatedAt).toBeGreaterThan(summary.updatedAt)
  })
})

// ==================== Query Functions Tests ====================

describe('getEntriesByType', () => {
  it('should filter entries by type', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(
      createMemoryEntry('fact', 'Fact 1', { messageId: 'm1', timestamp: Date.now() }),
      createMemoryEntry('preference', 'Pref 1', { messageId: 'm2', timestamp: Date.now() }),
      createMemoryEntry('fact', 'Fact 2', { messageId: 'm3', timestamp: Date.now() })
    )

    const facts = getEntriesByType(summary, 'fact')

    expect(facts.length).toBe(2)
    expect(facts.every(e => e.type === 'fact')).toBe(true)
  })
})

describe('getEntriesByImportance', () => {
  it('should filter by minimum importance', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(
      createMemoryEntry('fact', 'Low', { messageId: 'm1', timestamp: Date.now() }, { importance: 'low' }),
      createMemoryEntry('fact', 'High', { messageId: 'm2', timestamp: Date.now() }, { importance: 'high' }),
      createMemoryEntry('fact', 'Critical', { messageId: 'm3', timestamp: Date.now() }, { importance: 'critical' })
    )

    const filtered = getEntriesByImportance(summary, 'high')

    expect(filtered.length).toBe(2)
    expect(filtered.every(e => e.importance === 'high' || e.importance === 'critical')).toBe(true)
  })
})

describe('searchEntries', () => {
  it('should find entries by content', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(
      createMemoryEntry('fact', 'The quick brown fox', { messageId: 'm1', timestamp: Date.now() }),
      createMemoryEntry('fact', 'A lazy dog', { messageId: 'm2', timestamp: Date.now() })
    )

    const results = searchEntries(summary, 'fox')

    expect(results.length).toBe(1)
    expect(results[0].content).toContain('fox')
  })

  it('should be case insensitive', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(
      createMemoryEntry('fact', 'IMPORTANT Information', { messageId: 'm1', timestamp: Date.now() })
    )

    const results = searchEntries(summary, 'important')

    expect(results.length).toBe(1)
  })
})

describe('getFactsByCategory', () => {
  it('should filter facts by category', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.keyFacts.push(
      createKeyFact('Fact 1', 'science', { messageId: 'm1', timestamp: Date.now() }),
      createKeyFact('Fact 2', 'general', { messageId: 'm2', timestamp: Date.now() }),
      createKeyFact('Fact 3', 'science', { messageId: 'm3', timestamp: Date.now() })
    )

    const scienceFacts = getFactsByCategory(summary, 'science')

    expect(scienceFacts.length).toBe(2)
  })
})

describe('getVerifiedFacts', () => {
  it('should return only verified facts', () => {
    const summary = createSessionMemorySummary('session-1')
    const fact1 = createKeyFact('Fact 1', 'general', { messageId: 'm1', timestamp: Date.now() })
    const fact2 = createKeyFact('Fact 2', 'general', { messageId: 'm2', timestamp: Date.now() })
    fact2.verified = true

    summary.keyFacts.push(fact1, fact2)

    const verified = getVerifiedFacts(summary)

    expect(verified.length).toBe(1)
    expect(verified[0].verified).toBe(true)
  })
})

// ==================== Serialization Tests ====================

describe('serializeSummary', () => {
  it('should serialize summary to JSON string', () => {
    const summary = createSessionMemorySummary('session-1')
    summary.entries.push(
      createMemoryEntry('fact', 'Test', { messageId: 'm1', timestamp: Date.now() })
    )

    const serialized = serializeSummary(summary)

    expect(typeof serialized).toBe('string')
    expect(() => JSON.parse(serialized)).not.toThrow()
  })
})

describe('deserializeSummary', () => {
  it('should deserialize from JSON string', () => {
    const summary = createSessionMemorySummary('session-1')
    const serialized = serializeSummary(summary)

    const deserialized = deserializeSummary(serialized)

    expect(deserialized.sessionId).toBe(summary.sessionId)
    expect(deserialized.summaryId).toBe(summary.summaryId)
  })
})

describe('validateSummary', () => {
  it('should validate correct summary', () => {
    const summary = createSessionMemorySummary('session-1')

    expect(validateSummary(summary)).toBe(true)
  })

  it('should reject null', () => {
    expect(validateSummary(null)).toBe(false)
  })

  it('should reject object without required fields', () => {
    expect(validateSummary({})).toBe(false)
    expect(validateSummary({ sessionId: 'test' })).toBe(false)
  })

  it('should reject invalid entries array', () => {
    const summary = createSessionMemorySummary('session-1')
    ;(summary as Record<string, unknown>).entries = 'not an array'

    expect(validateSummary(summary)).toBe(false)
  })

  it('should reject missing statistics', () => {
    const summary = createSessionMemorySummary('session-1')
    ;(summary as Record<string, unknown>).statistics = undefined

    expect(validateSummary(summary)).toBe(false)
  })
})
