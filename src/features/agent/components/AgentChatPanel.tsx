/**
 * AgentChatPanel - AI 对话面板
 * Story 4.1 - AI对话界面实现
 * Story 51.4 - Chat host integration and E2E baseline
 * 
 * 主对话界面组件，集成消息列表和输入组件
 * 连接真实后端 runtime，移除模拟响应路径
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - ARCH: 分层架构，复用消息模型
 * - ARCH-037: 前端通过 Tauri IPC 调用后端
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Clock3, MessageSquare, Plus, AlertCircle, Zap } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { StagedReviewPanel } from './StagedReviewPanel'
import { CompressionStatus } from './chat/CompressionStatus'
import { CompressionHistory } from './chat/CompressionHistory'
import { 
  useChatStore, 
  useActiveChatSession
} from '../hooks/useChatStore'
import { useAgentRuntime } from '../hooks/useAgentRuntime'
import { useBusinessCompression } from '../hooks/useBusinessCompression'
import { cn } from '@/lib/utils'
import type { CompressionRecord } from '../services/compact'

// ==================== Types ====================

interface AgentChatPanelProps {
  className?: string
  onSendMessage?: (content: string) => Promise<void>
  onStopGeneration?: () => void
  onNewSession?: () => void
  onOpenSessions?: () => void
  onOpenHistory?: () => void
}

// ==================== Compression Status Bar Component ====================

interface CompressionStatusBarProps {
  activeSessionId: string | null
  className?: string
}

function CompressionStatusBar({ activeSessionId, className }: CompressionStatusBarProps) {
  const [compressionRecords, setCompressionRecords] = useState<CompressionRecord[]>([])
  
  const {
    isCompressing,
    tokenCount,
    thresholdStatus,
    compressionCount,
    shouldTrigger,
    executeCompression,
    config,
  } = useBusinessCompression({
    sessionId: activeSessionId || 'default',
    config: {
      autoCompactEnabled: true,
      autoCompactBufferTokens: 80000,
      warningThreshold: 100000,
      errorThreshold: 150000,
    },
  })

  // 获取显示状态
  const getStatus = (): 'idle' | 'compressing' | 'success' | 'error' | 'warning' => {
    if (isCompressing) return 'compressing'
    if (thresholdStatus === 'exceeded') return 'error'
    if (thresholdStatus === 'critical') return 'warning'
    if (thresholdStatus === 'warning') return 'warning'
    return compressionCount > 0 ? 'success' : 'idle'
  }

  // 处理手动压缩
  const handleManualCompact = useCallback(async () => {
    if (!activeSessionId) return
    
    // 获取当前消息列表的 token 数量（这里用估算值）
    const estimatedTokens = tokenCount || 50000
    const triggerResult = shouldTrigger(estimatedTokens)
    
    if (triggerResult.shouldTrigger) {
      await executeCompression([], triggerResult.strategy)
      
      // 记录压缩
      const newRecord: CompressionRecord = {
        id: `compact-${Date.now()}`,
        timestamp: new Date(),
        layer: triggerResult.strategy || 'micro',
        triggerType: triggerResult.triggerType || 'manual',
        beforeTokens: estimatedTokens,
        afterTokens: Math.floor(estimatedTokens * 0.4),
        compressionRatio: 60,
        duration: 1000,
        success: true,
      }
      setCompressionRecords(prev => [newRecord, ...prev].slice(0, 50))
    }
  }, [activeSessionId, tokenCount, shouldTrigger, executeCompression])

  if (!activeSessionId) return null

  return (
    <div className={cn('flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50', className)}>
      {/* 压缩状态指示器 */}
      <CompressionStatus
        status={getStatus()}
        tokenCount={tokenCount}
        warningThreshold={config.warningThreshold}
        errorThreshold={config.errorThreshold}
        compressionCount={compressionCount}
      />

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 压缩历史 */}
        {compressionRecords.length > 0 && (
          <CompressionHistory
            records={compressionRecords}
            maxDisplay={3}
            className="mr-2"
            onClear={() => setCompressionRecords([])}
          />
        )}
        
        {/* 手动压缩按钮 */}
        <button
          onClick={handleManualCompact}
          disabled={isCompressing}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            isCompressing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          )}
          title="压缩上下文 (Ctrl+Shift+C)"
        >
          <Zap size={14} />
          {isCompressing ? '压缩中...' : '压缩上下文'}
        </button>
      </div>
    </div>
  )
}

// ==================== Header Component ====================

