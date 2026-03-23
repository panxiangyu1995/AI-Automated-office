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
  
  // Checkpoint Actions
  createCheckpoint: (params: CreateCheckpointParams) => Checkpoint
  deleteCheckpoint: (checkpointId: string) => void
  restoreCheckpoint: (checkpointId: string, mode: RestoreMode, previousMessageCount: number) => RestoreRecord | null
  archiveCheckpoint: (checkpointId: string) => void
  getSessionCheckpoints: (sessionId: string) => Checkpoint[]
  getLatestCheckpoint: (sessionId: string) => Checkpoint | null
  getRestoreHistory: (sessionId: string) => RestoreRecord[]
  
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
        set((state) => {
          const checkpoint = state.checkpoints[checkpointId]
          if (!checkpoint) return state
          
          // 从 checkpoints 中删除
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [sessionId]: _removed, ...remainingSessionBranches } = state.sessionBranches
          const typedRemainingSessionBranches: Record<string, string[]> = remainingSessionBranches
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // 持久化到 localStorage
      partialize: (state) => ({
        checkpoints: state.checkpoints,
        sessionCheckpoints: state.sessionCheckpoints,
        restoreHistory: state.restoreHistory,
        branches: state.branches,
        sessionBranches: state.sessionBranches,
        activeBranches: state.activeBranches,
        autoCheckpointEnabled: state.autoCheckpointEnabled,
        maxCheckpointsPerSession: state.maxCheckpointsPerSession,
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

// ==================== Export ====================

export default useCheckpointStore
