import { type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ResizablePanel } from './ResizablePanel'
import { useUIStore } from '../../stores/uiStore'
import { useShortcutListener } from '../../hooks/useGlobalShortcuts'
import { SessionPanel } from '../../features/agent'

interface AiChatPanelProps {
  children?: ReactNode
}

/**
 * AI 对话面板组件
 *
 * 功能：
 * - 响应 Ctrl+Shift+D (Cmd+Shift+D) 全局快捷键打开/关闭
 * - 可调整宽度（300-500px）
 * - 可折叠
 * - 会话管理列表
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - FR085: 全局快捷键支持
 * - FR10: 会话管理功能
 */
export function AiChatPanel({ children }: AiChatPanelProps) {
  const {
    chatPanelWidth,
    chatPanelCollapsed,
    setChatPanelWidth,
    toggleChatPanel,
  } = useUIStore(
    useShallow((state) => ({
      chatPanelWidth: state.chatPanelWidth,
      chatPanelCollapsed: state.chatPanelCollapsed,
      setChatPanelWidth: state.setChatPanelWidth,
      toggleChatPanel: state.toggleChatPanel,
    }))
  )

  // 使用快捷键监听器
  useShortcutListener('open-ai-chat', toggleChatPanel)
  
  return (
    <ResizablePanel
      width={chatPanelWidth}
      minWidth={400}
      maxWidth={600}
      onWidthChange={setChatPanelWidth}
      direction="left"
      collapsed={chatPanelCollapsed}
      className="h-full"
    >
      <div 
        className="h-full flex flex-col border-l border-slate-200"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {children || (
          <SessionPanel className="h-full" />
        )}
      </div>
    </ResizablePanel>
  )
}
