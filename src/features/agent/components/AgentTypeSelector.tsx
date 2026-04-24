/**
 * AgentTypeSelector - Builtin Agent Type Selection Component
 * 
 * Features:
 * - Display 4 agent type options: General Purpose, Explore, Plan, Verification
 * - Radio-button style selection with visual highlight
 * - Integration with Tauri commands for tool permissions
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 */

import { useCallback, useEffect, useState } from 'react'
import { Bot, Compass, FileText, CheckCircle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { safeInvoke } from '@/lib/tauri'

// ==================== Types ====================

export type BuiltinAgentType = 'general-purpose' | 'explore' | 'plan' | 'verification'

export interface AgentTypeOption {
  type: BuiltinAgentType
  name: string
  description: string
  icon: string
  badge?: string
  allowedTools: string[]
}

interface AgentTypeSelectorProps {
  value?: BuiltinAgentType
  onChange?: (type: BuiltinAgentType) => void
  className?: string
}

// ==================== Constants ====================

const AGENT_OPTIONS: AgentTypeOption[] = [
  {
    type: 'general-purpose',
    name: '通用助手',
    description: '处理各种任务的全能型助手',
    icon: 'Bot',
    allowedTools: ['*'],
  },
  {
    type: 'explore',
    name: '代码探索',
    description: '只读模式，探索和分析代码库',
    icon: 'Compass',
    badge: '只读',
    allowedTools: ['glob', 'grep', 'read'],
  },
  {
    type: 'plan',
    name: '任务规划',
    description: '分析和规划复杂任务的执行步骤',
    icon: 'FileText',
    allowedTools: ['*'],
  },
  {
    type: 'verification',
    name: '代码验证',
    description: '验证代码质量和测试覆盖',
    icon: 'CheckCircle',
    badge: '安全',
    allowedTools: ['glob', 'grep', 'read'],
  },
]

// ==================== Component ====================

export function AgentTypeSelector({
  value,
  onChange,
  className,
}: AgentTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<BuiltinAgentType>(
    value ?? 'general-purpose'
  )
  const [toolPermissions, setToolPermissions] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Sync external value
  useEffect(() => {
    if (value !== undefined) {
      setSelectedType(value)
    }
  }, [value])

  // Check tool permissions on type change
  useEffect(() => {
    const checkToolPermissions = async () => {
      setIsLoading(true)
      const selected = AGENT_OPTIONS.find((o) => o.type === selectedType)
      if (!selected) return

      const permissions: Record<string, boolean> = {}
      for (const tool of selected.allowedTools) {
        try {
          const result = await safeInvoke<boolean>('check_tool_allowed', {
            agentTypeName: selectedType,
            toolName: tool,
          })
          permissions[tool] = result ?? false
        } catch {
          permissions[tool] = false
        }
      }
      setToolPermissions(permissions)
      setIsLoading(false)
    }

    void checkToolPermissions()
  }, [selectedType])

  const handleSelect = useCallback(
    (type: BuiltinAgentType) => {
      setSelectedType(type)
      onChange?.(type)
    },
    [onChange]
  )

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons: Record<string, typeof Bot> = {
      Bot,
      Compass,
      FileText,
      CheckCircle,
    }
    return icons[iconName] ?? Bot
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="text-sm font-medium text-slate-700">选择 Agent 类型</div>
      
      <div className="grid grid-cols-2 gap-2">
        {AGENT_OPTIONS.map((option) => {
          const Icon = getIcon(option.icon)
          const isSelected = selectedType === option.type

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => handleSelect(option.type)}
              disabled={isLoading}
              className={cn(
                'relative flex flex-col items-start gap-2 p-3 rounded-lg border-2 transition-all',
                'text-left hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
                isSelected
                  ? 'border-[var(--ao-button-background,#1E3A5F)] bg-[var(--ao-primary-subtle,#EEF4FF)]'
                  : 'border-slate-200 bg-white'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--ao-button-background,#1E3A5F)' }}
                >
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isSelected
                    ? 'bg-[var(--ao-button-background,#1E3A5F)]'
                    : 'bg-slate-100'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    isSelected ? 'text-white' : 'text-slate-600'
                  )}
                />
              </div>

              {/* Name and badge */}
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-slate-900' : 'text-slate-700'
                  )}
                >
                  {option.name}
                </span>
                {option.badge && (
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {option.badge}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 line-clamp-2">
                {option.description}
              </p>

              {/* Tool permission indicator */}
              {(option.allowedTools[0] !== '*' && toolPermissions[option.allowedTools[0]] !== undefined) && (
                <div className="flex items-center gap-1 mt-1">
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      toolPermissions[option.allowedTools[0]]
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    )}
                  />
                  <span className="text-xs text-slate-400">
                    {toolPermissions[option.allowedTools[0]] ? '工具可用' : '工具受限'}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AgentTypeSelector
