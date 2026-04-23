/**
 * useWorkspaceStateRecovery - 工作场景即时恢复 Hook
 * OpenSpec: workspace-state-persistence
 *
 * 管理恢复时序和事件，支持启动时自动恢复工作状态
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useChatStore } from '../features/agent/hooks/useChatStore'
import { useAppStore } from '../stores/appStore'
import { eventBus } from './eventBus'
import { ChatEvents } from './types/eventBus'

export type RecoveryPhase =
  | 'idle'
  | 'ui'
  | 'tabs'
  | 'chat'
  | 'editor'
  | 'sidebar'
  | 'complete'

export interface UseWorkspaceStateRecoveryOptions {
  /** 是否启用恢复功能，默认 true */
  enabled?: boolean
  /** 恢复完成回调 */
  onRestoreComplete?: () => void
}

export interface UseWorkspaceStateRecoveryReturn {
  /** 当前恢复阶段 */
  phase: RecoveryPhase
  /** 是否正在恢复 */
  isRecovering: boolean
  /** 手动触发恢复 */
  triggerRecovery: () => void
}

/**
 * 工作场景状态恢复 Hook
 *
 * 各 Store 的持久化数据由 Zustand persist 中间件自动恢复，
 * 本 Hook 负责：
 * 1. 检测流式中断状态并分发事件
 * 2. 按阶段通知恢复进度
 * 3. 提供手动触发恢复的接口
 *
 * @param options 配置选项
 * @returns 恢复状态和方法
 *
 * @example
 * ```tsx
 * const { phase, isRecovering } = useWorkspaceStateRecovery({
 *   enabled: appStore.restoreWorkspaceOnStartup,
 *   onRestoreComplete: () => console.log('恢复完成')
 * })
 * ```
 */
export function useWorkspaceStateRecovery(
  options: UseWorkspaceStateRecoveryOptions = {}
): UseWorkspaceStateRecoveryReturn {
  const { enabled = true, onRestoreComplete } = options

  const [phase, setPhase] = useState<RecoveryPhase>('idle')

  const isRecovering = phase !== 'idle' && phase !== 'complete'

  const enabledRef = useRef(enabled)
  const onRestoreCompleteRef = useRef(onRestoreComplete)

  // 保持 ref 同步
  enabledRef.current = enabled
  onRestoreCompleteRef.current = onRestoreComplete

  const restoreWorkspaceOnStartup = useAppStore((state) => state.restoreWorkspaceOnStartup)
  const isStreaming = useChatStore((state) => state.isStreaming)
  const activeSessionId = useChatStore((state) => state.activeSessionId)

  /**
   * 检查并处理流式中断状态
   */
  const handleStreamingInterrupted = useCallback(() => {
    if (isStreaming && activeSessionId) {
      // 分发流式中断事件，通知 UI 显示提示
      eventBus.publish(ChatEvents.STREAMING_END, {
        sessionId: activeSessionId,
      })
    }
  }, [isStreaming, activeSessionId])

  /**
   * 按顺序执行恢复流程
   * 各阶段让出主线程，确保 UI 响应
   */
  const performRecovery = useCallback(async () => {
    if (!enabledRef.current || !restoreWorkspaceOnStartup) {
      setPhase('complete')
      return
    }

    // 处理流式中断
    handleStreamingInterrupted()

    const phases: RecoveryPhase[] = ['ui', 'tabs', 'chat', 'editor', 'sidebar']

    for (const p of phases) {
      setPhase(p)
      // 让出主线程，允许 UI 渲染
      await new Promise<void>((resolve) => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => resolve(), { timeout: 100 })
        } else {
          setTimeout(() => resolve(), 0)
        }
      })
    }

    setPhase('complete')
    onRestoreCompleteRef.current?.()
  }, [handleStreamingInterrupted, restoreWorkspaceOnStartup])

  /**
   * 手动触发恢复
   */
  const triggerRecovery = useCallback(() => {
    setPhase('idle')
    performRecovery()
  }, [performRecovery])

  // 初始化时执行恢复
  useEffect(() => {
    if (enabled && restoreWorkspaceOnStartup) {
      performRecovery()
    } else {
      setPhase('complete')
    }
  }, [enabled, restoreWorkspaceOnStartup, performRecovery])

  return {
    phase,
    isRecovering,
    triggerRecovery,
  }
}

export default useWorkspaceStateRecovery
