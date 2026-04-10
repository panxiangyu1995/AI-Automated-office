/**
 * useCheckpointStore - 检查点状态管理 Hook
 * Story 4.7 - 检查点自动创建
 * Story 4.8 - 检查点回滚功能
 * Story 4.9 - 检查点编辑重试功能
 * 
 * 管理会话检查点，支持在消息提交时自动创建检查点
 * 捕获会话元数据和工作状态，支持后续恢复
 * 支持多种恢复模式，记录恢复历史
 * 支持从检查点编辑重试，创建分支执行
 * 
 * 铁律合规：
 * - ARCH: 分层架构，复用消息模型
 * - ARCH-037: 使用 Zustand 进行状态管理
 * - NFR-23: 检查点可靠性
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== Types ====================

/**
 * 检查点类型
 */
export type CheckpointType = 'auto' | 'manual' | 'pre_action'

/**
 * 检查点状态
 */
export type CheckpointStatus = 'active' | 'restored' | 'archived'

/**
 * 保留标记类型
 */
export type RetentionType = 'none' | 'temporary' | 'permanent'

/**
 * 清理策略
 */
export interface CleanupPolicy {
  // 自动清理开关
  enabled: boolean
  // 保留天数
  retentionDays: number
  // 最大检查点数量（全局）
  maxTotalCheckpoints: number
  // 是否自动清理已恢复的检查点
  cleanupRestored: boolean
  // 清理间隔（天）
  cleanupIntervalDays: number
  // 上次清理时间
  lastCleanupAt?: number
}

/**
 * 恢复模式
 */
export type RestoreMode = 'conversation_only' | 'conversation_plus_content'

/**
 * 分支状态
 */
export type BranchStatus = 'active' | 'merged' | 'abandoned'

/**
 * 恢复记录
 */
export interface RestoreRecord {
  id: string
  checkpointId: string
  sessionId: string
  mode: RestoreMode
  restoredAt: number
  // 恢复前的状态（用于撤销）
  previousState: {
    messageCount: number
    hadWorkingState: boolean
  }
  // 恢复后的状态
  resultState: {
    messageCount: number
    restoredWorkingState: boolean
  }
  // 用户确认
  userConfirmed: boolean
}

/**
 * 分支记录 - 用于编辑重试
 */
export interface BranchRecord {
  id: string
  sessionId: string
  sourceCheckpointId: string
  // 分支名称/描述
  label: string
  // 原始消息内容（用于预填充编辑）
  originalMessage: string
  // 编辑后的消息内容
  editedMessage?: string
  // 分支状态
  status: BranchStatus
  // 创建时间
  createdAt: number
  // 分支的消息 ID 列表
  messageIds: string[]
  // 父分支 ID（用于嵌套分支）
  parentBranchId?: string
}

/**
 * 工作状态快照
 */
export interface WorkingStateSnapshot {
  // 表单数据
  formData?: Record<string, unknown>
  // 选中的项目/记录
  selectedItems?: string[]
  // 当前视图状态
  viewState?: {
    scrollPosition?: number
    expandedSections?: string[]
    activeTab?: string
  }
  // 自定义状态
  customState?: Record<string, unknown>
}

/**
 * 检查点元数据
 */
export interface CheckpointMetadata {
  // 消息 ID（触发检查点的消息）
  triggerMessageId: string
  // 用户角色/上下文
  userContext?: {
    department?: string
    role?: string
    permissions?: string[]
  }
  // 设备信息
  deviceInfo?: {
    platform?: string
    appVersion?: string
  }
  // 关联的实体
  relatedEntities?: {
    type: string
    id: string
    label?: string
  }[]
}

/**
 * 检查点
 */
