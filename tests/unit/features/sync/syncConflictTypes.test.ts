/**
 * Sync Conflict Dialog 单元测试
 * 覆盖：类型定义、冲突解决策略
 */

import { describe, it, expect } from 'vitest'
import type {
  ConflictResolutionStrategy,
  ConflictField,
  SyncConflict,
  ConflictResolutionResult,
} from '@/features/sync/types'

describe('Sync Conflict Types', () => {
  describe('ConflictResolutionStrategy', () => {
    it('should have 5 strategies', () => {
      const strategies: ConflictResolutionStrategy[] = [
        'keep-local',
        'keep-remote',
        'keep-both',
        'merge',
        'last-write-wins',
      ]
      expect(strategies).toHaveLength(5)
    })

    it('should have automatic and manual strategies', () => {
      const automatic: ConflictResolutionStrategy[] = ['keep-local', 'keep-remote', 'last-write-wins']
      const manual: ConflictResolutionStrategy[] = ['keep-both', 'merge']

      expect(automatic).toHaveLength(3)
      expect(manual).toHaveLength(2)
    })
  })

  describe('ConflictField', () => {
    it('should track local and remote values with timestamps', () => {
      const field: ConflictField = {
        fieldName: 'name',
        fieldLabel: '姓名',
        localValue: '张三',
        remoteValue: '李四',
        localModifiedAt: '2024-01-15T10:00:00Z',
        remoteModifiedAt: '2024-01-15T11:00:00Z',
      }

      expect(field.localValue).not.toBe(field.remoteValue)
      expect(field.localModifiedAt).toBeDefined()
      expect(field.remoteModifiedAt).toBeDefined()
    })
  })

  describe('SyncConflict', () => {
    it('should contain entity info and conflicting fields', () => {
      const conflict: SyncConflict = {
        id: 'conflict-1',
        entityType: 'employee',
        entityId: 'emp-1',
        entityLabel: '员工: 张三',
        localModifiedAt: '2024-01-15T10:00:00Z',
        remoteModifiedAt: '2024-01-15T11:00:00Z',
        fields: [
          {
            fieldName: 'name',
            fieldLabel: '姓名',
            localValue: '张三',
            remoteValue: '李四',
            localModifiedAt: '2024-01-15T10:00:00Z',
            remoteModifiedAt: '2024-01-15T11:00:00Z',
          },
        ],
      }

      expect(conflict.fields).toHaveLength(1)
      expect(conflict.entityType).toBe('employee')
    })

    it('can have multiple conflicting fields', () => {
      const conflict: SyncConflict = {
        id: 'conflict-2',
        entityType: 'invoice',
        entityId: 'inv-1',
        entityLabel: '发票: FP-001',
        localModifiedAt: '2024-01-15T10:00:00Z',
        remoteModifiedAt: '2024-01-15T11:00:00Z',
        fields: [
          {
            fieldName: 'amount',
            fieldLabel: '金额',
            localValue: 10000,
            remoteValue: 12000,
            localModifiedAt: '2024-01-15T10:00:00Z',
            remoteModifiedAt: '2024-01-15T11:00:00Z',
          },
          {
            fieldName: 'taxAmount',
            fieldLabel: '税额',
            localValue: 1300,
            remoteValue: 1560,
            localModifiedAt: '2024-01-15T10:00:00Z',
            remoteModifiedAt: '2024-01-15T11:00:00Z',
          },
        ],
      }

      expect(conflict.fields).toHaveLength(2)
    })
  })

  describe('ConflictResolutionResult', () => {
    it('should record resolution with strategy and timestamp', () => {
      const result: ConflictResolutionResult = {
        conflictId: 'conflict-1',
        strategy: 'keep-local',
        resolvedAt: '2024-01-15T12:00:00Z',
      }

      expect(result.strategy).toBe('keep-local')
      expect(result.resolvedAt).toBeDefined()
      expect(result.resolvedFields).toBeUndefined()
    })

    it('merge strategy should include resolved fields', () => {
      const result: ConflictResolutionResult = {
        conflictId: 'conflict-1',
        strategy: 'merge',
        resolvedFields: { name: '张三(合并)' },
        resolvedAt: '2024-01-15T12:00:00Z',
      }

      expect(result.resolvedFields).toBeDefined()
      expect(result.resolvedFields!.name).toBe('张三(合并)')
    })
  })
})
