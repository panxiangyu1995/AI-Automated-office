/**
 * SessionPanel - 会话管理面板
 * Story 4.2 - 会话管理功能
 * Story 4.3 - 历史对话管理
 * 
 * 左侧会话列表/历史面板 + 右侧对话区域
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - ARCH: 分层架构，连接 runtime session store
 */

import { useState, useCallback, useEffect } from 'react'
import { PanelLeftClose, PanelLeft, MessageSquare, Clock } from 'lucide-react'
import { SessionList } from './SessionList'
import { HistoryPanel } from './HistoryPanel'
import { AgentChatPanel } from './AgentChatPanel'
import { useChatStore } from '../hooks/useChatStore'
import { cn } from '@/lib/utils'

// ==================== Types ====================

type SidebarMode = 'sessions' | 'history'

interface SessionPanelProps {
  className?: string
  onSendMessage?: (content: string) => Promise<void>
  onStopGeneration?: () => void
  defaultShowSidebar?: boolean
  defaultSidebarMode?: SidebarMode
}

// ==================== Main Component ====================

export function SessionPanel({ 
  className,
  onSendMessage,
  onStopGeneration,
  defaultShowSidebar = true,
  defaultSidebarMode = 'sessions'
}: SessionPanelProps) {
  const [showSidebar, setShowSidebar] = useState(defaultShowSidebar)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(defaultSidebarMode)
  const activeSessionId = useChatStore((state) => state.activeSessionId)
  const createSession = useChatStore((state) => state.createSession)
  
  // 初始化：创建默认会话
  useEffect(() => {
    if (!activeSessionId) {
      createSession()
    }
  }, [activeSessionId, createSession])
  
  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev)
  }, [])
  
  return (
    <div className={cn('flex h-full bg-white', className)}>
      {/* Sidebar - Session List or History Panel */}
      <div 
        className={cn(
          'border-r border-slate-200 transition-all duration-300 overflow-hidden flex flex-col',
          showSidebar ? 'w-72' : 'w-0'
        )}
      >
        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setSidebarMode('sessions')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
              sidebarMode === 'sessions' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
            style={sidebarMode === 'sessions' ? { color: '#1E3A5F', borderColor: '#1E3A5F' } : undefined}
          >
            <MessageSquare size={16} />
            会话
          </button>
          <button
            onClick={() => setSidebarMode('history')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
              sidebarMode === 'history' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
            style={sidebarMode === 'history' ? { color: '#1E3A5F', borderColor: '#1E3A5F' } : undefined}
          >
            <Clock size={16} />
            历史
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {sidebarMode === 'sessions' ? (
            <SessionList 
              className="h-full"
              onNewSession={() => {
                // Sidebar 保持打开状态便于看到新会话
              }}
            />
          ) : (
            <HistoryPanel 
              className="h-full"
              onSelectSession={() => {
                // 可选：选中会话后切换到会话列表
              }}
            />
          )}
        </div>
      </div>
      
      {/* Main Content - Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className="absolute left-2 top-3 z-10 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title={showSidebar ? '隐藏侧边栏' : '显示侧边栏'}
        >
          {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        
        <AgentChatPanel
          className="h-full"
          onSendMessage={onSendMessage}
          onStopGeneration={onStopGeneration}
        />
      </div>
    </div>
  )
}

export default SessionPanel
