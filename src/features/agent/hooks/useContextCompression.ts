/**
 * useContextCompression - 上下文自动压缩 Hook
 * Story 4.12 - 上下文自动压缩
 *
 * 功能：
 * - 检测 token 阈值跨越
 * - 触发结构化摘要生成
 * - 近期历史保留
 * - 压缩输出存储到会话记忆
 *
 * 铁律合规：
 * - ARCH: 分层架构，复用消息模型
 * - ARCH-037: 使用 Zustand 进行状态管理
 * - ARCH-043/044: 记忆系统
 * - NFR8-1: Token 效率
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Message } from '../../message/runtime/messageModel'
import { getMessageText } from '../../message/runtime/messageModel'

// ==================== Types ====================

/**
 * 压缩状态
 */
export type CompressionStatus = 
  | 'idle'       // 空闲
  | 'pending'    // 等待压缩
  | 'compressing' // 压缩中
  | 'completed'  // 已完成
  | 'failed'     // 失败

/**
 * 阈值状态
 */
export type ThresholdStatus = 
  | 'normal'     // 正常
  | 'warning'    // 警告
  | 'critical'   // 临界
  | 'exceeded'   // 已超限

/**
 * 压缩策略
 */
export type CompressionStrategy = 
  | 'summary'     // 摘要模式：生成摘要替换历史
  | 'sliding'     // 滑动窗口：保留最近N条消息
  | 'hybrid'      // 混合模式：摘要+滑动窗口

/**
 * 压缩配置
 */
export interface CompressionConfig {
  // Token 阈值配置
  tokenThreshold: number          // 触发压缩的 token 阈值
  warningThreshold: number        // 警告阈值（百分比例 0-1）
  criticalThreshold: number       // 临界阈值（百分比例 0-1）
  
  // 压缩策略配置
  strategy: CompressionStrategy
  preserveRecentCount: number     // 保留最近消息数量
  preserveSystemMessages: boolean // 是否保留系统消息
  
  // 摘要配置
  summaryMaxTokens: number        // 摘要最大 token 数
  includeKeyFacts: boolean        // 是否包含关键事实
  
  // 自动压缩配置
  autoCompress: boolean           // 是否自动压缩
  compressionCooldown: number     // 压缩冷却时间（毫秒）
  
  // 调试配置
  debugMode: boolean              // 调试模式
}

/**
 * 压缩记录
 */
export interface CompressionRecord {
  id: string
  sessionId: string
  timestamp: number
  trigger: 'threshold' | 'manual' | 'scheduled'
  
  // 压缩前状态
  beforeTokenCount: number
  beforeMessageCount: number
  beforeMessageIds: string[]
  
  // 压缩后状态
  afterTokenCount: number
  afterMessageCount: number
  compressedMessageIds: string[]
  
  // 摘要内容
  summary?: string
  keyFacts?: string[]
  
  // 状态
  status: CompressionStatus
  duration?: number               // 压缩耗时（毫秒）
  error?: string
}

/**
 * Token 统计
 */
export interface TokenStats {
  total: number
  user: number
  assistant: number
  system: number
  byMessage: Record<string, number>
}

/**
 * 压缩会话状态
 */
export interface SessionCompressionState {
  sessionId: string
  currentTokens: number
  lastCompressedAt: number | null
  compressionCount: number
  thresholdStatus: ThresholdStatus
  compressionStatus: CompressionStatus
  pendingCompression: boolean
}

/**
 * Store 状态
 */
export interface ContextCompressionState {
  // 配置
  config: CompressionConfig
  
  // 会话压缩状态
  sessionStates: Record<string, SessionCompressionState>
  
  // 压缩历史
  compressionHistory: CompressionRecord[]
  
  // 全局状态
  isCompressing: boolean
  currentSessionId: string | null
  
  // 配置操作
  updateConfig: (config: Partial<CompressionConfig>) => void
  resetConfig: () => void
  
  // Token 计算操作
  estimateTokens: (text: string) => number
  calculateMessageTokens: (message: Message) => number
  calculateSessionTokens: (messages: Message[]) => TokenStats
  checkThreshold: (sessionId: string, messages: Message[]) => {
    status: 'normal' | 'warning' | 'critical' | 'exceeded'
    currentTokens: number
    threshold: number
    percentage: number
  }
  
