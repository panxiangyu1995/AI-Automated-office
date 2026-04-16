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
 * AI 对话面板组件 - 对齐设置页设计风格
 *
 * 功能：
 * - 响应 Ctrl+Shift+I (Cmd+Shift+I) 全局快捷键打开/关闭
 * - 可调整宽度（300-500px）
 * - 可折叠
 * - 会话管理列表
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
      minWidth={300}
      maxWidth={500}
      onWidthChange={setChatPanelWidth}
      direction="left"
      collapsed={chatPanelCollapsed}
      className="h-full"
    >
      <div
        className="h-full flex flex-col border-l"
        style={{
          backgroundColor: 'var(--ao-aiChatPanel-background)',
          borderColor: 'var(--ao-aiChatPanel-border)',
        }}
      >
        {children || (
          <SessionPanel className="h-full" />
        )}
      </div>
    </ResizablePanel>
  )
}
