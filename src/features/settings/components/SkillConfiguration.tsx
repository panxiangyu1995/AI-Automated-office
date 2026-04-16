/**
 * Skill Configuration Component
 * Story 21.9 - Skill配置管理
 * 
 * Features:
 * - List installed Skills and their status
 * - Configure Skill parameters and enablement
 * - Show progressive loading and downgrade behavior
 * 
 * FR: FR835, FR836, FR837, FR838, FR839, FR840
 * NFR: NFR16
 * ARCH: ADR-046
 * UX: UX-02, UX-04
 */

import { useState, useMemo, useCallback } from 'react'
import { 
  Settings, Package, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Search,
  Clock, Zap,
  Layers, FileText, ArrowRight, Pause,
  ExternalLink, History,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'

// Types
export type SkillStatus = 'installed' | 'loading' | 'active' | 'error' | 'disabled' | 'deprecated'
export type SkillSource = 'builtin' | 'marketplace' | 'local' | 'enterprise' | 'external'
export type SkillScope = 'global' | 'tenant' | 'user' | 'session'
export type LoadPriority = 'critical' | 'high' | 'normal' | 'low' | 'deferred'
export type DowngradeTrigger = 'load_failure' | 'timeout' | 'memory_pressure' | 'manual' | 'dependency_failure'
export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'select' | 'multiselect'

export interface SkillParameter {
  name: string
  displayName: string
  description: string
  type: ParameterType
  required: boolean
  defaultValue: unknown
  currentValue?: unknown
  options?: { label: string; value: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  sensitive?: boolean
}

export interface SkillDependency {
  skillId: string
  skillName: string
  version: string
  required: boolean
  status: 'satisfied' | 'missing' | 'version_mismatch' | 'loading'
}

export interface SkillDowngradeRecord {
  id: string
  timestamp: string
  fromVersion: string
  toVersion: string
  trigger: DowngradeTrigger
  reason: string
  recovered: boolean
}

export interface InstalledSkill {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  status: SkillStatus
  source: SkillSource
  scope: SkillScope
  loadPriority: LoadPriority
  enabled: boolean
  installedAt: string
  updatedAt: string
  author?: string
  homepage?: string
  documentation?: string
  parameters: SkillParameter[]
  dependencies: SkillDependency[]
  capabilities: string[]
  tags: string[]
  fileSize: number
  loadTime?: number
  errorMessage?: string
  downgradeHistory: SkillDowngradeRecord[]
  metadata?: {
    license?: string
    repository?: string
    keywords?: string[]
    [key: string]: unknown
  }
}

export interface SkillConfigState {
  skills: InstalledSkill[]
  loading: boolean
  searchQuery: string
  statusFilter: SkillStatus | 'all'
  sourceFilter: SkillSource | 'all'
  scopeFilter: SkillScope | 'all'
  selectedSkill: InstalledSkill | null
  configDialogOpen: boolean
  auditDialogOpen: boolean
}

export interface SkillStats {
  total: number
  installed: number
  active: number
  error: number
  disabled: number
  loading: number
}

// Mock data for demonstration
const mockSkills: InstalledSkill[] = [
  {
    id: 'skill-1',
    name: 'code-review',
    displayName: '代码审查助手',
    description: '自动分析代码质量、安全漏洞和最佳实践违规',
    version: '2.1.0',
    status: 'active',
    source: 'builtin',
    scope: 'global',
    loadPriority: 'high',
    enabled: true,
    installedAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-03-20T14:22:00Z',
    author: 'AI-Automated-office',
    parameters: [
      {
        name: 'reviewDepth',
        displayName: '审查深度',
        description: '代码审查的分析深度',
        type: 'select',
        required: false,
        defaultValue: 'standard',
        currentValue: 'deep',
        options: [
          { label: '快速', value: 'quick' },
          { label: '标准', value: 'standard' },
          { label: '深度', value: 'deep' }
        ]
      },
      {
        name: 'includeSecurityCheck',
        displayName: '安全检查',
        description: '是否包含安全漏洞检测',
        type: 'boolean',
        required: false,
        defaultValue: true,
        currentValue: true
      },
      {
        name: 'maxFileSize',
        displayName: '最大文件大小',
        description: '单个文件最大分析大小（KB）',
        type: 'number',
        required: false,
        defaultValue: 500,
        currentValue: 1000,
        validation: { min: 100, max: 5000 }
      }
    ],
    dependencies: [],
    capabilities: ['code-analysis', 'security-scan', 'best-practice'],
    tags: ['developer', 'code-quality', 'security'],
    fileSize: 2048000,
    loadTime: 450,
    downgradeHistory: [],
    metadata: {
      license: 'MIT',
      repository: 'https://github.com/example/code-review',
      keywords: ['code', 'review', 'quality']
    }
  },
  {
    id: 'skill-2',
    name: 'document-writer',
    displayName: '文档撰写助手',
    description: '辅助生成技术文档、API文档和用户手册',
    version: '1.5.3',
    status: 'active',
    source: 'marketplace',
    scope: 'tenant',
    loadPriority: 'normal',
    enabled: true,
    installedAt: '2026-02-10T08:15:00Z',
    updatedAt: '2026-03-18T11:00:00Z',
    author: 'DocHelper Inc.',
    homepage: 'https://dochelper.io',
    parameters: [
      {
        name: 'outputFormat',
        displayName: '输出格式',
        description: '文档输出的格式',
        type: 'select',
        required: true,
        defaultValue: 'markdown',
        currentValue: 'markdown',
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
          { label: 'PDF', value: 'pdf' }
        ]
      },
      {
        name: 'language',
        displayName: '语言',
        description: '文档语言',
        type: 'string',
        required: false,
        defaultValue: 'zh-CN',
        currentValue: 'zh-CN'
      }
    ],
    dependencies: [
      {
        skillId: 'skill-1',
        skillName: 'code-review',
        version: '>=2.0.0',
        required: false,
        status: 'satisfied'
      }
    ],
    capabilities: ['document-generation', 'api-docs', 'user-guide'],
    tags: ['documentation', 'writing', 'api'],
    fileSize: 1536000,
    loadTime: 320,
    downgradeHistory: [],
    metadata: {
      license: 'Apache-2.0'
    }
  },
  {
    id: 'skill-3',
    name: 'data-analyzer',
    displayName: '数据分析助手',
    description: '自动分析数据集，生成统计报告和可视化图表',
    version: '3.0.1',
    status: 'loading',
    source: 'marketplace',
    scope: 'user',
    loadPriority: 'normal',
    enabled: true,
    installedAt: '2026-03-24T09:00:00Z',
    updatedAt: '2026-03-24T09:00:00Z',
    author: 'DataTools Co.',
    parameters: [],
    dependencies: [
      {
        skillId: 'skill-external-1',
        skillName: 'chart-renderer',
        version: '>=1.0.0',
        required: true,
        status: 'loading'
      }
    ],
    capabilities: ['data-analysis', 'statistics', 'visualization'],
    tags: ['data', 'analytics', 'charts'],
    fileSize: 5120000,
    downgradeHistory: []
  },
  {
    id: 'skill-4',
    name: 'email-assistant',
    displayName: '邮件助手',
    description: '自动处理邮件分类、回复草稿和日程安排',
    version: '1.2.0',
    status: 'error',
    source: 'external',
    scope: 'user',
    loadPriority: 'low',
    enabled: false,
    installedAt: '2026-03-20T16:45:00Z',
    updatedAt: '2026-03-24T08:30:00Z',
    author: 'MailBot Ltd.',
    errorMessage: '依赖服务不可用：IMAP连接超时',
    parameters: [
      {
        name: 'imapServer',
        displayName: 'IMAP服务器',
        description: '邮件服务器地址',
        type: 'string',
        required: true,
        defaultValue: '',
        currentValue: 'imap.example.com',
        sensitive: false
      },
      {
        name: 'apiKey',
        displayName: 'API密钥',
        description: '邮件服务API密钥',
        type: 'string',
        required: true,
        defaultValue: '',
        currentValue: '***',
        sensitive: true
      }
    ],
    dependencies: [],
    capabilities: ['email-classification', 'draft-generation', 'scheduling'],
    tags: ['email', 'communication', 'automation'],
    fileSize: 768000,
    downgradeHistory: [
      {
        id: 'dg-1',
        timestamp: '2026-03-23T14:00:00Z',
        fromVersion: '1.3.0',
        toVersion: '1.2.0',
        trigger: 'dependency_failure',
        reason: '依赖的邮件模板服务停止支持',
        recovered: false
      }
    ]
  },
  {
    id: 'skill-5',
    name: 'legacy-connector',
    displayName: '旧版连接器',
    description: '连接旧版系统的适配器',
    version: '0.9.5',
    status: 'deprecated',
    source: 'enterprise',
    scope: 'tenant',
    loadPriority: 'deferred',
    enabled: false,
    installedAt: '2025-11-01T10:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
    author: 'Enterprise Solutions',
    parameters: [],
    dependencies: [],
    capabilities: ['legacy-adapter'],
    tags: ['legacy', 'adapter'],
    fileSize: 256000,
    downgradeHistory: []
  }
]

// Helper functions
const getStatusBadge = (status: SkillStatus) => {
  const variants: Record<SkillStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; icon: typeof CheckCircle2 }> = {
    installed: { variant: 'secondary', className: 'bg-gray-100 text-gray-700', icon: Package },
    loading: { variant: 'secondary', className: 'bg-blue-100 text-blue-700', icon: Loader2 },
    active: { variant: 'default', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    error: { variant: 'destructive', className: 'bg-red-100 text-red-700', icon: XCircle },
    disabled: { variant: 'secondary', className: 'bg-gray-100 text-gray-500', icon: Pause },
    deprecated: { variant: 'outline', className: 'bg-orange-100 text-orange-700', icon: AlertTriangle }
  }
  const config = variants[status]
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className={`w-3 h-3 mr-1 ${status === 'loading' ? 'animate-spin' : ''}`} />
      {status === 'installed' ? '已安装' : 
       status === 'loading' ? '加载中' :
       status === 'active' ? '运行中' :
       status === 'error' ? '错误' :
       status === 'disabled' ? '已禁用' : '已弃用'}
    </Badge>
  )
}