export interface Checkpoint {
  id: string
  sessionId: string
  type: CheckpointType
  status: CheckpointStatus
  // 消息索引位置（检查点前的消息数量）
  messageIndex: number
  // 消息快照（检查点时的消息列表）
  messageSnapshot: {
    messageIds: string[]
    lastMessageContent?: string
  }
  // 工作状态快照
  workingState?: WorkingStateSnapshot
  // 元数据
  metadata: CheckpointMetadata
  // 时间戳
  createdAt: number
  // 恢复时间（如果已恢复）
  restoredAt?: number
  // 描述/标签
  label?: string
  // Git 元数据（Story 4.10）
  gitMetadata?: {
    commitSha?: string
    branch?: string
    hasUncommittedChanges?: boolean
  }
  // 保留标记（Story 4.11）
  retention?: {
    type: RetentionType
    markedAt?: number
    expiresAt?: number // 仅对 temporary 有效
    reason?: string
  }
}

/**
 * 检查点存储状态
 */
export interface CheckpointStoreState {
  // 检查点列表
  checkpoints: Record<string, Checkpoint>
  // 每个会话的检查点 ID 列表
  sessionCheckpoints: Record<string, string[]>
  // 恢复历史记录
  restoreHistory: RestoreRecord[]
  // 分支记录
  branches: Record<string, BranchRecord>
  // 每个会话的分支 ID 列表
  sessionBranches: Record<string, string[]>
  // 当前活跃分支（每个会话）
  activeBranches: Record<string, string>
  // 自动创建检查点设置
  autoCheckpointEnabled: boolean
  // 最大检查点数量（每个会话）
  maxCheckpointsPerSession: number
  // 清理策略（Story 4.11）
  cleanupPolicy: CleanupPolicy
  
  // Checkpoint Actions
  createCheckpoint: (params: CreateCheckpointParams) => Checkpoint
  deleteCheckpoint: (checkpointId: string) => boolean
  restoreCheckpoint: (checkpointId: string, mode: RestoreMode, previousMessageCount: number) => RestoreRecord | null
  archiveCheckpoint: (checkpointId: string) => void
  getSessionCheckpoints: (sessionId: string) => Checkpoint[]
  getLatestCheckpoint: (sessionId: string) => Checkpoint | null
  getRestoreHistory: (sessionId: string) => RestoreRecord[]
  
  // Retention Actions (Story 4.11)
  markRetention: (checkpointId: string, type: RetentionType, reason?: string, temporaryDays?: number) => void
  clearRetention: (checkpointId: string) => void
  getRetainedCheckpoints: () => Checkpoint[]
  batchDeleteCheckpoints: (checkpointIds: string[]) => { deleted: string[]; retained: string[] }
  
  // Cleanup Actions (Story 4.11)
  setCleanupPolicy: (policy: Partial<CleanupPolicy>) => void
  runCleanup: () => { deleted: string[]; retained: string[] }
  getExpiredCheckpoints: () => Checkpoint[]
  
  // Branch Actions (Story 4.9)
  createBranch: (params: CreateBranchParams) => BranchRecord
  updateBranch: (branchId: string, updates: Partial<BranchRecord>) => void
  abandonBranch: (branchId: string) => void
  mergeBranch: (branchId: string) => void
  getSessionBranches: (sessionId: string) => BranchRecord[]
  getActiveBranch: (sessionId: string) => BranchRecord | null
  getOriginalMessage: (checkpointId: string) => string | null
  
  // Settings
  setAutoCheckpointEnabled: (enabled: boolean) => void
  setMaxCheckpointsPerSession: (max: number) => void
  
  // Clear Actions
  clearSessionCheckpoints: (sessionId: string) => void
  clearAllCheckpoints: () => void
  clearRestoreHistory: (sessionId?: string) => void
  clearSessionBranches: (sessionId: string) => void
}

/**
 * 创建检查点参数
 */
export interface CreateCheckpointParams {
  sessionId: string
  type: CheckpointType
  messageIndex: number
  messageSnapshot: Checkpoint['messageSnapshot']
  workingState?: WorkingStateSnapshot
  metadata: CheckpointMetadata
  label?: string
}

/**
 * 恢复检查点参数
 */
export interface RestoreCheckpointParams {
  checkpointId: string
  mode: RestoreMode
  previousMessageCount: number
}

/**
 * 创建分支参数
 */
export interface CreateBranchParams {
  sessionId: string
  sourceCheckpointId: string
  originalMessage: string
  label?: string
  parentBranchId?: string
}