  // 会话状态操作
  getSessionState: (sessionId: string) => SessionCompressionState | undefined
  updateSessionState: (sessionId: string, updates: Partial<SessionCompressionState>) => void
  
  // 压缩操作
  triggerCompression: (
    sessionId: string,
    messages: Message[],
    trigger?: 'threshold' | 'manual' | 'scheduled'
  ) => Promise<CompressionRecord>
  generateSummary: (messages: Message[]) => Promise<{
    summary: string
    keyFacts: string[]
  }>
  compressSession: (
    sessionId: string,
    messages: Message[],
    strategy?: CompressionStrategy
  ) => Promise<{
    keptMessages: Message[]
    summary: string
    keyFacts: string[]
    compressionRatio: number
  }>
  
  // 历史操作
  getCompressionHistory: (sessionId?: string) => CompressionRecord[]
  clearHistory: (sessionId?: string) => void
  
  // 重置
  reset: () => void
}

// ==================== Default Config ====================

const DEFAULT_CONFIG: CompressionConfig = {
  tokenThreshold: 8000,
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
  strategy: 'hybrid',
  preserveRecentCount: 6,
  preserveSystemMessages: true,
  summaryMaxTokens: 500,
  includeKeyFacts: true,
  autoCompress: true,
  compressionCooldown: 60000, // 1 分钟
  debugMode: false,
}

// ==================== Helper Functions ====================

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return crypto.randomUUID()
}

/**
 * 估算文本的 token 数量
 * 使用简单的启发式方法：平均每 4 个字符约 1 个 token
 * 中文约每 1.5 个字符约 1 个 token
 */
function estimateTokensSimple(text: string): number {
  if (!text) return 0
  
  // 检测中文内容比例
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
  
  // 根据中文比例调整估算
  const chineseTokens = chineseChars.length / 1.5
  const nonChineseTokens = (text.length - chineseChars.length) / 4
  
  return Math.ceil(chineseTokens + nonChineseTokens)
}

/**
 * 计算消息的 token 数量
 */
function calculateMessageTokensSimple(message: Message): number {
  const textContent = getMessageText(message)
  const baseTokens = estimateTokensSimple(textContent)
  
  // 添加消息结构开销
  const structureOverhead = 10
  
  // 添加角色前缀开销
  const roleOverhead = message.role.length / 2
  
  return Math.ceil(baseTokens + structureOverhead + roleOverhead)
}

/**
 * 从消息中提取关键事实
 */
function extractKeyFacts(messages: Message[]): string[] {
  const facts: string[] = []
  
  // 提取用户消息中的关键信息
  for (const message of messages) {
    if (message.role === 'user') {
      const text = getMessageText(message)
      
      // 检测是否包含事实性陈述
      const factPatterns = [
        /我(?:叫|是)\s*([^\s，。！？]+)/,
        /我的([^\s，。！？]+)(?:是|叫)\s*([^\s，。！？]+)/,
        /需要\s*([^\s，。！？]+)/,
        /要求\s*([^\s，。！？]+)/,
      ]
      
      for (const pattern of factPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          facts.push(matches[0])
        }
      }
    }
  }
  
  return [...new Set(facts)] // 去重
}

/**
 * 生成简单的摘要
 */
function generateSimpleSummary(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  
  const userTopics: string[] = []
  const assistantActions: string[] = []
  
  // 提取用户话题
  for (const msg of userMessages) {
    const text = getMessageText(msg)
    // 提取前50个字符作为话题
    const topic = text.slice(0, 50).trim()
    if (topic) {
      userTopics.push(topic)
    }
  }
  
  // 提取助手行为
  for (const msg of assistantMessages) {
    const text = getMessageText(msg)
    // 提取前50个字符作为行为描述
    const action = text.slice(0, 50).trim()
    if (action) {
      assistantActions.push(action)
    }
  }
  
  // 生成摘要
  const parts: string[] = []
  
  if (userTopics.length > 0) {
    parts.push(`用户讨论了 ${userTopics.length} 个话题，包括："${userTopics[0]}..."`)
  }
  
  if (assistantActions.length > 0) {
    parts.push(`助手提供了 ${assistantActions.length} 次回应`)
  }
  
  parts.push(`共 ${messages.length} 条消息被压缩`)
  
  return parts.join('。')
}