const getSourceBadge = (source: SkillSource) => {
  const labels: Record<SkillSource, { label: string; className: string }> = {
    builtin: { label: '内置', className: 'bg-purple-100 text-purple-700' },
    marketplace: { label: '市场', className: 'bg-blue-100 text-blue-700' },
    local: { label: '本地', className: 'bg-gray-100 text-gray-700' },
    enterprise: { label: '企业', className: 'bg-amber-100 text-amber-700' },
    external: { label: '外部', className: 'bg-cyan-100 text-cyan-700' }
  }
  const config = labels[source]
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>
}

const getPriorityBadge = (priority: LoadPriority) => {
  const colors: Record<LoadPriority, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    normal: 'text-blue-600 bg-blue-50',
    low: 'text-gray-600 bg-gray-50',
    deferred: 'text-gray-400 bg-gray-50'
  }
  const labels: Record<LoadPriority, string> = {
    critical: '关键',
    high: '高',
    normal: '普通',
    low: '低',
    deferred: '延迟'
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[priority]}`}>
      {labels[priority]}
    </span>
  )
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function SkillConfiguration() {
  const [state, setState] = useState<SkillConfigState>({
    skills: mockSkills,
    loading: false,
    searchQuery: '',
    statusFilter: 'all',
    sourceFilter: 'all',
    scopeFilter: 'all',
    selectedSkill: null,
    configDialogOpen: false,
    auditDialogOpen: false
  })

  const [parameterValues, setParameterValues] = useState<Record<string, unknown>>({})

  // Computed stats
  const stats = useMemo<SkillStats>(() => {
    return {
      total: state.skills.length,
      installed: state.skills.filter(s => s.status === 'installed').length,
      active: state.skills.filter(s => s.status === 'active').length,
      error: state.skills.filter(s => s.status === 'error').length,
      disabled: state.skills.filter(s => s.status === 'disabled').length,
      loading: state.skills.filter(s => s.status === 'loading').length
    }
  }, [state.skills])

  // Filtered skills
  const filteredSkills = useMemo(() => {
    return state.skills.filter(skill => {
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        if (!skill.name.toLowerCase().includes(query) &&
            !skill.displayName.toLowerCase().includes(query) &&
            !skill.description.toLowerCase().includes(query) &&
            !skill.tags.some(t => t.toLowerCase().includes(query))) {
          return false
        }
      }
      if (state.statusFilter !== 'all' && skill.status !== state.statusFilter) {
        return false
      }
      if (state.sourceFilter !== 'all' && skill.source !== state.sourceFilter) {
        return false
      }
      if (state.scopeFilter !== 'all' && skill.scope !== state.scopeFilter) {
        return false
      }
      return true
    })
  }, [state.skills, state.searchQuery, state.statusFilter, state.sourceFilter, state.scopeFilter])

  // Handlers
  const handleToggleEnable = useCallback((skillId: string) => {
    setState(prev => ({
      ...prev,
      skills: prev.skills.map(s => 
        s.id === skillId ? { ...s, enabled: !s.enabled, status: !s.enabled ? 'active' : 'disabled' } : s
      )
    }))
  }, [])

  const handleOpenConfig = useCallback((skill: InstalledSkill) => {
    setState(prev => ({
      ...prev,
      selectedSkill: skill,
      configDialogOpen: true
    }))
    // Initialize parameter values
    const values: Record<string, unknown> = {}
    skill.parameters.forEach(p => {
      values[p.name] = p.currentValue !== undefined ? p.currentValue : p.defaultValue
    })
    setParameterValues(values)
  }, [])

  const handleSaveConfig = useCallback(() => {
    if (!state.selectedSkill) return
    
    setState(prev => ({
      ...prev,
      skills: prev.skills.map(s => 
        s.id === prev.selectedSkill?.id 
          ? { 
              ...s, 
              parameters: s.parameters.map(p => ({
                ...p,
                currentValue: parameterValues[p.name]
              })),
              updatedAt: new Date().toISOString()
            } 
          : s
      ),
      configDialogOpen: false,
      selectedSkill: null
    }))
    setParameterValues({})
  }, [state.selectedSkill, parameterValues])

  const handleRetryLoad = useCallback((skillId: string) => {
    setState(prev => ({
      ...prev,
      skills: prev.skills.map(s => 
        s.id === skillId ? { ...s, status: 'loading', errorMessage: undefined } : s
      )
    }))
  }, [])

  const handleUnload = useCallback((skillId: string) => {
    setState(prev => ({
      ...prev,
      skills: prev.skills.map(s => 
        s.id === skillId ? { ...s, status: 'disabled', enabled: false } : s
      )
    }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">总技能</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">运行中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.loading}</div>
            <div className="text-sm text-muted-foreground">加载中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.error}</div>
            <div className="text-sm text-muted-foreground">错误</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-500">{stats.disabled}</div>
            <div className="text-sm text-muted-foreground">已禁用</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.installed}</div>
            <div className="text-sm text-muted-foreground">已安装</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索技能..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={state.statusFilter} onValueChange={(v) => setState(prev => ({ ...prev, statusFilter: v as SkillStatus | 'all' }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">运行中</SelectItem>
                <SelectItem value="loading">加载中</SelectItem>
                <SelectItem value="error">错误</SelectItem>
                <SelectItem value="disabled">已禁用</SelectItem>
                <SelectItem value="deprecated">已弃用</SelectItem>
              </SelectContent>
            </Select>
            <Select value={state.sourceFilter} onValueChange={(v) => setState(prev => ({ ...prev, sourceFilter: v as SkillSource | 'all' }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="builtin">内置</SelectItem>
                <SelectItem value="marketplace">市场</SelectItem>
                <SelectItem value="local">本地</SelectItem>
                <SelectItem value="enterprise">企业</SelectItem>
                <SelectItem value="external">外部</SelectItem>
              </SelectContent>
            </Select>
            <Select value={state.scopeFilter} onValueChange={(v) => setState(prev => ({ ...prev, scopeFilter: v as SkillScope | 'all' }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部范围</SelectItem>
                <SelectItem value="global">全局</SelectItem>
                <SelectItem value="tenant">租户</SelectItem>
                <SelectItem value="user">用户</SelectItem>
                <SelectItem value="session">会话</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Skill List */}
      <div className="space-y-4">
        {filteredSkills.length === 0 ? (
          <Card>
            <CardContent className="pt-0">
              <EmptyState icon={Package} variant="search" title="未找到匹配的技能" description="没有找到匹配的技能，请尝试其他搜索条件" />
            </CardContent>
          </Card>
        ) : (
          filteredSkills.map(skill => (
            <Card key={skill.id} className={skill.status === 'deprecated' ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{skill.displayName}</CardTitle>
                      {getStatusBadge(skill.status)}
                      {getSourceBadge(skill.source)}
                    </div>
                    <CardDescription>{skill.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Switch
                            checked={skill.enabled}
                            onCheckedChange={() => handleToggleEnable(skill.id)}
                            disabled={skill.status === 'deprecated'}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {skill.enabled ? '点击禁用' : '点击启用'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status bar for loading skills */}
                  {skill.status === 'loading' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">正在加载...</span>
                        <span className="text-muted-foreground">
                          {skill.dependencies.filter(d => d.status === 'loading').length} / {skill.dependencies.length} 依赖加载中
                        </span>
                      </div>
                      <Progress value={50} className="h-1" />
                    </div>
                  )}

                  {/* Error message */}
                  {skill.status === 'error' && skill.errorMessage && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>{skill.errorMessage}</span>
                    </div>
                  )}

                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>v{skill.version}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span>{skill.scope === 'global' ? '全局' : 
                             skill.scope === 'tenant' ? '租户' :
                             skill.scope === 'user' ? '用户' : '会话'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      {getPriorityBadge(skill.loadPriority)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatFileSize(skill.fileSize)}</span>
                    </div>
                    {skill.loadTime && (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDuration(skill.loadTime)} 加载</span>
                      </div>
                    )}
                  </div>

                  {/* Dependencies */}
                  {skill.dependencies.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">依赖项</Label>
                      <div className="flex flex-wrap gap-2">
                        {skill.dependencies.map(dep => (
                          <Badge 
                            key={dep.skillId} 
                            variant="outline"
                            className={dep.status === 'satisfied' ? 'border-green-300 text-green-700' :
                                       dep.status === 'loading' ? 'border-blue-300 text-blue-700' :
                                       'border-red-300 text-red-700'}
                          >
                            {dep.skillName} ({dep.version})
                            {dep.status === 'satisfied' && <CheckCircle2 className="ml-1 h-3 w-3" />}
                            {dep.status === 'loading' && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
                            {dep.status === 'missing' && <XCircle className="ml-1 h-3 w-3" />}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Capabilities */}
                  {skill.capabilities.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">能力</Label>
                      <div className="flex flex-wrap gap-1">
                        {skill.capabilities.map(cap => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {skill.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Downgrade warning */}
                  {skill.downgradeHistory.length > 0 && !skill.downgradeHistory[skill.downgradeHistory.length - 1].recovered && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        已降级至 v{skill.downgradeHistory[skill.downgradeHistory.length - 1].toVersion}
                        <span className="text-muted-foreground ml-2">
                          ({skill.downgradeHistory[skill.downgradeHistory.length - 1].reason})
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenConfig(skill)}
                      disabled={skill.parameters.length === 0 || skill.status === 'deprecated'}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      配置
                    </Button>
                    {skill.status === 'error' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRetryLoad(skill.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        重试
                      </Button>
                    )}
                    {skill.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnload(skill.id)}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        卸载
                      </Button>
                    )}
                    {skill.downgradeHistory.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setState(prev => ({ ...prev, selectedSkill: skill, auditDialogOpen: true }))
                        }}
                      >
                        <History className="h-4 w-4 mr-1" />
                        降级历史
                      </Button>
                    )}
                    {skill.homepage && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={skill.homepage} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          主页
                        </a>
                      </Button>
                    )}
                    {skill.documentation && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={skill.documentation} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-1" />
                          文档
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Config Dialog */}
      <Dialog open={state.configDialogOpen} onOpenChange={(open) => setState(prev => ({ ...prev, configDialogOpen: open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {state.selectedSkill?.displayName} 配置
            </DialogTitle>
            <DialogDescription>
              配置技能参数和运行时行为
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {state.selectedSkill?.parameters.map(param => (
              <div key={param.name} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={param.name}>{param.displayName}</Label>
                  {param.required && <Badge variant="outline" className="text-xs">必填</Badge>}
                  {param.sensitive && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">敏感</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{param.description}</p>
                
                {param.type === 'string' && (
                  <Input
                    id={param.name}
                    value={String(parameterValues[param.name] || '')}
                    onChange={(e) => setParameterValues(prev => ({ ...prev, [param.name]: e.target.value }))}
                    type={param.sensitive ? 'password' : 'text'}
                    placeholder={`默认: ${String(param.defaultValue)}`}
                  />
                )}
                
                {param.type === 'number' && (
                  <Input
                    id={param.name}
                    type="number"
                    value={Number(parameterValues[param.name]) || ''}
                    onChange={(e) => setParameterValues(prev => ({ ...prev, [param.name]: Number(e.target.value) }))}
                    min={param.validation?.min}
                    max={param.validation?.max}
                    placeholder={`默认: ${param.defaultValue}`}
                  />
                )}
                
                {param.type === 'boolean' && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(parameterValues[param.name])}
                      onCheckedChange={(checked) => setParameterValues(prev => ({ ...prev, [param.name]: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {parameterValues[param.name] ? '是' : '否'}
                    </span>
                  </div>
                )}
                
                {param.type === 'select' && param.options && (
                  <Select
                    value={String(parameterValues[param.name] || '')}
                    onValueChange={(v) => setParameterValues(prev => ({ ...prev, [param.name]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择..." />
                    </SelectTrigger>
                    <SelectContent>
                      {param.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {param.type === 'array' && (
                  <Textarea
                    id={param.name}
                    value={Array.isArray(parameterValues[param.name]) 
                      ? (parameterValues[param.name] as string[]).join('\n') 
                      : ''}
                    onChange={(e) => setParameterValues(prev => ({ 
                      ...prev, 
                      [param.name]: e.target.value.split('\n').filter(Boolean) 
                    }))}
                    placeholder="每行一个值"
                    rows={3}
                  />
                )}
                
                {param.type === 'object' && (
                  <Textarea
                    id={param.name}
                    value={typeof parameterValues[param.name] === 'object' 
                      ? JSON.stringify(parameterValues[param.name], null, 2) 
                      : ''}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        setParameterValues(prev => ({ ...prev, [param.name]: parsed }))
                      } catch {
                        // Invalid JSON, keep as string temporarily
                      }
                    }}
                    placeholder="JSON 格式"
                    rows={4}
                    className="font-mono text-sm"
                  />
                )}
                
                {param.validation && param.validation.message && (
                  <p className="text-xs text-muted-foreground">{param.validation.message}</p>
                )}
              </div>
            ))}

            {state.selectedSkill?.parameters.length === 0 && (
              <EmptyState variant="default" title="没有可配置的参数" description="此技能没有可配置的参数" />
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setState(prev => ({ ...prev, configDialogOpen: false }))}
            >
              取消
            </Button>
            <Button onClick={handleSaveConfig}>
              保存配置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade History Dialog */}
      <Dialog open={state.auditDialogOpen} onOpenChange={(open) => setState(prev => ({ ...prev, auditDialogOpen: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>降级历史</DialogTitle>
            <DialogDescription>
              {state.selectedSkill?.displayName} 的版本降级记录
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {state.selectedSkill?.downgradeHistory.map(record => (
              <Card key={record.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">
                          v{record.fromVersion} → v{record.toVersion}
                        </span>
                        {record.recovered && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            已恢复
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{record.reason}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(record.timestamp).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {record.trigger === 'load_failure' ? '加载失败' :
                       record.trigger === 'timeout' ? '超时' :
                       record.trigger === 'memory_pressure' ? '内存压力' :
                       record.trigger === 'manual' ? '手动' : '依赖失败'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {state.selectedSkill?.downgradeHistory.length === 0 && (
              <EmptyState variant="default" title="没有降级历史记录" description="此技能没有降级历史记录" />
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setState(prev => ({ ...prev, auditDialogOpen: false }))}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SkillConfiguration
