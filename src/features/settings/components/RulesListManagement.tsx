import { useState, useMemo, useCallback } from 'react'
import {
  ListOrdered,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  MoreVertical,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Shield,
  Zap,
  FileText,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
export type RuleCategory = 'identity' | 'behavior' | 'safety' | 'output' | 'tool' | 'memory'
export type RulePriority = 'critical' | 'high' | 'medium' | 'low'
export type RuleStatus = 'enabled' | 'disabled' | 'deprecated'

export interface Rule {
  id: string
  name: string
  description: string
  category: RuleCategory
  priority: RulePriority
  status: RuleStatus
  content: string
  order: number
  createdAt: string
  updatedAt: string
  source: string
  tags: string[]
  appliesTo: string[]
}

export interface RuleGroup {
  category: RuleCategory
  name: string
  description: string
  icon: React.ReactNode
  color: string
  rules: Rule[]
}

export interface RuleStats {
  total: number
  enabled: number
  disabled: number
  critical: number
  high: number
}

export interface RulesListManagementProps {
  className?: string
}

// Category configuration
const CATEGORY_CONFIG: Record<RuleCategory, { name: string; description: string; icon: React.ReactNode; color: string }> = {
  identity: {
    name: '身份规则',
    description: '定义 AI 的身份和角色',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  behavior: {
    name: '行为规则',
    description: '控制 AI 的行为模式',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  safety: {
    name: '安全规则',
    description: '确保操作安全性',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  output: {
    name: '输出规则',
    description: '控制输出格式和内容',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  tool: {
    name: '工具规则',
    description: '工具调用和执行规则',
    icon: <Layers className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  memory: {
    name: '记忆规则',
    description: '记忆存储和检索规则',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  },
}

// Priority configuration
const PRIORITY_CONFIG: Record<RulePriority, { label: string; color: string }> = {
  critical: { label: '关键', color: 'bg-red-500 text-white' },
  high: { label: '高', color: 'bg-orange-500 text-white' },
  medium: { label: '中', color: 'bg-yellow-500 text-white' },
  low: { label: '低', color: 'bg-gray-500 text-white' },
}

// Mock data
const createMockRules = (): Rule[] => [
  {
    id: 'rule-001',
    name: '身份验证规则',
    description: '在执行敏感操作前必须验证用户身份',
    category: 'identity',
    priority: 'critical',
    status: 'enabled',
    content: '在执行任何敏感操作（如删除、修改权限）之前，必须首先验证用户身份和权限。',
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
    source: 'system',
    tags: ['安全', '身份', '验证'],
    appliesTo: ['delete', 'permission', 'admin'],
  },
  {
    id: 'rule-002',
    name: '隐私数据保护',
    description: '不得泄露或存储用户的敏感个人信息',
    category: 'safety',
    priority: 'critical',
    status: 'enabled',
    content: '严格禁止收集、存储或传输用户的敏感个人信息（如密码、身份证号、银行卡号）。',
    order: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z',
    source: 'system',
    tags: ['隐私', '安全', '数据保护'],
    appliesTo: ['data', 'storage', 'transmission'],
  },
  {
    id: 'rule-003',
    name: '响应格式规范',
    description: '确保输出内容符合格式要求',
    category: 'output',
    priority: 'high',
    status: 'enabled',
    content: '所有响应必须使用清晰的结构化格式，包含适当的标题、段落和列表。',
    order: 3,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z',
    source: 'user',
    tags: ['格式', '输出', '规范'],
    appliesTo: ['response', 'output'],
  },
  {
    id: 'rule-004',
    name: '工具调用审批',
    description: '敏感工具调用需要用户确认',
    category: 'tool',
    priority: 'high',
    status: 'enabled',
    content: '调用文件系统、网络请求等敏感工具时，必须先获取用户明确确认。',
    order: 4,
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-03-18T11:00:00Z',
    source: 'department',
    tags: ['工具', '审批', '安全'],
    appliesTo: ['fs', 'http', 'shell'],
  },
  {
    id: 'rule-005',
    name: '记忆存储策略',
    description: '控制会话记忆的存储和过期',
    category: 'memory',
    priority: 'medium',
    status: 'enabled',
    content: '短期记忆在会话结束后自动清理，长期记忆需要用户明确授权才能持久化。',
    order: 5,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-20T09:00:00Z',
    source: 'system',
    tags: ['记忆', '存储', '隐私'],
    appliesTo: ['memory', 'session'],
  },
  {
    id: 'rule-006',
    name: '礼貌用语规范',
    description: '保持专业和友好的沟通风格',
    category: 'behavior',
    priority: 'low',
    status: 'enabled',
    content: '使用礼貌和专业的语言风格，避免过于生硬或随意的表达。',
    order: 6,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-20T15:00:00Z',
    source: 'user',
    tags: ['行为', '礼貌', '风格'],
    appliesTo: ['communication'],
  },
  {
    id: 'rule-007',
    name: '测试规则（已禁用）',
    description: '这是一个测试规则',
    category: 'behavior',
    priority: 'low',
    status: 'disabled',
    content: '此规则已被禁用，仅作为测试用途。',
    order: 7,
    createdAt: '2026-03-15T00:00:00Z',
    updatedAt: '2026-03-22T10:00:00Z',
    source: 'user',
    tags: ['测试'],
    appliesTo: [],
  },
]

export function RulesListManagement({ className = '' }: RulesListManagementProps) {
  const [rules, setRules] = useState<Rule[]>(createMockRules)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<RuleCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<RuleStatus | 'all'>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<RuleCategory>>(
    new Set(['identity', 'safety', 'behavior'])
  )
  const [draggedRule, setDraggedRule] = useState<Rule | null>(null)

  // Stats
  const stats = useMemo<RuleStats>(() => ({
    total: rules.length,
    enabled: rules.filter(r => r.status === 'enabled').length,
    disabled: rules.filter(r => r.status === 'disabled').length,
    critical: rules.filter(r => r.priority === 'critical').length,
    high: rules.filter(r => r.priority === 'high').length,
  }), [rules])

  // Grouped rules
  const groupedRules = useMemo<RuleGroup[]>(() => {
    const filtered = rules.filter(rule => {
      const matchesSearch = searchQuery === '' ||
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = filterCategory === 'all' || rule.category === filterCategory
      const matchesStatus = filterStatus === 'all' || rule.status === filterStatus

      return matchesSearch && matchesCategory && matchesStatus
    })

    const groups: Record<RuleCategory, Rule[]> = {
      identity: [],
      behavior: [],
      safety: [],
      output: [],
      tool: [],
      memory: [],
    }

    filtered.forEach(rule => {
      groups[rule.category].push(rule)
    })

    return Object.entries(groups)
      .filter(([_, rules]) => rules.length > 0)
      .map(([category, rules]) => ({
        category: category as RuleCategory,
        ...CATEGORY_CONFIG[category as RuleCategory],
        rules: rules.sort((a, b) => a.order - b.order),
      }))
  }, [rules, searchQuery, filterCategory, filterStatus])

  // Toggle category expansion
  const toggleCategory = useCallback((category: RuleCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  // Toggle rule status
  const toggleRuleStatus = useCallback((ruleId: string) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId
        ? { ...r, status: r.status === 'enabled' ? 'disabled' : 'enabled' }
        : r
    ))
  }, [])

  // Move rule up/down
  const moveRule = useCallback((ruleId: string, direction: 'up' | 'down') => {
    setRules(prev => {
      const rule = prev.find(r => r.id === ruleId)
      if (!rule) return prev

      const sameCategory = prev.filter(r => r.category === rule.category).sort((a, b) => a.order - b.order)
      const currentIndex = sameCategory.findIndex(r => r.id === ruleId)
      
      if (direction === 'up' && currentIndex === 0) return prev
      if (direction === 'down' && currentIndex === sameCategory.length - 1) return prev

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const swapRule = sameCategory[swapIndex]

      return prev.map(r => {
        if (r.id === ruleId) return { ...r, order: swapRule.order }
        if (r.id === swapRule.id) return { ...r, order: rule.order }
        return r
      })
    })
  }, [])

  // Delete rule
  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId))
  }, [])

  // Duplicate rule
  const duplicateRule = useCallback((rule: Rule) => {
    const newRule: Rule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (副本)`,
      order: rule.order + 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setRules(prev => [...prev, newRule])
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((rule: Rule) => {
    setDraggedRule(rule)
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Handle drop
  const handleDrop = useCallback((targetRule: Rule) => {
    if (!draggedRule || draggedRule.id === targetRule.id) return
    if (draggedRule.category !== targetRule.category) return

    setRules(prev => prev.map(r => {
      if (r.id === draggedRule.id) return { ...r, order: targetRule.order }
      if (r.id === targetRule.id) return { ...r, order: draggedRule.order }
      return r
    }))
    setDraggedRule(null)
  }, [draggedRule])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rules 规则列表管理</h2>
          <p className="text-muted-foreground">
            分组展示规则、支持启用/禁用和排序
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">总规则数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
            <div className="text-xs text-muted-foreground">已启用</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{stats.disabled}</div>
            <div className="text-xs text-muted-foreground">已禁用</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">关键优先级</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <div className="text-xs text-muted-foreground">高优先级</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索规则名称、描述或标签..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="text-sm border rounded px-2 py-1.5"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as RuleCategory | 'all')}
              >
                <option value="all">全部类别</option>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>
              <select
                className="text-sm border rounded px-2 py-1.5"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as RuleStatus | 'all')}
              >
                <option value="all">全部状态</option>
                <option value="enabled">已启用</option>
                <option value="disabled">已禁用</option>
                <option value="deprecated">已弃用</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              setSearchQuery('')
              setFilterCategory('all')
              setFilterStatus('all')
            }}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rule Groups */}
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {groupedRules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ListOrdered className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">没有找到匹配的规则</p>
              </CardContent>
            </Card>
          ) : (
            groupedRules.map(group => (
              <Card key={group.category}>
                <CardContent className="pt-4">
                  {/* Category Header */}
                  <button
                    className="w-full flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => toggleCategory(group.category)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={group.color}>
                        {group.icon}
                        <span className="ml-1">{group.name}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {group.rules.length} 条规则
                      </span>
                    </div>
                    {expandedCategories.has(group.category) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Rules List */}
                  {expandedCategories.has(group.category) && (
                    <div className="mt-3 space-y-2">
                      {group.rules.map(rule => (
                        <div
                          key={rule.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            rule.status === 'disabled'
                              ? 'opacity-60 bg-muted/30'
                              : 'hover:bg-muted/50'
                          }`}
                          draggable
                          onDragStart={() => handleDragStart(rule)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(rule)}
                        >
                          {/* Drag Handle */}
                          <div className="flex items-center gap-1 mt-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          </div>

                          {/* Rule Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{rule.name}</span>
                              <Badge className={PRIORITY_CONFIG[rule.priority].color}>
                                {PRIORITY_CONFIG[rule.priority].label}
                              </Badge>
                              {rule.status === 'enabled' ? (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  启用
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600 border-gray-300">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  禁用
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {rule.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rule.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => moveRule(rule.id, 'up')}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>上移</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => moveRule(rule.id, 'down')}
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>下移</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => toggleRuleStatus(rule.id)}
                                  >
                                    {rule.status === 'enabled' ? (
                                      <ToggleRight className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {rule.status === 'enabled' ? '禁用' : '启用'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => duplicateRule(rule)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  复制
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => deleteRule(rule.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