// ==================== Store ====================

export const useContextCompression = create<ContextCompressionState>()(
  persist(
    (set, get) => ({
      // 初始状态
      config: DEFAULT_CONFIG,
      sessionStates: {},
      compressionHistory: [],
      isCompressing: false,
      currentSessionId: null,
      
      // ==================== 配置操作 ====================
      
      updateConfig: (updates: Partial<CompressionConfig>) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }))
      },
      
      resetConfig: () => {
        set({ config: DEFAULT_CONFIG })
      },
      
      // ==================== Token 计算操作 ====================
      
      estimateTokens: (text: string): number => {
        return estimateTokensSimple(text)
      },
      
      calculateMessageTokens: (message: Message): number => {
        return calculateMessageTokensSimple(message)
      },
      
      calculateSessionTokens: (messages: Message[]): TokenStats => {
        const stats: TokenStats = {
          total: 0,
          user: 0,
          assistant: 0,
          system: 0,
          byMessage: {},
        }
        
        for (const message of messages) {
          const tokens = calculateMessageTokensSimple(message)
          stats.byMessage[message.id] = tokens
          stats.total += tokens
          
          switch (message.role) {
            case 'user':
              stats.user += tokens
              break
            case 'assistant':
              stats.assistant += tokens
              break
            case 'system':
              stats.system += tokens
              break
          }
        }
        
        return stats
      },
      
      checkThreshold: (sessionId: string, messages: Message[]) => {
        const { config, sessionStates } = get()
        const stats = get().calculateSessionTokens(messages)
        const currentTokens = stats.total
        const threshold = config.tokenThreshold
        const percentage = currentTokens / threshold
        
        // 检查阈值状态
        let status: ThresholdStatus = 'normal'
        
        if (percentage >= 1) {
          status = 'exceeded'
        } else if (percentage >= config.criticalThreshold) {
          status = 'critical'
        } else if (percentage >= config.warningThreshold) {
          status = 'warning'
        }
        
        // 更新会话状态
        const existingState = sessionStates[sessionId]
        const lastCompressedAt = existingState?.lastCompressedAt ?? null
        const compressionCount = existingState?.compressionCount ?? 0
        
        const newSessionState: SessionCompressionState = {
          sessionId,
          currentTokens,
          lastCompressedAt,
          compressionCount,
          thresholdStatus: status,
          compressionStatus: existingState?.compressionStatus ?? 'idle',
          pendingCompression: status === 'exceeded' && config.autoCompress,
        }
        
        set((state) => ({
          sessionStates: {
            ...state.sessionStates,
            [sessionId]: newSessionState,
          },
        }))
        
        return {
          status,
          currentTokens,
          threshold,
          percentage,
        }
      },
      
      // ==================== 会话状态操作 ====================
      
      getSessionState: (sessionId: string) => {
        return get().sessionStates[sessionId]
      },
      
      updateSessionState: (sessionId: string, updates: Partial<SessionCompressionState>) => {
        set((state) => {
          const existing = state.sessionStates[sessionId] || {
            sessionId,
            currentTokens: 0,
            lastCompressedAt: null,
            compressionCount: 0,
            status: 'idle' as CompressionStatus,
            pendingCompression: false,
          }
          
          return {
            sessionStates: {
              ...state.sessionStates,
              [sessionId]: { ...existing, ...updates },
            },
          }
        })
      },
      
      // ==================== 压缩操作 ====================
      
      triggerCompression: async (
        sessionId: string,
        messages: Message[],
        trigger: 'threshold' | 'manual' | 'scheduled' = 'threshold'
      ) => {
        const { config, sessionStates } = get()
        
        // 检查冷却时间
        const sessionState = sessionStates[sessionId]
        if (sessionState?.lastCompressedAt && trigger !== 'manual') {
          const elapsed = Date.now() - sessionState.lastCompressedAt
          if (elapsed < config.compressionCooldown) {
            throw new Error(`压缩冷却中，请等待 ${Math.ceil((config.compressionCooldown - elapsed) / 1000)} 秒`)
          }
        }
        
        // 创建压缩记录
        const record: CompressionRecord = {
          id: generateId(),
          sessionId,
          timestamp: Date.now(),
          trigger,
          beforeTokenCount: get().calculateSessionTokens(messages).total,
          beforeMessageCount: messages.length,
          beforeMessageIds: messages.map(m => m.id),
          afterTokenCount: 0,
          afterMessageCount: 0,
          compressedMessageIds: [],
          status: 'compressing',
        }
        
        // 更新状态
        set((state) => ({
          isCompressing: true,
          currentSessionId: sessionId,
          compressionHistory: [...state.compressionHistory, record],
          sessionStates: {
            ...state.sessionStates,
            [sessionId]: {
              ...(state.sessionStates[sessionId] || {}),
              sessionId,
              compressionStatus: 'compressing',
              pendingCompression: false,
            } as SessionCompressionState,
          },
        }))
        
        try {
          // 执行压缩
          const result = await get().compressSession(sessionId, messages)
          
          // 更新压缩记录
          const afterTokens = get().calculateSessionTokens(result.keptMessages).total
          record.afterTokenCount = afterTokens
          record.afterMessageCount = result.keptMessages.length
          record.compressedMessageIds = messages
            .filter(m => !result.keptMessages.find(k => k.id === m.id))
            .map(m => m.id)
          record.summary = result.summary
          record.keyFacts = result.keyFacts
          record.status = 'completed'
          record.duration = Date.now() - record.timestamp
          
          // 更新历史记录
          set((state) => ({
            compressionHistory: state.compressionHistory.map(h =>
              h.id === record.id ? record : h
            ),
            sessionStates: {
              ...state.sessionStates,
              [sessionId]: {
                ...(state.sessionStates[sessionId] || {}),
                sessionId,
                currentTokens: afterTokens,
                lastCompressedAt: Date.now(),
                compressionCount: (state.sessionStates[sessionId]?.compressionCount ?? 0) + 1,
                compressionStatus: 'completed' as CompressionStatus,
              } as SessionCompressionState,
            },
            isCompressing: false,
            currentSessionId: null,
          }))
          
          return record
        } catch (error) {
          // 更新错误状态
          record.status = 'failed'
          record.error = error instanceof Error ? error.message : '压缩失败'
          
          set((state) => ({
            compressionHistory: state.compressionHistory.map(h =>
              h.id === record.id ? record : h
            ),
            sessionStates: {
              ...state.sessionStates,
              [sessionId]: {
                ...(state.sessionStates[sessionId] || {}),
                compressionStatus: 'failed' as CompressionStatus,
              } as SessionCompressionState,
            },
            isCompressing: false,
            currentSessionId: null,
          }))
          
          throw error
        }
      },
      
      generateSummary: async (messages: Message[]) => {
        // 提取关键事实
        const keyFacts = extractKeyFacts(messages)
        
        // 生成摘要
        const summary = generateSimpleSummary(messages)
        
        // 模拟异步操作（实际应该调用 AI API）
        await new Promise(resolve => setTimeout(resolve, 100))
        
        return { summary, keyFacts }
      },
      
      compressSession: async (
        _sessionId: string,
        messages: Message[],
        strategy?: CompressionStrategy
      ) => {
        const { config } = get()
        const actualStrategy = strategy ?? config.strategy
        
        let keptMessages: Message[] = []
        let summary = ''
        let keyFacts: string[] = []
        
        switch (actualStrategy) {
          case 'summary': {
            // 摘要模式：生成摘要，只保留最近几条消息
            const summaryResult = await get().generateSummary(messages)
            summary = summaryResult.summary
            keyFacts = summaryResult.keyFacts
            
            // 保留最近的消息
            keptMessages = messages.slice(-config.preserveRecentCount)
            
            // 保留系统消息
            if (config.preserveSystemMessages) {
              const systemMessages = messages.filter(m => m.role === 'system')
              for (const sysMsg of systemMessages) {
                if (!keptMessages.find(m => m.id === sysMsg.id)) {
                  keptMessages.unshift(sysMsg)
                }
              }
            }
            break
          }
          
          case 'sliding': {
            // 滑动窗口模式：只保留最近消息
            keptMessages = messages.slice(-config.preserveRecentCount)
            
            // 保留系统消息
            if (config.preserveSystemMessages) {
              const systemMessages = messages.filter(m => m.role === 'system')
              for (const sysMsg of systemMessages) {
                if (!keptMessages.find(m => m.id === sysMsg.id)) {
                  keptMessages.unshift(sysMsg)
                }
              }
            }
            
            // 为被压缩的消息生成简短摘要
            const compressedMessages = messages.filter(
              m => !keptMessages.find(k => k.id === m.id)
            )
            if (compressedMessages.length > 0) {
              const summaryResult = await get().generateSummary(compressedMessages)
              summary = summaryResult.summary
              keyFacts = summaryResult.keyFacts
            }
            break
          }
          
          case 'hybrid': {
            // 混合模式：摘要 + 滑动窗口
            const preservedCount = Math.floor(config.preserveRecentCount / 2)
            keptMessages = messages.slice(-preservedCount)
            
            // 保留系统消息
            if (config.preserveSystemMessages) {
              const systemMessages = messages.filter(m => m.role === 'system')
              for (const sysMsg of systemMessages) {
                if (!keptMessages.find(m => m.id === sysMsg.id)) {
                  keptMessages.unshift(sysMsg)
                }
              }
            }
            
            // 为中间消息生成摘要
            const compressedMessages = messages.filter(
              m => !keptMessages.find(k => k.id === m.id)
            )
            if (compressedMessages.length > 0) {
              const summaryResult = await get().generateSummary(compressedMessages)
              summary = summaryResult.summary
              keyFacts = summaryResult.keyFacts
            }
            break
          }
        }
        
        // 计算压缩比
        const beforeTokens = get().calculateSessionTokens(messages).total
        const afterTokens = get().calculateSessionTokens(keptMessages).total
        const compressionRatio = beforeTokens > 0 ? afterTokens / beforeTokens : 0
        
        return {
          keptMessages,
          summary,
          keyFacts,
          compressionRatio,
        }
      },
      
      // ==================== 历史操作 ====================
      
      getCompressionHistory: (sessionId?: string) => {
        const { compressionHistory } = get()
        if (sessionId) {
          return compressionHistory.filter(h => h.sessionId === sessionId)
        }
        return compressionHistory
      },
      
      clearHistory: (sessionId?: string) => {
        if (sessionId) {
          set((state) => ({
            compressionHistory: state.compressionHistory.filter(
              h => h.sessionId !== sessionId
            ),
          }))
        } else {
          set({ compressionHistory: [] })
        }
      },
      
      // ==================== 重置 ====================
      
      reset: () => {
        set({
          config: DEFAULT_CONFIG,
          sessionStates: {},
          compressionHistory: [],
          isCompressing: false,
          currentSessionId: null,
        })
      },
    }),
    {
      name: 'context-compression-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        compressionHistory: state.compressionHistory.slice(-100), // 只保留最近100条
      }),
    }
  )
)

