/**
 * useBusinessCompression Hook
 * 业务上下文压缩状态管理
 */

import { useCallback, useState } from 'react'
import {
  compactTriggerService,
  businessCompactService,
  microCompactService,
  businessMemoryService,
  reactiveCompactService,
  recoveryService,
  type CompressionLayer,
  type TriggerType,
  type BusinessCompressionConfig,
  DEFAULT_CONFIG,
} from '../services/compact'

interface UseBusinessCompressionOptions {
  sessionId: string
  config?: Partial<BusinessCompressionConfig>
  onTrigger?: (layer: CompressionLayer) => void
  onError?: (error: Error) => void
}

interface UseBusinessCompressionReturn {
  // 状态
  isCompressing: boolean
  lastTriggerType: TriggerType | null
  tokenCount: number
  thresholdStatus: 'normal' | 'warning' | 'critical' | 'exceeded'
  compressionCount: number
  
  // 方法
  triggerManual: () => void
  shouldTrigger: (tokenCount: number) => { shouldTrigger: boolean; triggerType?: TriggerType; strategy?: CompressionLayer }
  executeCompression: (messages: unknown[], strategy?: CompressionLayer) => Promise<void>
  detectAutoRecovery: (userMessage: string) => string[]
  recover: (action: string, entityId: string) => Promise<{ success: boolean; error?: string }>
  formatRecoveryResult: (result: { success: boolean; error?: string; entityType?: string; entityId?: string }) => string
  
  // 配置
  config: BusinessCompressionConfig
  updateConfig: (updates: Partial<BusinessCompressionConfig>) => void
}

export function useBusinessCompression(options: UseBusinessCompressionOptions): UseBusinessCompressionReturn {
  const { sessionId, config: partialConfig, onTrigger, onError } = options
  
  const [config, setConfig] = useState<BusinessCompressionConfig>({ ...DEFAULT_CONFIG, ...partialConfig })
  const [isCompressing, setIsCompressing] = useState(false)
  const [lastTriggerType, setLastTriggerType] = useState<TriggerType | null>(null)
  const [tokenCount, setTokenCount] = useState(0)
  const [compressionCount, setCompressionCount] = useState(0)

  // 手动触发压缩
  const triggerManual = useCallback(() => {
    compactTriggerService.requestManualTrigger()
    setLastTriggerType('manual')
  }, [])

  // 检查是否应该触发压缩
  const shouldTrigger = useCallback((currentTokenCount: number) => {
    const result = compactTriggerService.shouldTrigger(currentTokenCount)
    setTokenCount(currentTokenCount)
    return result
  }, [])

  // 执行压缩
  const executeCompression = useCallback(async (messages: unknown[], strategy?: CompressionLayer) => {
    setIsCompressing(true)
    
    try {
      const selectedStrategy = strategy || 'micro'
      
      switch (selectedStrategy) {
        case 'business_memory':
          businessMemoryService.compressWithMemory(sessionId, messages as never[])
          break
        case 'micro':
          microCompactService.execute(messages as never[])
          break
        case 'business_full':
          await businessCompactService.execute(messages as never[])
          break
        case 'reactive':
          reactiveCompactService.execute(messages as never[], 0)
          break
      }
      
      // 记录触发
      if (lastTriggerType) {
        compactTriggerService.recordTrigger(lastTriggerType)
      }
      
      setCompressionCount(prev => prev + 1)
      onTrigger?.(selectedStrategy)
      
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Compression failed'))
    } finally {
      setIsCompressing(false)
    }
  }, [sessionId, lastTriggerType, onTrigger, onError])

  // 检测自动恢复
  const detectAutoRecovery = useCallback((userMessage: string): string[] => {
    return recoveryService.detectAutoRecovery(userMessage)
  }, [])

  // 执行恢复
  const recover = useCallback(async (action: string, entityId: string) => {
    try {
      const result = await recoveryService.recover(action as never, entityId)
      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '恢复失败' }
    }
  }, [])

  // 格式化恢复结果
  const formatRecoveryResult = useCallback((result: { success: boolean; error?: string; entityType?: string; entityId?: string }): string => {
    return recoveryService.formatRecoveryResult({
      ...result,
      entityId: result.entityId || 'unknown',
      entityType: result.entityType || 'message',
      content: null,
      retrievedAt: new Date(),
      source: 'message_history' as const,
    })
  }, [])

  // 更新配置
  const updateConfig = useCallback((updates: Partial<BusinessCompressionConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  // 计算阈值状态
  const thresholdStatus: 'normal' | 'warning' | 'critical' | 'exceeded' = 
    tokenCount >= config.errorThreshold ? 'exceeded' :
    tokenCount >= config.warningThreshold ? 'critical' :
    tokenCount >= config.autoCompactBufferTokens ? 'warning' : 'normal'

  return {
    isCompressing,
    lastTriggerType,
    tokenCount,
    thresholdStatus,
    compressionCount,
    triggerManual,
    shouldTrigger,
    executeCompression,
    detectAutoRecovery,
    recover,
    formatRecoveryResult,
    config,
    updateConfig,
  }
}

export default useBusinessCompression