// ==================== Helper Functions ====================

function generateCheckpointId(): string {
  return `cp_${crypto.randomUUID()}`
}

function generateRestoreId(): string {
  return `restore_${crypto.randomUUID()}`
}

function generateBranchId(): string {
  return `branch_${crypto.randomUUID()}`
}

/**
 * 清理旧检查点，保持每个会话最多 N 个
 */
function pruneOldCheckpoints(
  checkpoints: Record<string, Checkpoint>,
  sessionCheckpoints: Record<string, string[]>,
  sessionId: string,
  maxCount: number
): { checkpoints: Record<string, Checkpoint>; sessionCheckpoints: Record<string, string[]> } {
  const sessionCpIds = sessionCheckpoints[sessionId] || []
  
  if (sessionCpIds.length <= maxCount) {
    return { checkpoints, sessionCheckpoints }
  }
  
  // 获取要删除的检查点 ID（最旧的）
  const toRemove = sessionCpIds.slice(0, sessionCpIds.length - maxCount)
  
  // 从 checkpoints 中删除
  const newCheckpoints = { ...checkpoints }
  toRemove.forEach(id => {
    delete newCheckpoints[id]
  })
  
  // 更新 sessionCheckpoints
  const newSessionCheckpoints = {
    ...sessionCheckpoints,
    [sessionId]: sessionCpIds.slice(toRemove.length),
  }
  
  return { checkpoints: newCheckpoints, sessionCheckpoints: newSessionCheckpoints }
}

// ==================== Initial State ====================

const initialState = {
  checkpoints: {},
  sessionCheckpoints: {},
  restoreHistory: [],
  branches: {},
  sessionBranches: {},
  activeBranches: {},
  autoCheckpointEnabled: true,
  maxCheckpointsPerSession: 10,
  cleanupPolicy: {
    enabled: true,
    retentionDays: 30,
    maxTotalCheckpoints: 100,
    cleanupRestored: false,
    cleanupIntervalDays: 7,
  } as CleanupPolicy,
}

// ==================== Store ====================

