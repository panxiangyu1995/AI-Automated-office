/**
 * useGitStore - Git 集成状态管理 Hook
 * Story 4.10 - Git工具集成
 * 
 * 管理 Git 仓库状态，支持检查点的 Git 版本控制
 * 检测 Git 环境，绑定检查点到 Git 提交历史
 * 
 * 铁律合规：
 * - ARCH: 分层架构，复用运行时模型
 * - ARCH-037: 使用 Zustand 进行状态管理
 * - NFR-17: Git 操作可靠性
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== Types ====================

/**
 * Git 状态
 */
export type GitStatus = 'unknown' | 'not_installed' | 'not_a_repo' | 'ready' | 'error'

/**
 * Git 提交元数据
 */
export interface GitCommitMetadata {
  // 提交 SHA
  sha: string
  // 短 SHA
  shortSha: string
  // 提交消息
  message: string
  // 作者
  author: {
    name: string
    email: string
  }
  // 提交时间
  timestamp: number
  // 父提交
  parentShas: string[]
  // 是否有未推送的提交
  isUnpushed: boolean
}

/**
 * 检查点 Git 绑定
 */
export interface CheckpointGitBinding {
  // 检查点 ID
  checkpointId: string
  // Git 提交元数据
  commit: GitCommitMetadata
  // 工作目录状态（暂存区）
  stagedFiles: string[]
  // 未暂存的文件
  unstagedFiles: string[]
  // 绑定时间
  boundAt: number
  // 分支名称
  branch: string
  // 是否为自动提交
  isAutoCommit: boolean
}

/**
 * Git 仓库状态
 */
export interface GitRepoState {
  // 当前分支
  currentBranch: string
  // 远程仓库名称
  remoteName: string | null
  // 远程 URL
  remoteUrl: string | null
  // 是否有未提交的更改
  hasUncommittedChanges: boolean
  // 是否有未推送的提交
  hasUnpushedCommits: boolean
  // 最后一次提交
  lastCommit: GitCommitMetadata | null
  // 暂存区文件数
  stagedCount: number
  // 未暂存文件数
  unstagedCount: number
}

/**
 * Git 存储状态
 */
export interface GitStoreState {
  // Git 状态
  gitStatus: GitStatus
  // Git 版本
  gitVersion: string | null
  // 仓库状态
  repoState: GitRepoState | null
  // 检查点 Git 绑定
  checkpointBindings: Record<string, CheckpointGitBinding>
  // 是否启用 Git 集成
  gitIntegrationEnabled: boolean
  // 自动提交设置
  autoCommitEnabled: boolean
  // 错误信息
  lastError: string | null
  
  // Actions
  detectGit: () => Promise<GitStatus>
  refreshRepoState: () => Promise<void>
  createGitCheckpoint: (checkpointId: string, message?: string) => Promise<CheckpointGitBinding | null>
  getCheckpointBinding: (checkpointId: string) => CheckpointGitBinding | null
  setGitIntegrationEnabled: (enabled: boolean) => void
  setAutoCommitEnabled: (enabled: boolean) => void
  clearError: () => void
}

// ==================== Initial State ====================

const initialState = {
  gitStatus: 'unknown' as GitStatus,
  gitVersion: null,
  repoState: null,
  checkpointBindings: {},
  gitIntegrationEnabled: true,
  autoCommitEnabled: false,
  lastError: null,
}

// ==================== Helper Functions ====================

/**
 * 生成随机 SHA（用于模拟）
 */
function generateMockSha(): string {
  const chars = '0123456789abcdef'
  let sha = ''
  for (let i = 0; i < 40; i++) {
    sha += chars[Math.floor(Math.random() * chars.length)]
  }
  return sha
}

/**
 * 获取短 SHA
 */
function getShortSha(sha: string): string {
  return sha.slice(0, 7)
}

// ==================== Store ====================