// ==================== Selector Hooks ====================

/**
 * 获取压缩配置
 */
export function useCompressionConfig(): CompressionConfig {
  return useContextCompression((state) => state.config)
}

/**
 * 获取会话压缩状态
 */
export function useSessionCompressionState(sessionId: string): SessionCompressionState | undefined {
  return useContextCompression((state) => state.sessionStates[sessionId])
}

/**
 * 获取压缩状态
 */
export function useCompressionStatus(): {
  isCompressing: boolean
  currentSessionId: string | null
} {
  return useContextCompression((state) => ({
    isCompressing: state.isCompressing,
    currentSessionId: state.currentSessionId,
  }))
}

/**
 * 获取会话的阈值状态
 */
export function useThresholdStatus(sessionId: string): {
  status: ThresholdStatus
  currentTokens: number
  threshold: number
  percentage: number
} | null {
  return useContextCompression((state) => {
    const sessionState = state.sessionStates[sessionId]
    if (!sessionState) return null
    
    const threshold = state.config.tokenThreshold
    const percentage = sessionState.currentTokens / threshold
    
    return {
      status: sessionState.thresholdStatus,
      currentTokens: sessionState.currentTokens,
      threshold,
      percentage,
    }
  })
}

/**
 * 获取压缩历史
 */
export function useCompressionHistory(sessionId?: string): CompressionRecord[] {
  return useContextCompression((state) => {
    if (sessionId) {
      return state.compressionHistory.filter(h => h.sessionId === sessionId)
    }
    return state.compressionHistory
  })
}

// ==================== Export ====================

export default useContextCompression
