/**
 * Sync Conflict Resolution Types
 *
 * Defines types for data synchronization conflict detection and resolution.
 * Based on Architecture ADR-003: Local-first + incremental sync + smart conflict resolution.
 * Based on PRD FR40: System can detect and handle data sync conflicts.
 * Based on PRD FR41: Users can choose which version to keep for conflicting data.
 */

/** Supported conflict resolution strategies */
export type ConflictResolutionStrategy =
  | 'keep-local'    // Keep the local version, discard remote
  | 'keep-remote'   // Keep the remote version, discard local
  | 'keep-both'     // Keep both versions (rename remote)
  | 'merge'         // Merge both versions manually
  | 'last-write-wins' // Automatic: use the most recently modified version

/** Represents a single conflicting field between local and remote versions */
export interface ConflictField {
  fieldName: string
  fieldLabel: string
  localValue: unknown
  remoteValue: unknown
  localModifiedAt: string
  remoteModifiedAt: string
}

/** Represents a sync conflict for a specific entity */
export interface SyncConflict {
  id: string
  entityType: string
  entityId: string
  entityLabel: string
  localModifiedAt: string
  remoteModifiedAt: string
  fields: ConflictField[]
}

/** Result of resolving a conflict */
export interface ConflictResolutionResult {
  conflictId: string
  strategy: ConflictResolutionStrategy
  resolvedFields?: Record<string, unknown>
  resolvedAt: string
}
