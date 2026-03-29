/**
 * ModeSwitcher - 轻量级 Agent 切换组件
 *
 * Story: Subagent ModeSwitcher Component
 *
 * 功能：
 * - 点击展开下拉选择器
 * - 键盘导航（↑↓/Enter/Escape）
 * - 切换后自动聚焦回输入框
 * - 仅当存在多个可用 agent 时显示
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Bot, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export interface AgentOption {
  id: string
  name: string
  mode: 'primary' | 'subagent'
  description?: string
}

interface ModeSwitcherProps {
  agents: AgentOption[]
  selectedAgentId: string
  onAgentSelect: (agentId: string) => void
  disabled?: boolean
  className?: string
}

// ==================== Component ====================

export function ModeSwitcher({
  agents,
  selectedAgentId,
  onAgentSelect,
  disabled = false,
  className,
}: ModeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Filter to only visible agents (primary mode agents)
  const visibleAgents = agents.filter(agent => agent.mode === 'primary')

  // Don't render if only one agent
  if (visibleAgents.length <= 1) {
    return null
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  const handleToggle = useCallback(() => {
    if (disabled) return
    setIsOpen(prev => !prev)
    setHighlightedIndex(visibleAgents.findIndex(a => a.id === selectedAgentId))
  }, [disabled, selectedAgentId, visibleAgents])

  const handleSelect = useCallback((agentId: string) => {
    onAgentSelect(agentId)
    setIsOpen(false)
    // Focus back to input - dispatch custom event
    window.dispatchEvent(new CustomEvent('modeSwitcherClosed', { detail: { agentId } }))
  }, [onAgentSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(visibleAgents.findIndex(a => a.id === selectedAgentId))
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < visibleAgents.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < visibleAgents.length) {
          handleSelect(visibleAgents[highlightedIndex].id)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
    }
  }, [isOpen, visibleAgents, highlightedIndex, selectedAgentId, handleSelect])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
          'text-sm font-medium transition-colors',
          'bg-slate-100 text-slate-700',
          'hover:bg-slate-200 hover:text-slate-900',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'bg-slate-200 text-slate-900'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Bot size={16} className="text-brand-600" />
        <span>{selectedAgent?.name ?? '选择 Agent'}</span>
        <ChevronDown
          size={14}
          className={cn(
            'transition-transform text-slate-400',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-64 rounded-lg',
            'bg-white shadow-lg border border-slate-200',
            'py-1 overflow-auto'
          )}
          role="listbox"
          aria-label="选择 Agent"
        >
          {visibleAgents.map((agent, index) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => handleSelect(agent.id)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-2',
                'text-left transition-colors',
                index === highlightedIndex && 'bg-slate-100',
                agent.id === selectedAgentId && 'bg-brand-50'
              )}
              role="option"
              aria-selected={agent.id === selectedAgentId}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  agent.mode === 'primary' ? 'bg-brand-100' : 'bg-purple-100'
                )}
              >
                {agent.mode === 'primary' ? (
                  <Bot size={16} className="text-brand-600" />
                ) : (
                  <Users size={16} className="text-purple-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {agent.name}
                  </span>
                  {agent.mode === 'primary' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                      主
                    </span>
                  )}
                </div>
                {agent.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {agent.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== Hook for ModeSwitcher Integration ====================

export function useModeSwitcher() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')

  // Listen for modeSwitcherClosed event to focus input
  useEffect(() => {
    const handleModeSwitcherClosed = (_e: CustomEvent<{ agentId: string }>) => {
      // Focus the message input
      const input = document.querySelector('[data-message-input]') as HTMLTextAreaElement
      input?.focus()
    }

    window.addEventListener('modeSwitcherClosed', handleModeSwitcherClosed as EventListener)
    return () => window.removeEventListener('modeSwitcherClosed', handleModeSwitcherClosed as EventListener)
  }, [])

  return {
    selectedAgentId,
    setSelectedAgentId,
  }
}