export const useCheckpointStore = create<CheckpointStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ==================== Create Checkpoint ====================
      
      createCheckpoint: (params: CreateCheckpointParams) => {
        const checkpointId = generateCheckpointId()
        const now = Date.now()
        
        const checkpoint: Checkpoint = {
          id: checkpointId,
          sessionId: params.sessionId,
          type: params.type,
          status: 'active',
          messageIndex: params.messageIndex,
          messageSnapshot: params.messageSnapshot,
          workingState: params.workingState,
          metadata: params.metadata,
          createdAt: now,
          label: params.label,
        }
        
        set((state) => {
          // 添加检查点
          const newCheckpoints = {
            ...state.checkpoints,
            [checkpointId]: checkpoint,
          }
          
          // 更新会话检查点列表
          const existingSessionCps = state.sessionCheckpoints[params.sessionId] || []
          const newSessionCheckpoints = {
            ...state.sessionCheckpoints,
            [params.sessionId]: [...existingSessionCps, checkpointId],
          }
          
          // 清理旧检查点
          const { checkpoints: prunedCheckpoints, sessionCheckpoints: prunedSessionCps } = 
            pruneOldCheckpoints(
              newCheckpoints,
              newSessionCheckpoints,
              params.sessionId,
              state.maxCheckpointsPerSession
            )
          
          return {
            checkpoints: prunedCheckpoints,
            sessionCheckpoints: prunedSessionCps,
          }
        })
        
        return checkpoint
      },
      
      // ==================== Delete Checkpoint ====================
      
      deleteCheckpoint: (checkpointId: string) => {
        const checkpoint = get().checkpoints[checkpointId]
        if (!checkpoint) return false
        
        // 检查保留标记
        if (checkpoint.retention?.type === 'permanent') {
          return false // 永久保留的检查点不能删除
        }
        
        set((state) => {
          // 从 checkpoints 中删除
          const { [checkpointId]: _deleted, ...remainingCheckpoints } = state.checkpoints
          
          // 从 sessionCheckpoints 中移除
          const sessionId = checkpoint.sessionId
          const sessionCpIds = state.sessionCheckpoints[sessionId] || []
          const newSessionCpIds = sessionCpIds.filter(id => id !== checkpointId)
          
          // 构建新的 sessionCheckpoints
          const newSessionCheckpoints: Record<string, string[]> = { ...state.sessionCheckpoints }
          if (newSessionCpIds.length > 0) {
            newSessionCheckpoints[sessionId] = newSessionCpIds
          } else {
            delete newSessionCheckpoints[sessionId]
          }
          
          return {
            checkpoints: remainingCheckpoints,
            sessionCheckpoints: newSessionCheckpoints,
          }
        })
        
        return true
      },
      
      // ==================== Restore Checkpoint ====================
      
      restoreCheckpoint: (checkpointId: string, mode: RestoreMode, previousMessageCount: number) => {
        const checkpoint = get().checkpoints[checkpointId]
        if (!checkpoint || checkpoint.status !== 'active') return null
        
        const restoreId = generateRestoreId()
        const now = Date.now()
        
        // 创建恢复记录
        const restoreRecord: RestoreRecord = {
          id: restoreId,
          checkpointId,
          sessionId: checkpoint.sessionId,
          mode,
          restoredAt: now,
          previousState: {
            messageCount: previousMessageCount,
            hadWorkingState: false, // 由调用方提供
          },
          resultState: {
            messageCount: checkpoint.messageIndex,
            restoredWorkingState: mode === 'conversation_plus_content' && !!checkpoint.workingState,
          },
          userConfirmed: true,
        }
        
        set((state) => {
          // 更新检查点状态
          const updatedCheckpoint: Checkpoint = {
            ...checkpoint,
            status: 'restored',
            restoredAt: now,
          }
          
          return {
            checkpoints: {
              ...state.checkpoints,
              [checkpointId]: updatedCheckpoint,
            },
            restoreHistory: [...state.restoreHistory, restoreRecord],
          }
        })
        
        return restoreRecord
      },
      
      // ==================== Archive Checkpoint ====================
      
      archiveCheckpoint: (checkpointId: string) => {
        set((state) => {
          const checkpoint = state.checkpoints[checkpointId]
          if (!checkpoint) return state
          
          const updatedCheckpoint: Checkpoint = {
            ...checkpoint,
            status: 'archived',
          }
          
          return {
            checkpoints: {
              ...state.checkpoints,
              [checkpointId]: updatedCheckpoint,
            },
          }
        })
      },
      
      // ==================== Retention Actions (Story 4.11) ====================
      
      markRetention: (checkpointId: string, type: RetentionType, reason?: string, temporaryDays?: number) => {
        set((state) => {
          const checkpoint = state.checkpoints[checkpointId]
          if (!checkpoint) return state
          
          const now = Date.now()
          let retention: Checkpoint['retention']
          
          if (type === 'none') {
            retention = undefined
          } else if (type === 'permanent') {
            retention = {
              type: 'permanent',
              markedAt: now,
              reason,
            }
          } else {
            // temporary
            const expiresAt = temporaryDays 
              ? now + temporaryDays * 24 * 60 * 60 * 1000
              : undefined
            retention = {
              type: 'temporary',
              markedAt: now,
              expiresAt,
              reason,
            }
          }
          
          const updatedCheckpoint: Checkpoint = {
            ...checkpoint,
            retention,
          }
          
          return {
            checkpoints: {
              ...state.checkpoints,
              [checkpointId]: updatedCheckpoint,
            },
          }
        })
      },
      
      clearRetention: (checkpointId: string) => {
        set((state) => {
          const checkpoint = state.checkpoints[checkpointId]
          if (!checkpoint || !checkpoint.retention) return state

          const { retention: _retention, ...rest } = checkpoint
          const updatedCheckpoint: Checkpoint = rest
          
          return {
            checkpoints: {
              ...state.checkpoints,
              [checkpointId]: updatedCheckpoint,
            },
          }
        })
      },
      
      getRetainedCheckpoints: () => {
        const state = get()
        return Object.values(state.checkpoints)
          .filter(cp => cp.retention && cp.retention.type !== 'none')
          .sort((a, b) => (b.retention?.markedAt || 0) - (a.retention?.markedAt || 0))
      },
      
      batchDeleteCheckpoints: (checkpointIds: string[]) => {
        const state = get()
        const deleted: string[] = []
        const retained: string[] = []
        
        checkpointIds.forEach(id => {
          const checkpoint = state.checkpoints[id]
          if (!checkpoint) return
          
          // 永久保留的不能删除
          if (checkpoint.retention?.type === 'permanent') {
            retained.push(id)
            return
          }
          
          // 临时保留的检查是否过期
          if (checkpoint.retention?.type === 'temporary' && checkpoint.retention.expiresAt) {
            if (Date.now() < checkpoint.retention.expiresAt) {
              retained.push(id)
              return
            }
          }
          
          // 可以删除
          get().deleteCheckpoint(id)
          deleted.push(id)
        })
        
        return { deleted, retained }
      },
      
      // ==================== Cleanup Actions (Story 4.11) ====================
      
      setCleanupPolicy: (policy: Partial<CleanupPolicy>) => {
        set((state) => ({
          cleanupPolicy: {
            ...state.cleanupPolicy,
            ...policy,
          },
        }))
      },
      
      runCleanup: () => {
        const state = get()
        const { cleanupPolicy } = state
        
        if (!cleanupPolicy.enabled) {
          return { deleted: [], retained: [] }
        }
        
        const now = Date.now()
        const cutoffTime = now - cleanupPolicy.retentionDays * 24 * 60 * 60 * 1000
        const expiredCheckpoints = get().getExpiredCheckpoints()
        const deleted: string[] = []
        const retained: string[] = []
        
        // 删除过期的检查点
        expiredCheckpoints.forEach(cp => {
          // 跳过保留标记的
          if (cp.retention?.type === 'permanent') {
            retained.push(cp.id)
            return
          }
          
          if (cp.retention?.type === 'temporary' && cp.retention.expiresAt) {
            if (now < cp.retention.expiresAt) {
              retained.push(cp.id)
              return
            }
          }
          
          // 跳过已恢复的（如果配置不清理）
          if (!cleanupPolicy.cleanupRestored && cp.status === 'restored') {
            retained.push(cp.id)
            return
          }
          
          // 检查是否超过保留时间
          if (cp.createdAt >= cutoffTime) {
            retained.push(cp.id)
            return
          }
          
          // 删除
          get().deleteCheckpoint(cp.id)
          deleted.push(cp.id)
        })
        
        // 检查是否超过最大数量
        const allCheckpoints = Object.values(state.checkpoints)
        if (allCheckpoints.length > cleanupPolicy.maxTotalCheckpoints) {
          // 按创建时间排序，删除最旧的
          const sortedByTime = allCheckpoints
            .filter(cp => !cp.retention?.type || cp.retention.type === 'none')
            .sort((a, b) => a.createdAt - b.createdAt)
          
          const toDeleteCount = allCheckpoints.length - cleanupPolicy.maxTotalCheckpoints
          for (let i = 0; i < toDeleteCount && i < sortedByTime.length; i++) {
            get().deleteCheckpoint(sortedByTime[i].id)
            deleted.push(sortedByTime[i].id)
          }
        }
        
        // 更新清理时间
        set((state) => ({
          cleanupPolicy: {
            ...state.cleanupPolicy,
            lastCleanupAt: now,
          },
        }))
        
        return { deleted, retained }
      },
      
      getExpiredCheckpoints: () => {
        const state = get()
        const { cleanupPolicy } = state
        
        if (!cleanupPolicy.enabled) return []
        
        const now = Date.now()
        const cutoffTime = now - cleanupPolicy.retentionDays * 24 * 60 * 60 * 1000
        
        return Object.values(state.checkpoints)
          .filter(cp => {
            // 永久保留的不算过期
            if (cp.retention?.type === 'permanent') return false
            
            // 临时保留的检查是否过期
            if (cp.retention?.type === 'temporary' && cp.retention.expiresAt) {
              if (now < cp.retention.expiresAt) return false
            }
            
            // 已恢复的根据配置
            if (!cleanupPolicy.cleanupRestored && cp.status === 'restored') {
              return false
            }
            
            return cp.createdAt < cutoffTime
          })
          .sort((a, b) => a.createdAt - b.createdAt)
      },
      
      // ==================== Query Actions ====================
      
      getSessionCheckpoints: (sessionId: string) => {
        const state = get()
        const cpIds = state.sessionCheckpoints[sessionId] || []
        return cpIds
          .map(id => state.checkpoints[id])
          .filter((cp): cp is Checkpoint => cp !== undefined)
          .sort((a, b) => b.createdAt - a.createdAt)
      },
      
      getLatestCheckpoint: (sessionId: string) => {
        const state = get()
        const cpIds = state.sessionCheckpoints[sessionId] || []
        if (cpIds.length === 0) return null
        
        // 按创建时间排序，取最新的
        const checkpoints = cpIds
          .map(id => state.checkpoints[id])
          .filter((cp): cp is Checkpoint => cp !== undefined && cp.status === 'active')
          .sort((a, b) => b.createdAt - a.createdAt)
        
        return checkpoints[0] || null
      },
      
      getRestoreHistory: (sessionId: string) => {
        const state = get()
        return state.restoreHistory
          .filter(record => record.sessionId === sessionId)
          .sort((a, b) => b.restoredAt - a.restoredAt)
      },
      
      // ==================== Settings ====================
      
      setAutoCheckpointEnabled: (enabled: boolean) => {
        set({ autoCheckpointEnabled: enabled })
      },
      
      setMaxCheckpointsPerSession: (max: number) => {
        set({ maxCheckpointsPerSession: Math.max(1, max) })
      },
      
      // ==================== Clear Actions ====================
      
      clearSessionCheckpoints: (sessionId: string) => {
        set((state) => {
          const cpIds = state.sessionCheckpoints[sessionId] || []
          const newCheckpoints = { ...state.checkpoints }
          
          cpIds.forEach(id => {
            delete newCheckpoints[id]
          })

          const { [sessionId]: _removed, ...remainingSessionCps } = state.sessionCheckpoints
          const typedRemainingSessionCps: Record<string, string[]> = remainingSessionCps
          
          return {
            checkpoints: newCheckpoints,
            sessionCheckpoints: typedRemainingSessionCps,
          }
        })
      },
      
      clearAllCheckpoints: () => {
        set({
          checkpoints: {},
          sessionCheckpoints: {},
          restoreHistory: [],
        })
      },
      
      clearRestoreHistory: (sessionId?: string) => {
        set((state) => {
          if (sessionId) {
            return {
              restoreHistory: state.restoreHistory.filter(r => r.sessionId !== sessionId),
            }
          }
          return { restoreHistory: [] }
        })
      },
      
      clearSessionBranches: (sessionId: string) => {
        set((state) => {
          const branchIds = state.sessionBranches[sessionId] || []
          const newBranches = { ...state.branches }
          
          branchIds.forEach(id => {
            delete newBranches[id]
          })

          const { [sessionId]: _removed, ...remainingSessionBranches } = state.sessionBranches
          const typedRemainingSessionBranches: Record<string, string[]> = remainingSessionBranches

          const { [sessionId]: _removedActive, ...remainingActiveBranches } = state.activeBranches
          const typedRemainingActiveBranches: Record<string, string> = remainingActiveBranches
          
          return {
            branches: newBranches,
            sessionBranches: typedRemainingSessionBranches,
            activeBranches: typedRemainingActiveBranches,
          }
        })
      },
      
      // ==================== Branch Actions (Story 4.9) ====================
      
      createBranch: (params: CreateBranchParams) => {
        const branchId = generateBranchId()
        const now = Date.now()
        
        const branch: BranchRecord = {
          id: branchId,
          sessionId: params.sessionId,
          sourceCheckpointId: params.sourceCheckpointId,
          label: params.label || `分支 ${now}`,
          originalMessage: params.originalMessage,
          status: 'active',
          createdAt: now,
          messageIds: [],
          parentBranchId: params.parentBranchId,
        }
        
        set((state) => {
          const sessionBranchIds = state.sessionBranches[params.sessionId] || []
          
          return {
            branches: {
              ...state.branches,
              [branchId]: branch,
            },
            sessionBranches: {
              ...state.sessionBranches,
              [params.sessionId]: [...sessionBranchIds, branchId],
            },
            activeBranches: {
              ...state.activeBranches,
              [params.sessionId]: branchId,
            },
          }
        })
        
        return branch
      },
      
      updateBranch: (branchId: string, updates: Partial<BranchRecord>) => {
        set((state) => {
          const branch = state.branches[branchId]
          if (!branch) return state
          
          return {
            branches: {
              ...state.branches,
              [branchId]: {
                ...branch,
                ...updates,
              },
            },
          }
        })
      },
      
      abandonBranch: (branchId: string) => {
        set((state) => {
          const branch = state.branches[branchId]
          if (!branch) return state
          
          const updatedBranch: BranchRecord = {
            ...branch,
            status: 'abandoned',
          }
          
          // 如果是当前活跃分支，清除活跃状态
          const activeBranchId = state.activeBranches[branch.sessionId]
          const newActiveBranches = activeBranchId === branchId
            ? { ...state.activeBranches }
            : state.activeBranches
          
          if (activeBranchId === branchId) {
            delete newActiveBranches[branch.sessionId]
          }
          
          return {
            branches: {
              ...state.branches,
              [branchId]: updatedBranch,
            },
            activeBranches: newActiveBranches,
          }
        })
      },
      
      mergeBranch: (branchId: string) => {
        set((state) => {
          const branch = state.branches[branchId]
          if (!branch) return state
          
          const updatedBranch: BranchRecord = {
            ...branch,
            status: 'merged',
          }
          
          // 如果是当前活跃分支，清除活跃状态
          const activeBranchId = state.activeBranches[branch.sessionId]
          const newActiveBranches = activeBranchId === branchId
            ? { ...state.activeBranches }
            : state.activeBranches
          
          if (activeBranchId === branchId) {
            delete newActiveBranches[branch.sessionId]
          }
          
          return {
            branches: {
              ...state.branches,
              [branchId]: updatedBranch,
            },
            activeBranches: newActiveBranches,
          }
        })
      },
      
      getSessionBranches: (sessionId: string) => {
        const state = get()
        const branchIds = state.sessionBranches[sessionId] || []
        return branchIds
          .map(id => state.branches[id])
          .filter((branch): branch is BranchRecord => branch !== undefined)
          .sort((a, b) => b.createdAt - a.createdAt)
      },
      
      getActiveBranch: (sessionId: string) => {
        const state = get()
        const branchId = state.activeBranches[sessionId]
        if (!branchId) return null
        return state.branches[branchId] || null
      },
      
      getOriginalMessage: (checkpointId: string) => {
        const state = get()
        const checkpoint = state.checkpoints[checkpointId]
        if (!checkpoint) return null
        return checkpoint.messageSnapshot.lastMessageContent || null
      },
    }),
    {
      name: 'checkpoint-store',
      // 安全说明：
      // 存储的数据包括：检查点元数据、会话映射、恢复历史、分支记录
      // 这些数据是应用程序正常功能所必需的，用于支持会话恢复和分支执行
      // 
      // 潜在敏感信息：
      // - messageSnapshot.lastMessageContent: 消息内容快照
      // - branches.originalMessage: 分支的原始消息
      // 
      // 安全措施：
      // 1. 这些数据存储在本地localStorage，不会上传到服务器
      // 2. 如果需要更高的安全性（如多用户共享设备），应使用Tauri secure storage
      // 3. 建议添加用户认证后加密存储
      partialize: (state) => ({
        checkpoints: state.checkpoints,
        sessionCheckpoints: state.sessionCheckpoints,
        restoreHistory: state.restoreHistory,
        branches: state.branches,
        sessionBranches: state.sessionBranches,
        activeBranches: state.activeBranches,
        autoCheckpointEnabled: state.autoCheckpointEnabled,
        maxCheckpointsPerSession: state.maxCheckpointsPerSession,
        cleanupPolicy: state.cleanupPolicy,
      }),
    }
  )
)

