/**
 * Streaming Runtime - Export Barrel
 * Task 62: Story 43.3 - Streaming Output and Status Sync
 */

// Runtime Events
export type {
  RuntimeEventType,
  RuntimeEvent,
  RuntimeEventListener,
  RuntimeEventEmitterConfig,
} from './runtimeEvents'
export {
  RuntimeEventEmitter,
  createRuntimeEventEmitter,
  eventToStreamChunk,
  filterEventsByType,
  filterEventsByMessage,
} from './runtimeEvents'

// Sync Engine
export type {
  SyncStatus,
  SyncState,
  SyncStats,
  StreamChunkConsumer,
  SyncStateListener,
  ConsumerRegistration,
  SyncEngineConfig,
} from './syncEngine'
export {
  SyncEngine,
  createSyncEngine,
  createMessageSnapshot,
  syncSerializedMessages,
} from './syncEngine'

// Reconnect Handler
export type {
  ReconnectStatus,
  ReconnectAttempt,
  ReconnectState,
  ReconnectConfig,
  ReconnectStateListener,
  EventStorage,
} from './reconnectHandler'
export {
  ReconnectHandler,
  InMemoryEventStorage,
  createReconnectHandler,
  calculateRetryDelay,
  isReconnectNeeded,
  getEventsToReplay,
  persistReconnectState,
  restoreReconnectState,
} from './reconnectHandler'

// Streaming Host Context (React hooks - from tsx file)
export type {
  StreamingContextValue,
  StreamingProviderProps,
} from './streamingHostContext.tsx'
export {
  StreamingProvider,
  useStreamingContext,
  useStreamingState,
  useStreamChunks,
  useRuntimeEvents,
  useStreamingStats,
  useStreamingControl,
  useReconnectState,
  useMessageStream,
  usePartStream,
  createWorkbenchStreamingContext,
  createDashboardStreamingContext,
} from './streamingHostContext.tsx'
