/**
 * AgentChatPanel - AI 对话面板
 * Story 4.1 - AI对话界面实现
 * 
 * 主对话界面组件，集成消息列表和输入组件
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - ARCH: 分层架构，复用消息模型
 */

import { useCallback, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { StagedReviewPanel } from './StagedReviewPanel'
import { 
  useChatStore, 
  useActiveChatSession
} from '../hooks/useChatStore'
import {
  createCardContainerReference,
  createCardReference,
  createCardUpdateOperation,
  createCardWritebackAction,
  createTextCardContent,
  useStagedReviewStore,
} from '@/features/session/runtime'
import { cn } from '@/lib/utils'

// ==================== Types ====================

interface AgentChatPanelProps {
  className?: string
  onSendMessage?: (content: string) => Promise<void>
  onStopGeneration?: () => void
}

// ==================== Header Component ====================

function ChatHeader() {
  const { createSession } = useChatStore()
  const activeSession = useActiveChatSession()
  
  const handleNewChat = () => {
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
      
      <button
        onClick={handleNewChat}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        title="新对话"
      >
        <Plus size={18} />
      </button>
    </div>
  )
}

// ==================== Main Component ====================

export function AgentChatPanel({ 
  className,
  onSendMessage,
  onStopGeneration 
}: AgentChatPanelProps) {
  const {
    activeSessionId,
    createSession,
    addUserMessage,
    addAssistantMessage,
    startStreaming,
    stopStreaming,
  } = useChatStore()
  
  // 初始化：创建默认会话
  useEffect(() => {
    if (!activeSessionId) {
      createSession()
    }
  }, [activeSessionId, createSession])
  
  // 发送消息
  const handleSend = useCallback(async (content: string) => {
    const sessionId = activeSessionId
    if (!sessionId) return
    
    // 添加用户消息
    addUserMessage(sessionId, content)
    
    // 创建助手消息
    const assistantMessage = addAssistantMessage(sessionId)
    if (!assistantMessage) return
    
    // 开始流式传输
    const partId = `part-${Date.now()}`
    startStreaming(sessionId, assistantMessage.id, partId)
    
    // 调用外部处理函数
    if (onSendMessage) {
      try {
        await onSendMessage(content)
      } catch (error) {
        console.error('发送消息失败:', error)
        stopStreaming()
      }
    } else {
      // 模拟响应 (测试用)
      simulateResponse(content, sessionId, assistantMessage.id, partId)
    }
  }, [activeSessionId, addUserMessage, addAssistantMessage, startStreaming, onSendMessage, stopStreaming])
  
  // 停止生成
  const handleStop = useCallback(() => {
    const sessionId = activeSessionId
    if (sessionId) {
      stopStreaming()
    }
    
    if (onStopGeneration) {
      onStopGeneration()
    }
  }, [activeSessionId, stopStreaming, onStopGeneration])
  
  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <ChatHeader />

      <StagedReviewPanel sessionId={activeSessionId} />
      
      {/* Message List */}
      <MessageList className="flex-1 overflow-y-auto" />
      
      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onStop={handleStop}
        disabled={false}
      />
    </div>
  )
}

// ==================== Helper: Simulate Response ====================

/**
 * 模拟 AI 响应 (用于测试)
 */
async function simulateResponse(
  userContent: string,
  sessionId: string,
  _messageId: string,
  _partId: string
) {
  const responses = [
    '好的，我来帮您处理这个问题。',
    '根据您的描述，我建议您可以尝试以下方案：\n\n1. 首先确认数据是否正确\n2. 然后执行相关操作\n3. 最后验证结果\n\n需要我详细解释任何步骤吗？',
    '```python\n# 示例代码\ndef process_data(data):\n    return data.upper()\n```\n\n这是一段简单的处理代码，您可以根据需要进行修改。',
    '我已经完成了分析。以下是结果：\n\n- 总计处理了 10 条数据\n- 成功率：95%\n- 平均耗时：2.3 秒\n\n有什么其他需要帮助的吗？',
  ]
  
  const response = responses[Math.floor(Math.random() * responses.length)]
  const store = useChatStore.getState()
  
  // 模拟逐字输出
  let currentContent = ''
  for (const char of response) {
    await new Promise(resolve => setTimeout(resolve, 30))
    currentContent += char
    store.updateStreamingContent(currentContent)
  }
  
  // 完成流式传输
  store.finalizeStreamingMessage(sessionId)
  store.stopStreaming()

  const containerRef = createCardContainerReference(
    'workbench-tender-draft',
    'tender-workspace',
    'dept-tender',
    'workbench'
  )
  const cardRef = createCardReference(`candidate-${Date.now()}`, containerRef, 0)
  const cardAction = createCardWritebackAction(sessionId, containerRef, [
    createCardUpdateOperation(cardRef, 'create', {
      cardData: {
        title: 'AI 候选业务草稿',
        description: '等待用户确认后再正式应用到页面。',
        contentType: 'text',
        content: createTextCardContent(
          `基于“${userContent}”生成的候选内容已暂存，请在变更清单中逐条接受或拒绝。`,
          'markdown'
        ),
      },
    }),
  ])

  useStagedReviewStore.getState().stageWorkbenchWriteback(cardAction, {
    title: 'AI 候选改动',
    summary: '聊天区上方的变更清单会将候选改动与工具调用分开展示，只有用户接受后才算正式生效。',
    sourceTool: 'workspace_stage_change',
  })
}

export default AgentChatPanel
