import { useEffect, useRef, type ReactNode, useCallback } from 'react'
import { ResizablePanel } from './ResizablePanel'
import { useUIStore } from '../../stores/uiStore'
import { useShortcutListener } from '../../hooks/useGlobalShortcuts'
import { AgentChatPanel } from '../../features/agent'

interface AiChatPanelProps {
  children?: ReactNode
}

/**
 * AI 对话面板组件
 * Story 4.1 - AI对话界面实现
 *
 * 功能：
 * - 响应 Ctrl+Shift+D (Cmd+Shift+D) 全局快捷键打开/关闭
 * - 可调整宽度（300-500px）
 * - 可折叠
 * - 完整的 AI 对话功能
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - FR085: 全局快捷键支持
 * - FR9: AI Agent 核心功能
 */
export function AiChatPanel({ children }: AiChatPanelProps) {
  const {
    chatPanelWidth,
    chatPanelCollapsed,
    setChatPanelWidth,
    toggleChatPanel,
  } = useUIStore()

  // 使用 ref 保存最新的 toggleChatPanel 函数
  const toggleChatPanelRef = useRef(toggleChatPanel)
  useEffect(() => {
    toggleChatPanelRef.current = toggleChatPanel
  }, [toggleChatPanel])

  useShortcutListener('open-ai-chat', () => {
    toggleChatPanelRef.current()
  })

  // 发送消息处理
  const handleSendMessage = useCallback(async (content: string) => {
    // TODO: 集成后端 AI 服务
    console.log('发送消息:', content)
  }, [])

  // 停止生成处理
  const handleStopGeneration = useCallback(() => {
    // TODO: 集成后端取消请求
    console.log('停止生成')
  }, [])

  return (
    <ResizablePanel
      width={chatPanelWidth}
      minWidth={300}
      maxWidth={500}
      onWidthChange={setChatPanelWidth}
      direction="left"
      collapsed={chatPanelCollapsed}
      className="h-full"
    >
      <div 
        className="h-full flex flex-col border-l border-slate-200"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* 使用新的 AgentChatPanel */}
        {children || (
          <AgentChatPanel
            className="h-full"
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
          />
        )}
      </div>
    </ResizablePanel>
  )
}
