/**
 * SubAgentRegistry - Agent 注册表管理界面
 *
 * Story: Subagent Registry UI
 *
 * 功能：
 * - 显示 Agent 统计信息
 * - 搜索和过滤
 * - AgentCard 可展开组件
 * - 启用/禁用开关
 * - 删除确认
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 */

import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Bot,
  Users,
  Shield,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  Download,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// ==================== Types ====================

export interface AgentRegistryItem {
  id: string
  name: string
  mode: 'primary' | 'subagent'
  description: string
  enabled: boolean
  native: boolean
  hidden: boolean
  skills: string[]
  tools: string[]
  permissions: Record<string, string>
}

interface SubAgentRegistryProps {
  agents: AgentRegistryItem[]
  onAgentCreate?: () => void
  onAgentEdit?: (agent: AgentRegistryItem) => void
  onAgentDelete?: (agentId: string) => void
  onAgentToggle?: (agentId: string, enabled: boolean) => void
  onExport?: () => void
  onImport?: () => void
  className?: string
}

// ==================== AgentCard Component ====================

interface AgentCardProps {
  agent: AgentRegistryItem
  onEdit?: () => void
  onDelete?: () => void
  onToggle?: (enabled: boolean) => void
}

function AgentCard({ agent, onEdit, onDelete, onToggle }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className={cn('transition-all', !agent.enabled && 'opacity-60')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                agent.mode === 'primary' ? 'bg-brand-100' : 'bg-purple-100'
              )}
            >
              {agent.mode === 'primary' ? (
                <Bot size={20} className="text-brand-600" />
              ) : (
                <Users size={20} className="text-purple-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {agent.name}
                {agent.native && (
                  <Badge variant="secondary" className="text-xs">
                    内置
                  </Badge>
                )}
                {agent.mode === 'subagent' && (
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                    子 Agent
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {agent.description}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={agent.enabled}
              onCheckedChange={onToggle}
              aria-label={`启用 ${agent.name}`}
            />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-slate-100 transition-colors"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown size={18} className="text-slate-500" />
              ) : (
                <ChevronRight size={18} className="text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-2 space-y-4">
          {/* Skills */}
          {agent.skills.length > 0 && (
            <div>
              <Label className="text-xs text-slate-500 uppercase">技能</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {agent.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {agent.tools.length > 0 && (
            <div>
              <Label className="text-xs text-slate-500 uppercase">工具</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {agent.tools.map(tool => (
                  <Badge key={tool} variant="outline" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          {Object.keys(agent.permissions).length > 0 && (
            <div>
              <Label className="text-xs text-slate-500 uppercase flex items-center gap-1">
                <Shield size={12} /> 权限
              </Label>
              <div className="mt-1 space-y-1">
                {Object.entries(agent.permissions).map(([op, action]) => (
                  <div key={op} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{op}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        action === 'allow' && 'bg-green-100 text-green-700',
                        action === 'ask' && 'bg-yellow-100 text-yellow-700',
                        action === 'deny' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {action}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={onEdit}>
              编辑
            </Button>
            {!agent.native && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={14} className="mr-1" />
                删除
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ==================== Stats Cards ====================

interface StatsCardsProps {
  agents: AgentRegistryItem[]
}

function StatsCards({ agents }: StatsCardsProps) {
  const stats = useMemo(() => {
    const total = agents.length
    const primary = agents.filter(a => a.mode === 'primary').length
    const subagent = agents.filter(a => a.mode === 'subagent').length
    const enabled = agents.filter(a => a.enabled).length
    return { total, primary, subagent, enabled }
  }, [agents])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-brand-600">{stats.total}</div>
          <p className="text-xs text-slate-500">总 Agent 数</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-slate-600">{stats.primary}</div>
          <p className="text-xs text-slate-500">主 Agent</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-purple-600">{stats.subagent}</div>
          <p className="text-xs text-slate-500">子 Agent</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
          <p className="text-xs text-slate-500">已启用</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== Main Registry Component ====================

export function SubAgentRegistry({
  agents,
  onAgentCreate,
  onAgentEdit,
  onAgentDelete,
  onAgentToggle,
  onExport,
  onImport,
  className,
}: SubAgentRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'primary' | 'subagent'>('all')
  const [deleteTarget, setDeleteTarget] = useState<AgentRegistryItem | null>(null)

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          agent.name.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query) ||
          agent.skills.some(s => s.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Mode filter
      if (filterMode !== 'all' && agent.mode !== filterMode) {
        return false
      }

      return true
    })
  }, [agents, searchQuery, filterMode])

  const handleDeleteConfirm = () => {
    if (deleteTarget && onAgentDelete) {
      onAgentDelete(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agent 注册表</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download size={14} className="mr-1" />
            导出
          </Button>
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload size={14} className="mr-1" />
            导入
          </Button>
          <Button size="sm" onClick={onAgentCreate}>
            <Plus size={14} className="mr-1" />
            新建 Agent
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards agents={agents} />

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索 Agent..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['all', 'primary', 'subagent'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                filterMode === mode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {mode === 'all' ? '全部' : mode === 'primary' ? '主 Agent' : '子 Agent'}
            </button>
          ))}
        </div>
      </div>

      {/* Agent List */}
      <div className="space-y-3">
        {filteredAgents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              {searchQuery ? '没有找到匹配的 Agent' : '暂无 Agent，点击"新建 Agent"开始'}
            </CardContent>
          </Card>
        ) : (
          filteredAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => onAgentEdit?.(agent)}
              onDelete={() => setDeleteTarget(agent)}
              onToggle={enabled => onAgentToggle?.(agent.id, enabled)}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 Agent "{deleteTarget?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