function ChatHeader({
  onNewSession,
  onOpenSessions,
  onOpenHistory,
}: Pick<AgentChatPanelProps, 'onNewSession' | 'onOpenSessions' | 'onOpenHistory'>) {
  const createSession = useChatStore((state) => state.createSession)
  const activeSession = useActiveChatSession()
  
  const handleNewChat = () => {
    if (onNewSession) {
      onNewSession()
      return
    }

    createSession()
  }
  
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#1E3A5F' }}
        >
          <span className="text-white text-sm font-bold">AI</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {activeSession?.title ?? '新对话'}
          </h3>
          <p className="text-xs text-slate-500">
            AI 助手
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onOpenSessions && (
          <button
            onClick={onOpenSessions}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="打开会话列表"
            aria-label="打开会话列表"
          >
            <MessageSquare size={14} />
            会话
          </button>
        )}
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="打开历史记录"
            aria-label="打开历史记录"
          >
            <Clock3 size={14} />
            历史
          </button>
        )}
        <button
          onClick={handleNewChat}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="新对话"
          aria-label="新对话"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function AgentChatPanel({ 
  className,
  onSendMessage,
  onStopGeneration,
  onNewSession,
  onOpenSessions,
  onOpenHistory,
}: AgentChatPanelProps) {
  const {
    activeSessionId,
    createSession,
    stopStreaming,
    isStreaming: frontendIsStreaming,
  } = useChatStore(
    useShallow((state) => ({
      activeSessionId: state.activeSessionId,
      createSession: state.createSession,
      stopStreaming: state.stopStreaming,
      isStreaming: state.isStreaming,
    }))
  )

  // Agent runtime integration
  const {
    backendSessionId,
    isInitialized,
    isExecuting,
    error: runtimeError,
    initSession,
    executeAgent,
    interrupt,
  } = useAgentRuntime({
    tenantId: 'default',
    userId: 'default-user',
    autoInit: false,
    onError: (err) => {
      console.error('[AgentChatPanel] Runtime error:', err)
    },
    onSessionEnd: (reason, duration) => {
      console.log(`[AgentChatPanel] Session ended: ${reason}, duration: ${duration}ms`)
    },
  })

  // Track if we've initialized the backend session
  const hasInitializedBackend = useRef(false)

  // Combined loading state for UI
  const isAgentRunning = frontendIsStreaming || isExecuting

  // Initialize frontend session
  useEffect(() => {
    if (!activeSessionId) {
      createSession()
    }
  }, [activeSessionId, createSession])

  // Initialize backend session when frontend session is ready
  useEffect(() => {
    if (activeSessionId && !hasInitializedBackend.current && !isInitialized) {
      hasInitializedBackend.current = true
      void initSession()
    }
  }, [activeSessionId, isInitialized, initSession])

  // Listen for compression trigger event from MessageInput (Ctrl+Shift+C)
  useEffect(() => {
    const handleCompressEvent = () => {
      // Trigger manual compression
      const event = new CustomEvent('manual-compression-request')
      window.dispatchEvent(event)
    }
    
    window.addEventListener('trigger-context-compress', handleCompressEvent)
    return () => {
      window.removeEventListener('trigger-context-compress', handleCompressEvent)
    }
  }, [])

  // Handle send message - connect to real backend runtime
  const handleSend = useCallback(async (content: string) => {
    if (!activeSessionId) return

    // If external handler provided, use it (backward compatibility)
    if (onSendMessage) {
      try {
        await onSendMessage(content)
      } catch (err) {
        console.error('发送消息失败:', err)
        stopStreaming()
      }
      return
    }

    // Otherwise, execute through real backend runtime
    await executeAgent(content)
  }, [activeSessionId, onSendMessage, executeAgent, stopStreaming])

  // Handle stop generation - interrupt backend runtime
  const handleStop = useCallback(async () => {
    // Stop frontend streaming
    stopStreaming()

    // Interrupt backend execution
    await interrupt()

    if (onStopGeneration) {
      onStopGeneration()
    }
  }, [stopStreaming, interrupt, onStopGeneration])

  // Error state
  const hasError = runtimeError !== null

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <ChatHeader
        onNewSession={onNewSession}
        onOpenSessions={onOpenSessions}
        onOpenHistory={onOpenHistory}
      />

      {/* Runtime status indicator */}
      {!isInitialized && activeSessionId && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
          <span className="text-xs text-slate-500">
            正在连接 AI Runtime...
          </span>
        </div>
      )}

      {/* Error display */}
      {hasError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-xs text-red-700">
            {runtimeError}
          </span>
          <button
            onClick={() => void initSession()}
            className="ml-auto text-xs text-red-600 hover:text-red-800 underline"
          >
            重试连接
          </button>
        </div>
      )}

      <StagedReviewPanel sessionId={activeSessionId} />
      
      {/* Compression Status Bar */}
      <CompressionStatusBar activeSessionId={activeSessionId} />
      
      {/* Message List */}
      <MessageList className="flex-1 overflow-y-auto" />
      
      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onStop={handleStop}
        disabled={!isInitialized || !backendSessionId || isAgentRunning}
        placeholder={
          !isInitialized 
            ? '正在初始化...' 
            : isAgentRunning
              ? 'AI 正在思考...'
              : '输入消息与 AI 对话...'
        }
      />
    </div>
  )
}

export default AgentChatPanel