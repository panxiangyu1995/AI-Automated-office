/**
 * Unit tests for Runtime Metrics and Debug View Module (Story 48.4)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type MetricSeverity,
  type MetricCategory,
  type MetricPoint,
  type MetricAggregation,
  type RuntimeMetric,
  type LatencyMetrics,
  type SuccessMetrics,
  type RetryMetrics,
  type ConfirmationMetrics,
  type RuntimeMetricsSummary,
  type DebugViewEntry,
  type DebugViewFilter,
  type DebugViewStore,
  type MetricsStore,

  // Constants
  METRIC_ID_PREFIX,
  DEBUG_ENTRY_ID_PREFIX,
  METRIC_CATEGORIES,
  METRIC_SEVERITIES,
  DEBUG_LEVELS,

  // ID Generation
  generateMetricId,
  generateDebugEntryId,
  isValidMetricId,
  isValidDebugEntryId,

  // Metric Point Functions
  createMetricPoint,
  calculateMetricAggregation,

  // Runtime Metric Functions
  createRuntimeMetric,
  addMetricPoint,
  addMetricPoints,

  // Metrics Summary Functions
  createEmptyLatencyMetrics,
  createEmptySuccessMetrics,
  createEmptyRetryMetrics,
  createEmptyConfirmationMetrics,
  createRuntimeMetricsSummary,
  updateLatencyMetrics,
  updateSuccessMetrics,
  updateRetryMetrics,
  updateConfirmationMetrics,
  addCustomMetric,

  // Debug View Functions
  createDebugEntry,
  createDebugViewStore,
  addDebugEntry,
  getDebugEntry,
  queryDebugEntries,
  getSessionDebugEntries,
  getTraceDebugEntries,
  getEntriesByLevel,

  // Metrics Store Functions
  createMetricsStore,
  addMetric,
  getMetric,
  getSessionMetrics,
  getMetricsByCategory,

  // Serialization
  serializeRuntimeMetric,
  deserializeRuntimeMetric,
  serializeMetricsStore,
  deserializeMetricsStore,
  serializeDebugEntry,
  deserializeDebugEntry,
  serializeDebugViewStore,
  deserializeDebugViewStore,

  // Debug Formatting
  formatRuntimeMetric,
  formatDebugEntry,
  formatMetricsSummary
} from '@/features/session/runtime/runtimeMetrics'

describe('Runtime Metrics and Debug View', () => {
  // ============================================================================
  // ID Generation
  // ============================================================================

  describe('generateMetricId', () => {
    it('should generate a valid metric ID', () => {
      const metricId = generateMetricId()
      expect(metricId).toMatch(/^metric_\d+_[a-f0-9]{16}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateMetricId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('generateDebugEntryId', () => {
    it('should generate a valid debug entry ID', () => {
      const entryId = generateDebugEntryId()
      expect(entryId).toMatch(/^debug_\d+_[a-f0-9]{8}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateDebugEntryId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('isValidMetricId', () => {
    it('should validate correct metric IDs', () => {
      const metricId = generateMetricId()
      expect(isValidMetricId(metricId)).toBe(true)
    })

    it('should reject invalid metric IDs', () => {
      expect(isValidMetricId('invalid')).toBe(false)
      expect(isValidMetricId('metric_invalid')).toBe(false)
      expect(isValidMetricId('')).toBe(false)
    })
  })

  describe('isValidDebugEntryId', () => {
    it('should validate correct debug entry IDs', () => {
      const entryId = generateDebugEntryId()
      expect(isValidDebugEntryId(entryId)).toBe(true)
    })

    it('should reject invalid debug entry IDs', () => {
      expect(isValidDebugEntryId('invalid')).toBe(false)
      expect(isValidDebugEntryId('debug_invalid')).toBe(false)
      expect(isValidDebugEntryId('')).toBe(false)
    })
  })

  // ============================================================================
  // Metric Point Functions
  // ============================================================================

  describe('createMetricPoint', () => {
    it('should create a metric point with value', () => {
      const point = createMetricPoint(42)
      expect(point.value).toBe(42)
      expect(point.timestamp).toBeGreaterThan(0)
      expect(point.tags).toBeUndefined()
    })

    it('should create a metric point with tags', () => {
      const point = createMetricPoint(100, { env: 'test', region: 'us-east' })
      expect(point.value).toBe(100)
      expect(point.tags).toEqual({ env: 'test', region: 'us-east' })
    })
  })

  describe('calculateMetricAggregation', () => {
    it('should return empty aggregation for no points', () => {
      const agg = calculateMetricAggregation([])
      expect(agg.count).toBe(0)
      expect(agg.sum).toBe(0)
      expect(agg.avg).toBe(0)
    })

    it('should calculate aggregation for single point', () => {
      const points = [createMetricPoint(100)]
      const agg = calculateMetricAggregation(points)

      expect(agg.count).toBe(1)
      expect(agg.sum).toBe(100)
      expect(agg.min).toBe(100)
      expect(agg.max).toBe(100)
      expect(agg.avg).toBe(100)
    })

    it('should calculate aggregation for multiple points', () => {
      const points = [
        createMetricPoint(10),
        createMetricPoint(20),
        createMetricPoint(30),
        createMetricPoint(40),
        createMetricPoint(50)
      ]
      const agg = calculateMetricAggregation(points)

      expect(agg.count).toBe(5)
      expect(agg.sum).toBe(150)
      expect(agg.min).toBe(10)
      expect(agg.max).toBe(50)
      expect(agg.avg).toBe(30)
    })

    it('should calculate percentiles', () => {
      // Create 100 points from 1 to 100
      const points = Array.from({ length: 100 }, (_, i) => createMetricPoint(i + 1))
      const agg = calculateMetricAggregation(points)

      // P50 at index 50 = value 51, P95 at index 95 = value 96, P99 at index 99 = value 100
      expect(agg.p50).toBe(51)
      expect(agg.p95).toBe(96)
      expect(agg.p99).toBe(100)
    })
  })

  // ============================================================================
  // Runtime Metric Functions
  // ============================================================================

  describe('createRuntimeMetric', () => {
    it('should create a runtime metric with defaults', () => {
      const metric = createRuntimeMetric('response_time', 'performance', 'ms')

      expect(isValidMetricId(metric.metricId)).toBe(true)
      expect(metric.name).toBe('response_time')
      expect(metric.category).toBe('performance')
      expect(metric.unit).toBe('ms')
      expect(metric.severity).toBe('info')
      expect(metric.points).toEqual([])
      expect(metric.aggregation).toBeUndefined()
    })

    it('should create a runtime metric with all options', () => {
      const initialPoint = createMetricPoint(100)
      const metric = createRuntimeMetric('error_rate', 'reliability', '%', {
        description: 'Error rate percentage',
        severity: 'warning',
        initialPoint
      })

      expect(metric.description).toBe('Error rate percentage')
      expect(metric.severity).toBe('warning')
      expect(metric.points).toHaveLength(1)
      expect(metric.aggregation).toBeDefined()
    })
  })

  describe('addMetricPoint', () => {
    it('should add a point to a metric', () => {
      let metric = createRuntimeMetric('latency', 'performance', 'ms')
      const point = createMetricPoint(50)

      metric = addMetricPoint(metric, point)

      expect(metric.points).toHaveLength(1)
      expect(metric.points[0]).toEqual(point)
      expect(metric.aggregation).toBeDefined()
    })

    it('should update aggregation when adding points', () => {
      let metric = createRuntimeMetric('latency', 'performance', 'ms')

      metric = addMetricPoint(metric, createMetricPoint(100))
      expect(metric.aggregation?.avg).toBe(100)

      metric = addMetricPoint(metric, createMetricPoint(200))
      expect(metric.aggregation?.avg).toBe(150)
    })
  })

  describe('addMetricPoints', () => {
    it('should add multiple points to a metric', () => {
      let metric = createRuntimeMetric('latency', 'performance', 'ms')
      const points = [createMetricPoint(10), createMetricPoint(20), createMetricPoint(30)]

      metric = addMetricPoints(metric, points)

      expect(metric.points).toHaveLength(3)
    })
  })

  // ============================================================================
  // Metrics Summary Functions
  // ============================================================================

  describe('createEmptyLatencyMetrics', () => {
    it('should create empty latency metrics', () => {
      const metrics = createEmptyLatencyMetrics()

      expect(metrics.totalOperations).toBe(0)
      expect(metrics.averageLatencyMs).toBe(0)
      expect(metrics.timeoutCount).toBe(0)
    })
  })

  describe('createEmptySuccessMetrics', () => {
    it('should create empty success metrics', () => {
      const metrics = createEmptySuccessMetrics()

      expect(metrics.totalOperations).toBe(0)
      expect(metrics.successRate).toBe(0)
      expect(metrics.failureRate).toBe(0)
    })
  })

  describe('createEmptyRetryMetrics', () => {
    it('should create empty retry metrics', () => {
      const metrics = createEmptyRetryMetrics()

      expect(metrics.totalRetries).toBe(0)
      expect(metrics.retrySuccessRate).toBe(0)
    })
  })

  describe('createEmptyConfirmationMetrics', () => {
    it('should create empty confirmation metrics', () => {
      const metrics = createEmptyConfirmationMetrics()

      expect(metrics.totalConfirmations).toBe(0)
      expect(metrics.approvalRate).toBe(0)
    })
  })

  describe('createRuntimeMetricsSummary', () => {
    it('should create a metrics summary', () => {
      const summary = createRuntimeMetricsSummary('session-1')

      expect(summary.sessionId).toBe('session-1')
      expect(summary.traceId).toBeUndefined()
      expect(summary.latency).toBeDefined()
      expect(summary.success).toBeDefined()
      expect(summary.retry).toBeDefined()
      expect(summary.confirmation).toBeDefined()
      expect(summary.customMetrics.size).toBe(0)
    })

    it('should create a metrics summary with trace ID', () => {
      const summary = createRuntimeMetricsSummary('session-1', { traceId: 'trace-1' })

      expect(summary.traceId).toBe('trace-1')
    })
  })

  describe('updateLatencyMetrics', () => {
    it('should update latency metrics with new operation', () => {
      let metrics = createEmptyLatencyMetrics()
      metrics = updateLatencyMetrics(metrics, 100)

      expect(metrics.totalOperations).toBe(1)
      expect(metrics.averageLatencyMs).toBe(100)
      expect(metrics.minLatencyMs).toBe(100)
      expect(metrics.maxLatencyMs).toBe(100)
    })

    it('should track timeouts', () => {
      let metrics = createEmptyLatencyMetrics()
      metrics = updateLatencyMetrics(metrics, 30000, true)

      expect(metrics.timeoutCount).toBe(1)
    })

    it('should calculate average across multiple operations', () => {
      let metrics = createEmptyLatencyMetrics()
      metrics = updateLatencyMetrics(metrics, 100)
      metrics = updateLatencyMetrics(metrics, 200)
      metrics = updateLatencyMetrics(metrics, 300)

      expect(metrics.totalOperations).toBe(3)
      expect(metrics.averageLatencyMs).toBe(200)
    })
  })

  describe('updateSuccessMetrics', () => {
    it('should update success metrics for success', () => {
      let metrics = createEmptySuccessMetrics()
      metrics = updateSuccessMetrics(metrics, true)

      expect(metrics.totalOperations).toBe(1)
      expect(metrics.successCount).toBe(1)
      expect(metrics.successRate).toBe(1)
    })

    it('should update success metrics for failure', () => {
      let metrics = createEmptySuccessMetrics()
      metrics = updateSuccessMetrics(metrics, false)

      expect(metrics.failureCount).toBe(1)
      expect(metrics.failureRate).toBe(1)
    })

    it('should update success metrics for partial success', () => {
      let metrics = createEmptySuccessMetrics()
      metrics = updateSuccessMetrics(metrics, true, true)

      expect(metrics.partialSuccessCount).toBe(1)
    })
  })

  describe('updateRetryMetrics', () => {
    it('should update retry metrics for success', () => {
      let metrics = createEmptyRetryMetrics()
      metrics = updateRetryMetrics(metrics, true)

      expect(metrics.totalRetries).toBe(1)
      expect(metrics.successfulRetries).toBe(1)
      expect(metrics.retrySuccessRate).toBe(1)
    })

    it('should update retry metrics for failure', () => {
      let metrics = createEmptyRetryMetrics()
      metrics = updateRetryMetrics(metrics, false)

      expect(metrics.failedRetries).toBe(1)
    })

    it('should track exhausted retries', () => {
      let metrics = createEmptyRetryMetrics()
      metrics = updateRetryMetrics(metrics, null, true)

      expect(metrics.exhaustedRetries).toBe(1)
    })
  })

  describe('updateConfirmationMetrics', () => {
    it('should update confirmation metrics for approval', () => {
      let metrics = createEmptyConfirmationMetrics()
      metrics = updateConfirmationMetrics(metrics, true, 1000)

      expect(metrics.totalConfirmations).toBe(1)
      expect(metrics.approvedConfirmations).toBe(1)
      expect(metrics.approvalRate).toBe(1)
      expect(metrics.averageConfirmationTimeMs).toBe(1000)
    })

    it('should update confirmation metrics for rejection', () => {
      let metrics = createEmptyConfirmationMetrics()
      metrics = updateConfirmationMetrics(metrics, false)

      expect(metrics.rejectedConfirmations).toBe(1)
    })

    it('should track timed out confirmations', () => {
      let metrics = createEmptyConfirmationMetrics()
      metrics = updateConfirmationMetrics(metrics, null)

      expect(metrics.timedOutConfirmations).toBe(1)
    })
  })

  // ============================================================================
  // Debug View Functions
  // ============================================================================

  describe('createDebugEntry', () => {
    it('should create a debug entry', () => {
      const entry = createDebugEntry('info', 'runtime', 'Operation completed')

      expect(isValidDebugEntryId(entry.entryId)).toBe(true)
      expect(entry.level).toBe('info')
      expect(entry.category).toBe('runtime')
      expect(entry.message).toBe('Operation completed')
      expect(entry.timestamp).toBeGreaterThan(0)
    })

    it('should create a debug entry with all options', () => {
      const entry = createDebugEntry('error', 'tool', 'Tool failed', {
        details: { toolName: 'testTool', error: 'Network timeout' },
        traceId: 'trace-1',
        sessionId: 'session-1',
        stepId: 'step-1'
      })

      expect(entry.details).toEqual({ toolName: 'testTool', error: 'Network timeout' })
      expect(entry.traceId).toBe('trace-1')
      expect(entry.sessionId).toBe('session-1')
      expect(entry.stepId).toBe('step-1')
    })
  })

  describe('createDebugViewStore', () => {
    it('should create an empty debug view store', () => {
      const store = createDebugViewStore()

      expect(store.entries.size).toBe(0)
      expect(store.sessionIndex.size).toBe(0)
      expect(store.traceIndex.size).toBe(0)
    })
  })

  describe('addDebugEntry', () => {
    it('should add an entry to the store', () => {
      const store = createDebugViewStore()
      const entry = createDebugEntry('info', 'runtime', 'Test', {
        sessionId: 'session-1',
        traceId: 'trace-1'
      })

      const newStore = addDebugEntry(store, entry)

      expect(newStore.entries.size).toBe(1)
      expect(newStore.sessionIndex.has('session-1')).toBe(true)
      expect(newStore.traceIndex.has('trace-1')).toBe(true)
    })

    it('should not modify original store', () => {
      const store = createDebugViewStore()
      const entry = createDebugEntry('info', 'runtime', 'Test')

      addDebugEntry(store, entry)

      expect(store.entries.size).toBe(0)
    })
  })

  describe('getDebugEntry', () => {
    it('should get an entry by ID', () => {
      const store = createDebugViewStore()
      const entry = createDebugEntry('info', 'runtime', 'Test')
      const currentStore = addDebugEntry(store, entry)

      const retrieved = getDebugEntry(currentStore, entry.entryId)

      expect(retrieved).toEqual(entry)
    })

    it('should return undefined for non-existent entry', () => {
      const store = createDebugViewStore()

      const retrieved = getDebugEntry(store, 'non-existent')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('queryDebugEntries', () => {
    let store: DebugViewStore
    let entry1: DebugViewEntry
    let entry2: DebugViewEntry
    let entry3: DebugViewEntry

    beforeEach(() => {
      store = createDebugViewStore()
      entry1 = createDebugEntry('info', 'runtime', 'Info message', { sessionId: 's1', traceId: 't1' })
      entry2 = createDebugEntry('error', 'tool', 'Error message', { sessionId: 's1', traceId: 't2' })
      entry3 = createDebugEntry('warn', 'runtime', 'Warning message', { sessionId: 's2', traceId: 't1' })

      let currentStore = addDebugEntry(store, entry1)
      currentStore = addDebugEntry(currentStore, entry2)
      store = addDebugEntry(currentStore, entry3)
    })

    it('should filter by session ID', () => {
      const entries = queryDebugEntries(store, { sessionId: 's1' })
      expect(entries).toHaveLength(2)
    })

    it('should filter by trace ID', () => {
      const entries = queryDebugEntries(store, { traceId: 't1' })
      expect(entries).toHaveLength(2)
    })

    it('should filter by level', () => {
      const entries = queryDebugEntries(store, { level: 'error' })
      expect(entries).toHaveLength(1)
      expect(entries[0].message).toBe('Error message')
    })

    it('should filter by multiple levels', () => {
      const entries = queryDebugEntries(store, { level: ['error', 'warn'] })
      expect(entries).toHaveLength(2)
    })

    it('should filter by category', () => {
      const entries = queryDebugEntries(store, { category: 'tool' })
      expect(entries).toHaveLength(1)
    })

    it('should filter by message contains', () => {
      const entries = queryDebugEntries(store, { messageContains: 'Error' })
      expect(entries).toHaveLength(1)
    })

    it('should apply pagination', () => {
      const entries = queryDebugEntries(store, { limit: 2 })
      expect(entries).toHaveLength(2)

      const entries2 = queryDebugEntries(store, { limit: 2, offset: 2 })
      expect(entries2).toHaveLength(1)
    })
  })

  describe('getSessionDebugEntries', () => {
    it('should get entries by session ID', () => {
      const store = createDebugViewStore()
      const entry1 = createDebugEntry('info', 'runtime', 'Test 1', { sessionId: 's1' })
      const entry2 = createDebugEntry('info', 'runtime', 'Test 2', { sessionId: 's1' })
      const entry3 = createDebugEntry('info', 'runtime', 'Test 3', { sessionId: 's2' })

      let currentStore = addDebugEntry(store, entry1)
      currentStore = addDebugEntry(currentStore, entry2)
      currentStore = addDebugEntry(currentStore, entry3)

      const entries = getSessionDebugEntries(currentStore, 's1')
      expect(entries).toHaveLength(2)
    })

    it('should return empty array for non-existent session', () => {
      const store = createDebugViewStore()
      const entries = getSessionDebugEntries(store, 'non-existent')
      expect(entries).toEqual([])
    })
  })

  describe('getTraceDebugEntries', () => {
    it('should get entries by trace ID', () => {
      const store = createDebugViewStore()
      const entry1 = createDebugEntry('info', 'runtime', 'Test 1', { traceId: 't1' })
      const entry2 = createDebugEntry('info', 'runtime', 'Test 2', { traceId: 't2' })

      let currentStore = addDebugEntry(store, entry1)
      currentStore = addDebugEntry(currentStore, entry2)

      const entries = getTraceDebugEntries(currentStore, 't1')
      expect(entries).toHaveLength(1)
    })
  })

  describe('getEntriesByLevel', () => {
    it('should get entries by level', () => {
      const store = createDebugViewStore()
      const entry1 = createDebugEntry('error', 'runtime', 'Error 1')
      const entry2 = createDebugEntry('error', 'runtime', 'Error 2')
      const entry3 = createDebugEntry('info', 'runtime', 'Info 1')

      let currentStore = addDebugEntry(store, entry1)
      currentStore = addDebugEntry(currentStore, entry2)
      currentStore = addDebugEntry(currentStore, entry3)

      const entries = getEntriesByLevel(currentStore, 'error')
      expect(entries).toHaveLength(2)
    })
  })

  // ============================================================================
  // Metrics Store Functions
  // ============================================================================

  describe('createMetricsStore', () => {
    it('should create an empty metrics store', () => {
      const store = createMetricsStore()

      expect(store.metrics.size).toBe(0)
      expect(store.sessionIndex.size).toBe(0)
      expect(store.categoryIndex.size).toBe(0)
    })
  })

  describe('addMetric', () => {
    it('should add a metric to the store', () => {
      const store = createMetricsStore()
      const metric = createRuntimeMetric('latency', 'performance', 'ms')

      const newStore = addMetric(store, 'session-1', metric)

      expect(newStore.metrics.size).toBe(1)
      expect(newStore.sessionIndex.has('session-1')).toBe(true)
      expect(newStore.categoryIndex.has('performance')).toBe(true)
    })
  })

  describe('getMetric', () => {
    it('should get a metric by ID', () => {
      const store = createMetricsStore()
      const metric = createRuntimeMetric('latency', 'performance', 'ms')
      const currentStore = addMetric(store, 'session-1', metric)

      const retrieved = getMetric(currentStore, metric.metricId)

      expect(retrieved).toEqual(metric)
    })

    it('should return undefined for non-existent metric', () => {
      const store = createMetricsStore()

      const retrieved = getMetric(store, 'non-existent')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('getSessionMetrics', () => {
    it('should get metrics by session', () => {
      const store = createMetricsStore()
      const metric1 = createRuntimeMetric('latency', 'performance', 'ms')
      const metric2 = createRuntimeMetric('errors', 'reliability', 'count')

      let currentStore = addMetric(store, 'session-1', metric1)
      currentStore = addMetric(currentStore, 'session-1', metric2)
      currentStore = addMetric(currentStore, 'session-2', createRuntimeMetric('other', 'custom', 'unit'))

      const metrics = getSessionMetrics(currentStore, 'session-1')

      expect(metrics).toHaveLength(2)
    })
  })

  describe('getMetricsByCategory', () => {
    it('should get metrics by category', () => {
      const store = createMetricsStore()
      const metric1 = createRuntimeMetric('latency', 'performance', 'ms')
      const metric2 = createRuntimeMetric('errors', 'reliability', 'count')
      const metric3 = createRuntimeMetric('throughput', 'performance', 'ops/s')

      let currentStore = addMetric(store, 'session-1', metric1)
      currentStore = addMetric(currentStore, 'session-1', metric2)
      currentStore = addMetric(currentStore, 'session-1', metric3)

      const metrics = getMetricsByCategory(currentStore, 'performance')

      expect(metrics).toHaveLength(2)
    })
  })

  // ============================================================================
  // Serialization
  // ============================================================================

  describe('serializeRuntimeMetric', () => {
    it('should serialize a metric to JSON', () => {
      const metric = createRuntimeMetric('latency', 'performance', 'ms')
      const serialized = serializeRuntimeMetric(metric)

      const parsed = JSON.parse(serialized)
      expect(parsed.metricId).toBe(metric.metricId)
      expect(parsed.name).toBe('latency')
    })
  })

  describe('deserializeRuntimeMetric', () => {
    it('should deserialize a metric from JSON', () => {
      const metric = createRuntimeMetric('latency', 'performance', 'ms')
      const serialized = serializeRuntimeMetric(metric)
      const deserialized = deserializeRuntimeMetric(serialized)

      expect(deserialized.metricId).toBe(metric.metricId)
      expect(deserialized.name).toBe('latency')
    })
  })

  describe('serializeMetricsStore', () => {
    it('should serialize a metrics store to JSON', () => {
      const store = createMetricsStore()
      const metric = createRuntimeMetric('latency', 'performance', 'ms')
      const currentStore = addMetric(store, 'session-1', metric)

      const serialized = serializeMetricsStore(currentStore)
      const parsed = JSON.parse(serialized)

      expect(parsed.metrics).toHaveLength(1)
    })
  })

  describe('deserializeMetricsStore', () => {
    it('should deserialize a metrics store from JSON', () => {
      const store = createMetricsStore()
      const metric = createRuntimeMetric('latency', 'performance', 'ms')
      const currentStore = addMetric(store, 'session-1', metric)

      const serialized = serializeMetricsStore(currentStore)
      const deserialized = deserializeMetricsStore(serialized)

      expect(deserialized.metrics.size).toBe(1)
      expect(deserialized.categoryIndex.size).toBe(1)
    })
  })

  describe('serializeDebugEntry', () => {
    it('should serialize a debug entry to JSON', () => {
      const entry = createDebugEntry('info', 'runtime', 'Test')
      const serialized = serializeDebugEntry(entry)

      const parsed = JSON.parse(serialized)
      expect(parsed.entryId).toBe(entry.entryId)
      expect(parsed.message).toBe('Test')
    })
  })

  describe('deserializeDebugEntry', () => {
    it('should deserialize a debug entry from JSON', () => {
      const entry = createDebugEntry('info', 'runtime', 'Test')
      const serialized = serializeDebugEntry(entry)
      const deserialized = deserializeDebugEntry(serialized)

      expect(deserialized.entryId).toBe(entry.entryId)
      expect(deserialized.message).toBe('Test')
    })
  })

  describe('serializeDebugViewStore', () => {
    it('should serialize a debug view store to JSON', () => {
      const store = createDebugViewStore()
      const entry = createDebugEntry('info', 'runtime', 'Test', { sessionId: 's1' })
      const currentStore = addDebugEntry(store, entry)

      const serialized = serializeDebugViewStore(currentStore)
      const parsed = JSON.parse(serialized)

      expect(parsed.entries).toHaveLength(1)
    })
  })

  describe('deserializeDebugViewStore', () => {
    it('should deserialize a debug view store from JSON', () => {
      const store = createDebugViewStore()
      const entry = createDebugEntry('info', 'runtime', 'Test', {
        sessionId: 's1',
        traceId: 't1'
      })
      const currentStore = addDebugEntry(store, entry)

      const serialized = serializeDebugViewStore(currentStore)
      const deserialized = deserializeDebugViewStore(serialized)

      expect(deserialized.entries.size).toBe(1)
      expect(deserialized.sessionIndex.size).toBe(1)
      expect(deserialized.traceIndex.size).toBe(1)
    })
  })

  // ============================================================================
  // Debug Formatting
  // ============================================================================

  describe('formatRuntimeMetric', () => {
    it('should format a metric for debugging', () => {
      let metric = createRuntimeMetric('latency', 'performance', 'ms', {
        description: 'Response latency'
      })
      metric = addMetricPoint(metric, createMetricPoint(100))
      metric = addMetricPoint(metric, createMetricPoint(200))

      const formatted = formatRuntimeMetric(metric)

      expect(formatted).toContain('Metric: latency')
      expect(formatted).toContain('Category: performance')
      expect(formatted).toContain('Points: 2')
      expect(formatted).toContain('Description: Response latency')
      expect(formatted).toContain('Aggregation:')
    })
  })

  describe('formatDebugEntry', () => {
    it('should format a debug entry for debugging', () => {
      const entry = createDebugEntry('error', 'tool', 'Tool failed', {
        details: { toolName: 'testTool' },
        sessionId: 's1',
        traceId: 't1'
      })

      const formatted = formatDebugEntry(entry)

      expect(formatted).toContain('[ERROR]')
      expect(formatted).toContain('tool: Tool failed')
      expect(formatted).toContain('Session: s1')
      expect(formatted).toContain('Trace: t1')
      expect(formatted).toContain('Details:')
    })
  })

  describe('formatMetricsSummary', () => {
    it('should format a metrics summary for debugging', () => {
      let summary = createRuntimeMetricsSummary('session-1')
      summary.latency = updateLatencyMetrics(summary.latency, 100)
      summary.success = updateSuccessMetrics(summary.success, true)
      summary.retry = updateRetryMetrics(summary.retry, true)
      summary.confirmation = updateConfirmationMetrics(summary.confirmation, true, 500)

      const formatted = formatMetricsSummary(summary)

      expect(formatted).toContain('Runtime Metrics Summary:')
      expect(formatted).toContain('Session: session-1')
      expect(formatted).toContain('Latency:')
      expect(formatted).toContain('Success:')
      expect(formatted).toContain('Retry:')
      expect(formatted).toContain('Confirmation:')
    })
  })
})