// ==================== Selector Hooks ====================

/**
 * 获取指定会话的检查点列表
 */
export function useSessionCheckpoints(sessionId: string): Checkpoint[] {
  return useCheckpointStore((state) => state.getSessionCheckpoints(sessionId))
}

/**
 * 获取指定会话的最新检查点
 */
export function useLatestCheckpoint(sessionId: string): Checkpoint | null {
  return useCheckpointStore((state) => state.getLatestCheckpoint(sessionId))
}

/**
 * 获取自动创建检查点设置
 */
export function useAutoCheckpointEnabled(): boolean {
  return useCheckpointStore((state) => state.autoCheckpointEnabled)
}

/**
 * 获取检查点总数
 */
export function useCheckpointCount(): number {
  return useCheckpointStore((state) => Object.keys(state.checkpoints).length)
}

/**
 * 获取指定会话的恢复历史
 */
export function useRestoreHistory(sessionId: string): RestoreRecord[] {
  return useCheckpointStore((state) => state.getRestoreHistory(sessionId))
}

/**
 * 获取所有恢复历史
 */
export function useAllRestoreHistory(): RestoreRecord[] {
  return useCheckpointStore((state) => state.restoreHistory)
}

/**
 * 获取指定会话的分支列表
 */
export function useSessionBranches(sessionId: string): BranchRecord[] {
  return useCheckpointStore((state) => state.getSessionBranches(sessionId))
}