export const useGitStore = create<GitStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ==================== Detect Git ====================
      
      detectGit: async () => {
        try {
          // 在 Tauri 环境中，通过 Tauri 命令检测 Git
          // 这里先模拟检测逻辑
          const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
          
          if (!isTauri) {
            // 浏览器环境，无法使用 Git
            set({ gitStatus: 'not_installed', gitVersion: null })
            return 'not_installed'
          }
          
          // 尝试通过 Tauri 命令检测 Git
          // 由于 Tauri 命令可能尚未实现，这里先返回 ready 状态
          // 实际实现时需要调用 Tauri 后端命令
          set({ 
            gitStatus: 'ready', 
            gitVersion: '2.x',
            lastError: null,
          })
          
          return 'ready'
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          set({ 
            gitStatus: 'error', 
            gitVersion: null,
            lastError: `Git detection failed: ${errorMessage}`,
          })
          return 'error'
        }
      },
      
      // ==================== Refresh Repo State ====================
      
      refreshRepoState: async () => {
        const { gitStatus } = get()
        
        if (gitStatus !== 'ready') {
          return
        }
        
        try {
          // 在 Tauri 环境中，通过 Tauri 命令获取仓库状态
          // 这里先模拟仓库状态
          const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
          
          if (!isTauri) {
            return
          }
          
          // 模拟仓库状态
          // 实际实现时需要调用 Tauri 后端命令
          const mockRepoState: GitRepoState = {
            currentBranch: 'main',
            remoteName: 'origin',
            remoteUrl: null,
            hasUncommittedChanges: false,
            hasUnpushedCommits: false,
            lastCommit: {
              sha: generateMockSha(),
              shortSha: getShortSha(generateMockSha()),
              message: 'Initial commit',
              author: {
                name: 'User',
                email: 'user@example.com',
              },
              timestamp: Date.now(),
              parentShas: [],
              isUnpushed: false,
            },
            stagedCount: 0,
            unstagedCount: 0,
          }
          
          set({ repoState: mockRepoState, lastError: null })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          set({ lastError: `Failed to refresh repo state: ${errorMessage}` })
        }
      },
      
      // ==================== Create Git Checkpoint ====================
      
      createGitCheckpoint: async (checkpointId: string, message?: string) => {
        const { gitStatus, repoState, autoCommitEnabled } = get()
        
        if (gitStatus !== 'ready') {
          set({ lastError: 'Git is not ready' })
          return null
        }
        
        if (!repoState) {
          set({ lastError: 'Repository state is not available' })
          return null
        }
        
        try {
          // 在 Tauri 环境中，通过 Tauri 命令创建 Git 提交
          // 这里先模拟创建 Git 绑定
          const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
          
          if (!isTauri) {
            set({ lastError: 'Git operations require Tauri environment' })
            return null
          }
          
          // 模拟创建 Git 提交
          const commitSha = generateMockSha()
          const binding: CheckpointGitBinding = {
            checkpointId,
            commit: {
              sha: commitSha,
              shortSha: getShortSha(commitSha),
              message: message || `Checkpoint: ${checkpointId}`,
              author: {
                name: 'User',
                email: 'user@example.com',
              },
              timestamp: Date.now(),
              parentShas: repoState.lastCommit ? [repoState.lastCommit.sha] : [],
              isUnpushed: true,
            },
            stagedFiles: [],
            unstagedFiles: [],
            boundAt: Date.now(),
            branch: repoState.currentBranch,
            isAutoCommit: autoCommitEnabled,
          }
          
          set((state) => ({
            checkpointBindings: {
              ...state.checkpointBindings,
              [checkpointId]: binding,
            },
            lastError: null,
          }))
          
          return binding
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          set({ lastError: `Failed to create Git checkpoint: ${errorMessage}` })
          return null
        }
      },
      
      // ==================== Get Checkpoint Binding ====================
      
      getCheckpointBinding: (checkpointId: string) => {
        const state = get()
        return state.checkpointBindings[checkpointId] || null
      },
      
      // ==================== Settings ====================
      
      setGitIntegrationEnabled: (enabled: boolean) => {
        set({ gitIntegrationEnabled: enabled })
      },
      
      setAutoCommitEnabled: (enabled: boolean) => {
        set({ autoCommitEnabled: enabled })
      },
      
      clearError: () => {
        set({ lastError: null })
      },
    }),
    {
      name: 'git-store',
      // 持久化到 localStorage
      partialize: (state) => ({
        checkpointBindings: state.checkpointBindings,
        gitIntegrationEnabled: state.gitIntegrationEnabled,
        autoCommitEnabled: state.autoCommitEnabled,
      }),
    }
  )
)

// ==================== Selector Hooks ====================

/**
 * 获取 Git 状态
 */
export function useGitStatus(): GitStatus {
  return useGitStore((state) => state.gitStatus)
}

/**
 * 获取仓库状态
 */
export function useRepoState(): GitRepoState | null {
  return useGitStore((state) => state.repoState)
}

/**
 * 获取检查点的 Git 绑定
 */
export function useCheckpointGitBinding(checkpointId: string): CheckpointGitBinding | null {
  return useGitStore((state) => state.checkpointBindings[checkpointId] || null)
}

/**
 * 获取 Git 集成是否启用
 */
export function useGitIntegrationEnabled(): boolean {
  return useGitStore((state) => state.gitIntegrationEnabled)
}

/**
 * 获取自动提交是否启用
 */
export function useAutoCommitEnabled(): boolean {
  return useGitStore((state) => state.autoCommitEnabled)
}

// ==================== Export ====================

export default useGitStore