/**
 * 获取指定会话的活跃分支
 */
export function useActiveBranch(sessionId: string): BranchRecord | null {
  return useCheckpointStore((state) => state.getActiveBranch(sessionId))
}

/**
 * 获取检查点的原始消息
 */
export function useOriginalMessage(checkpointId: string): string | null {
  return useCheckpointStore((state) => state.getOriginalMessage(checkpointId))
}

/**
 * 获取清理策略 (Story 4.11)
 */
export function useCleanupPolicy(): CleanupPolicy {
  return useCheckpointStore((state) => state.cleanupPolicy)
}

/**
 * 获取保留的检查点列表 (Story 4.11)
 */
export function useRetainedCheckpoints(): Checkpoint[] {
  return useCheckpointStore((state) => state.getRetainedCheckpoints())
}

/**
 * 获取过期的检查点列表 (Story 4.11)
 */
export function useExpiredCheckpoints(): Checkpoint[] {
  return useCheckpointStore((state) => state.getExpiredCheckpoints())
}

/**
 * 获取所有检查点（跨会话）(Story 4.11)
 */
export function useAllCheckpoints(): Checkpoint[] {
  return useCheckpointStore((state) => 
    Object.values(state.checkpoints).sort((a, b) => b.createdAt - a.createdAt)
  )
}

/**
 * 获取检查点统计信息 (Story 4.11)
 */
export function useCheckpointStats(): {
  total: number
  active: number
  restored: number
  archived: number
  retained: number
  expired: number
} {
  return useCheckpointStore((state) => {
    const checkpoints = Object.values(state.checkpoints)
    const now = Date.now()
    const cutoffTime = now - state.cleanupPolicy.retentionDays * 24 * 60 * 60 * 1000
    
    return {
      total: checkpoints.length,
      active: checkpoints.filter(cp => cp.status === 'active').length,
      restored: checkpoints.filter(cp => cp.status === 'restored').length,
      archived: checkpoints.filter(cp => cp.status === 'archived').length,
      retained: checkpoints.filter(cp => cp.retention && cp.retention.type !== 'none').length,
      expired: checkpoints.filter(cp => {
        if (cp.retention?.type === 'permanent') return false
        if (cp.retention?.type === 'temporary' && cp.retention.expiresAt && now < cp.retention.expiresAt) return false
        return cp.createdAt < cutoffTime
      }).length,
    }
  })
}

// ==================== Export ====================

export default useCheckpointStore
