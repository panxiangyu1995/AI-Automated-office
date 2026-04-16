/**
 * MCP Approve Policy - Story 21.6
 * MCP工具Approve策略配置
 * 
 * 功能：
 * - 支持 auto, confirm, deny 三种策略
 * - 应用默认策略和每个工具的策略覆盖
 * - 暴露有效策略给运行时和 UI
 * 
 * 铁律合规：
 * - FR825, FR826, FR827, FR828
 * - NFR16 (权限控制)
 * - ADR-039 (元数据驱动配置)
 * - UX-02, UX-04
 */

import { useState, useMemo, useCallback } from 'react'
import { 
  Shield, CheckCircle2, XCircle, HelpCircle,
  Save, Search, ChevronRight,
  User, Eye, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Types
export type ApprovePolicy = 'auto' | 'confirm' | 'deny'
export type PolicyScope = 'global' | 'service' | 'tool'
export type PolicySource = 'default' | 'override' | 'condition'

export interface PolicyCondition {
  id: string
  name: string
  type: 'risk_level' | 'time_window' | 'param_pattern' | 'user_role'
  value: string | number | string[] | Record<string, unknown>
  policy: ApprovePolicy
  enabled: boolean
  priority: number
  description?: string
}

export interface ToolApprovePolicy {
  id: string
  toolId: string
  toolName: string
  serviceId: string
  serviceName: string
  defaultPolicy: ApprovePolicy
  effectivePolicy: ApprovePolicy
  policySource: PolicySource
  override?: ApprovePolicy
  conditions?: PolicyCondition[]
  lastModified: string
  modifiedBy: string
  description?: string
  tags?: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  usageCount: number
  lastUsed?: string
}

export interface PolicyAuditEntry {
  id: string
  timestamp: string
  actor: string
  action: 'create' | 'update' | 'delete' | 'apply'
  scope: PolicyScope
  targetId: string
  targetName: string
  previousPolicy?: ApprovePolicy
  newPolicy?: ApprovePolicy
  reason?: string
  details?: Record<string, unknown>
}

export interface DefaultPolicyConfig {
  scope: PolicyScope
  scopeId?: string
  scopeName?: string
  defaultPolicy: ApprovePolicy
  inheritFromParent: boolean
  conditions: PolicyCondition[]
  createdAt: string
  updatedAt: string
}

export interface PolicyStats {
  totalTools: number
  autoApproved: number
  requireConfirm: number
  denied: number
  byService: Record<string, { total: number; auto: number; confirm: number; deny: number }>
  recentChanges: number
  auditEntries: number
}

export interface ApprovePolicyState {
  policies: ToolApprovePolicy[]
  defaultConfigs: DefaultPolicyConfig[]
  conditions: PolicyCondition[]
  auditLog: PolicyAuditEntry[]
  stats: PolicyStats
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

// Mock data generators
const generateMockPolicies = (): ToolApprovePolicy[] => [
  {
    id: 'policy-1',
    toolId: 'tool-1',
    toolName: 'read_file',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    defaultPolicy: 'auto',
    effectivePolicy: 'auto',
    policySource: 'default',
    lastModified: '2026-03-24T10:00:00Z',
    modifiedBy: 'system',
    tags: ['filesystem', 'read', 'safe'],
    riskLevel: 'low',
    usageCount: 1234,
    lastUsed: '2026-03-24T10:30:00Z',
  },
  {
    id: 'policy-2',
    toolId: 'tool-2',
    toolName: 'write_file',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    defaultPolicy: 'confirm',
    effectivePolicy: 'confirm',
    policySource: 'default',
    lastModified: '2026-03-24T10:00:00Z',
    modifiedBy: 'system',
    tags: ['filesystem', 'write', 'modify'],
    riskLevel: 'medium',
    usageCount: 567,
    lastUsed: '2026-03-24T10:00:00Z',
  },
  {
    id: 'policy-3',
    toolId: 'tool-3',
    toolName: 'delete_file',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    defaultPolicy: 'confirm',
    effectivePolicy: 'deny',
    policySource: 'override',
    override: 'deny',
    lastModified: '2026-03-23T15:00:00Z',
    modifiedBy: 'admin',
    tags: ['filesystem', 'delete', 'dangerous'],
    riskLevel: 'critical',
    usageCount: 12,
    lastUsed: '2026-03-20T08:00:00Z',
  },
  {
    id: 'policy-4',
    toolId: 'tool-4',
    toolName: 'execute_command',
    serviceId: 'mcp-2',
    serviceName: 'shell',
    defaultPolicy: 'confirm',
    effectivePolicy: 'confirm',
    policySource: 'condition',
    conditions: [
      {
        id: 'cond-1',
        name: '工作时间限制',
        type: 'time_window',
        value: '09:00-18:00',
        policy: 'confirm',
        enabled: true,
        priority: 1,
      },
    ],
    lastModified: '2026-03-22T12:00:00Z',
    modifiedBy: 'admin',
    tags: ['shell', 'execute', 'dangerous'],
    riskLevel: 'high',
    usageCount: 89,
    lastUsed: '2026-03-24T09:45:00Z',
  },
  {
    id: 'policy-5',
    toolId: 'tool-5',
    toolName: 'search_web',
    serviceId: 'mcp-3',
    serviceName: 'brave-search',
    defaultPolicy: 'auto',
    effectivePolicy: 'auto',
    policySource: 'default',
    lastModified: '2026-03-24T08:00:00Z',
    modifiedBy: 'system',
    tags: ['search', 'web', 'api'],
    riskLevel: 'low',
    usageCount: 890,
    lastUsed: '2026-03-24T09:30:00Z',
  },
  {
    id: 'policy-6',
    toolId: 'tool-6',
    toolName: 'query_database',
    serviceId: 'mcp-4',
    serviceName: 'postgres',
    defaultPolicy: 'confirm',
    effectivePolicy: 'confirm',
    policySource: 'default',
    lastModified: '2026-03-24T08:00:00Z',
    modifiedBy: 'system',
    tags: ['database', 'sql', 'sensitive'],
    riskLevel: 'high',
    usageCount: 45,
    lastUsed: '2026-03-23T16:00:00Z',
  },
]

const generateMockDefaultConfigs = (): DefaultPolicyConfig[] => [
  {
    scope: 'global',
    scopeName: '全局默认',
    defaultPolicy: 'auto',
    inheritFromParent: false,
    conditions: [],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
  },
  {
    scope: 'service',
    scopeId: 'mcp-1',
    scopeName: 'filesystem',
    defaultPolicy: 'auto',
    inheritFromParent: true,
    conditions: [],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
  },
  {
    scope: 'service',
    scopeId: 'mcp-2',
    scopeName: 'shell',
    defaultPolicy: 'confirm',
    inheritFromParent: false,
    conditions: [
      {
        id: 'cond-2',
        name: '高风险命令需要确认',
        type: 'risk_level',
        value: 'high',
        policy: 'deny',
        enabled: true,
        priority: 2,
        description: '当检测到高风险命令时自动拒绝',
      },
    ],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
  },
]

const generateMockConditions = (): PolicyCondition[] => [
  {
    id: 'cond-1',
    name: '工作时间限制',
    type: 'time_window',
    value: '09:00-18:00',
    policy: 'confirm',
    enabled: true,
    priority: 1,
    description: '工作时间内需要确认',
  },
  {
    id: 'cond-2',
    name: '高风险操作',
    type: 'risk_level',
    value: 'high',
    policy: 'deny',
    enabled: true,
    priority: 2,
    description: '高风险操作自动拒绝',
  },
  {
    id: 'cond-3',
    name: '管理员角色豁免',
    type: 'user_role',
    value: ['admin', 'superadmin'],
    policy: 'auto',
    enabled: true,
    priority: 3,
    description: '管理员角色自动批准',
  },
  {
    id: 'cond-4',
    name: '敏感路径保护',
    type: 'param_pattern',
    value: '/etc/*,/root/*,.env,*password*',
    policy: 'deny',
    enabled: true,
    priority: 4,
    description: '敏感路径访问自动拒绝',
  },
]

const generateMockAuditLog = (): PolicyAuditEntry[] => [
  {
    id: 'audit-1',
    timestamp: '2026-03-24T10:30:00Z',
    actor: 'admin',
    action: 'update',
    scope: 'tool',
    targetId: 'tool-3',
    targetName: 'delete_file',
    previousPolicy: 'confirm',
    newPolicy: 'deny',
    reason: '安全策略收紧，禁止删除操作',
  },
  {
    id: 'audit-2',
    timestamp: '2026-03-24T09:00:00Z',
    actor: 'system',
    action: 'apply',
    scope: 'global',
    targetId: 'global',
    targetName: '全局默认策略',
    newPolicy: 'auto',
  },
  {
    id: 'audit-3',
    timestamp: '2026-03-23T15:00:00Z',
    actor: 'admin',
    action: 'create',
    scope: 'service',
    targetId: 'mcp-2',
    targetName: 'shell',
    newPolicy: 'confirm',
    reason: '新增 shell 服务默认策略',
  },
]

const generateMockStats = (policies: ToolApprovePolicy[]): PolicyStats => {
  const byService: Record<string, { total: number; auto: number; confirm: number; deny: number }> = {}
  
  policies.forEach(p => {
    if (!byService[p.serviceId]) {
      byService[p.serviceId] = { total: 0, auto: 0, confirm: 0, deny: 0 }
    }
    byService[p.serviceId].total++
    if (p.effectivePolicy === 'auto') byService[p.serviceId].auto++
    else if (p.effectivePolicy === 'confirm') byService[p.serviceId].confirm++
    else byService[p.serviceId].deny++
  })

  return {
    totalTools: policies.length,
    autoApproved: policies.filter(p => p.effectivePolicy === 'auto').length,
    requireConfirm: policies.filter(p => p.effectivePolicy === 'confirm').length,
    denied: policies.filter(p => p.effectivePolicy === 'deny').length,
    byService,
    recentChanges: 3,
    auditEntries: generateMockAuditLog().length,
  }
}

// Policy Badge Component
function PolicyBadge({ policy }: { policy: ApprovePolicy }) {
  const config: Record<ApprovePolicy, { color: string; icon: typeof CheckCircle2; label: string }> = {
    auto: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2, label: '自动批准' },
    confirm: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: HelpCircle, label: '需要确认' },
    deny: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle, label: '拒绝执行' },
  }
  const { color, icon: Icon, label } = config[policy]
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// Risk Level Badge
function RiskLevelBadge({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const config: Record<typeof level, { color: string; label: string }> = {
    low: { color: 'bg-green-50 text-green-600', label: '低风险' },
    medium: { color: 'bg-yellow-50 text-yellow-600', label: '中风险' },
    high: { color: 'bg-orange-50 text-orange-600', label: '高风险' },
    critical: { color: 'bg-red-50 text-red-600', label: '极高风险' },
  }
  const { color, label } = config[level]
  return <Badge className={color}>{label}</Badge>
}

// Source Badge
function SourceBadge({ source }: { source: PolicySource }) {
  const config: Record<PolicySource, { color: string; label: string }> = {
    default: { color: 'bg-gray-100 text-gray-600', label: '默认' },
    override: { color: 'bg-blue-100 text-blue-600', label: '覆盖' },
    condition: { color: 'bg-purple-100 text-purple-600', label: '条件' },
  }
  const { color, label } = config[source]
  return <Badge className={color}>{label}</Badge>
}

// Policy Card Component
function PolicyCard({ 
  policy, 
  onEdit,
  onViewEffective 
}: { 
  policy: ToolApprovePolicy
  onEdit: () => void
  onViewEffective: () => void
}) {
  return (
    <Card className={policy.effectivePolicy === 'deny' ? 'border-red-200' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {policy.toolName}
            </CardTitle>
            <PolicyBadge policy={policy.effectivePolicy} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onViewEffective}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span className="text-xs">{policy.serviceName}</span>
          <RiskLevelBadge level={policy.riskLevel} />
          <SourceBadge source={policy.policySource} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Policy Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">默认策略: </span>
              <PolicyBadge policy={policy.defaultPolicy} />
            </div>
            <div>
              <span className="text-muted-foreground">覆盖策略: </span>
              {policy.override ? <PolicyBadge policy={policy.override} /> : <span className="text-muted-foreground">-</span>}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium">{policy.usageCount}</div>
              <div className="text-muted-foreground">调用次数</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{policy.lastUsed ? new Date(policy.lastUsed).toLocaleDateString('zh-CN') : '-'}</div>
              <div className="text-muted-foreground">最后使用</div>
            </div>
          </div>

          {/* Tags */}
          {policy.tags && policy.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {policy.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Conditions */}
          {policy.conditions && policy.conditions.length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">生效条件:</div>
              <div className="space-y-1">
                {policy.conditions.map((cond) => (
                  <div key={cond.id} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{cond.name}</Badge>
                    <PolicyBadge policy={cond.policy} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Condition Card Component
function ConditionCard({ 
  condition, 
  onToggle,
  onEdit 
}: { 
  condition: PolicyCondition
  onToggle: () => void
  onEdit: () => void
}) {
  return (
    <Card className={condition.enabled ? '' : 'opacity-60'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {condition.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={condition.enabled}
              onCheckedChange={onToggle}
            />
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">类型:</span>
            <Badge variant="outline">
              {condition.type === 'risk_level' ? '风险级别' :
               condition.type === 'time_window' ? '时间窗口' :
               condition.type === 'param_pattern' ? '参数模式' : '用户角色'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">策略:</span>
            <PolicyBadge policy={condition.policy} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">优先级:</span>
            <span className="font-medium">{condition.priority}</span>
          </div>
          {condition.description && (
            <p className="text-muted-foreground text-xs">{condition.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Audit Log Entry Component
function AuditLogEntry({ entry }: { entry: PolicyAuditEntry }) {
  const actionConfig: Record<string, { color: string; label: string }> = {
    create: { color: 'bg-green-100 text-green-700', label: '创建' },
    update: { color: 'bg-blue-100 text-blue-700', label: '更新' },
    delete: { color: 'bg-red-100 text-red-700', label: '删除' },
    apply: { color: 'bg-purple-100 text-purple-700', label: '应用' },
  }
  const { color, label } = actionConfig[entry.action]

  return (
    <TableRow>
      <TableCell className="text-sm">
        {new Date(entry.timestamp).toLocaleString('zh-CN')}
      </TableCell>
      <TableCell>
        <Badge className={color}>{label}</Badge>
      </TableCell>
      <TableCell className="font-medium">{entry.targetName}</TableCell>
      <TableCell>
        <Badge variant="outline">
          {entry.scope === 'global' ? '全局' :
           entry.scope === 'service' ? '服务' : '工具'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {entry.previousPolicy && <PolicyBadge policy={entry.previousPolicy} />}
          {entry.previousPolicy && entry.newPolicy && <ChevronRight className="h-4 w-4" />}
          {entry.newPolicy && <PolicyBadge policy={entry.newPolicy} />}
        </div>
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {entry.actor}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {entry.reason || '-'}
      </TableCell>
    </TableRow>
  )
}

// Main Component
export function MCPApprovePolicy() {
  const [policies] = useState<ToolApprovePolicy[]>(generateMockPolicies())
  const [defaultConfigs] = useState<DefaultPolicyConfig[]>(generateMockDefaultConfigs())
  const [conditions] = useState<PolicyCondition[]>(generateMockConditions())
  const [auditLog] = useState<PolicyAuditEntry[]>(generateMockAuditLog())
  const [activeTab, setActiveTab] = useState<string>('policies')
  const [searchQuery, setSearchQuery] = useState('')
  const [policyFilter, setPolicyFilter] = useState<ApprovePolicy | 'all'>('all')
  const [riskFilter, setRiskFilter] = useState<'low' | 'medium' | 'high' | 'critical' | 'all'>('all')
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [effectiveDialogOpen, setEffectiveDialogOpen] = useState(false)
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<ToolApprovePolicy | null>(null)
  const [selectedCondition, setSelectedCondition] = useState<PolicyCondition | null>(null)
  
  const [isSaving, setIsSaving] = useState(false)

  const stats = useMemo(() => generateMockStats(policies), [policies])

  const filteredPolicies = useMemo(() => {
    return policies.filter(policy => {
      const matchesSearch = policy.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           policy.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPolicy = policyFilter === 'all' || policy.effectivePolicy === policyFilter
      const matchesRisk = riskFilter === 'all' || policy.riskLevel === riskFilter
      return matchesSearch && matchesPolicy && matchesRisk
    })
  }, [policies, searchQuery, policyFilter, riskFilter])

  const handleEditPolicy = useCallback((policy: ToolApprovePolicy) => {
    setSelectedPolicy(policy)
    setEditDialogOpen(true)
  }, [])

  const handleViewEffective = useCallback((policy: ToolApprovePolicy) => {
    setSelectedPolicy(policy)
    setEffectiveDialogOpen(true)
  }, [])

  const handleEditCondition = useCallback((condition: PolicyCondition) => {
    setSelectedCondition(condition)
    setConditionDialogOpen(true)
  }, [])

  const handleToggleCondition = useCallback((_condition: PolicyCondition) => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
    }, 500)
  }, [])

  const handleSavePolicy = useCallback(() => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setEditDialogOpen(false)
    }, 1000)
  }, [])

  const policyDistribution = useMemo(() => {
    return [
      { name: '自动批准', value: stats.autoApproved, color: 'bg-green-500' },
      { name: '需要确认', value: stats.requireConfirm, color: 'bg-yellow-500' },
      { name: '拒绝执行', value: stats.denied, color: 'bg-red-500' },
    ]
  }, [stats])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            MCP 工具 Approve 策略配置
          </h2>
          <p className="text-muted-foreground">
            配置工具执行的批准策略，支持自动批准、需要确认和拒绝执行
          </p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          保存配置
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalTools}</div>
            <div className="text-sm text-muted-foreground">总工具数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-5 w-5" />
              {stats.autoApproved}
            </div>
            <div className="text-sm text-muted-foreground">自动批准</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
              <HelpCircle className="h-5 w-5" />
              {stats.requireConfirm}
            </div>
            <div className="text-sm text-muted-foreground">需要确认</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600 flex items-center gap-1">
              <XCircle className="h-5 w-5" />
              {stats.denied}
            </div>
            <div className="text-sm text-muted-foreground">拒绝执行</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.recentChanges}</div>
            <div className="text-sm text-muted-foreground">近期变更</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.auditEntries}</div>
            <div className="text-sm text-muted-foreground">审计记录</div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Distribution */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">策略分布</span>
            <div className="flex gap-4 text-sm">
              {policyDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            {policyDistribution.map((item, idx) => (
              <div
                key={item.name}
                className={`${item.color} ${idx === 0 ? '' : 'border-l border-white/20'}`}
                style={{ width: `${(item.value / stats.totalTools) * 100}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="policies">工具策略</TabsTrigger>
          <TabsTrigger value="defaults">默认配置</TabsTrigger>
          <TabsTrigger value="conditions">条件规则</TabsTrigger>
          <TabsTrigger value="audit">审计日志</TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索工具或服务..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="px-3 py-2 border rounded-md text-sm"
                    value={policyFilter}
                    onChange={(e) => setPolicyFilter(e.target.value as ApprovePolicy | 'all')}
                  >
                    <option value="all">所有策略</option>
                    <option value="auto">自动批准</option>
                    <option value="confirm">需要确认</option>
                    <option value="deny">拒绝执行</option>
                  </select>
                  <select 
                    className="px-3 py-2 border rounded-md text-sm"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
                  >
                    <option value="all">所有风险</option>
                    <option value="low">低风险</option>
                    <option value="medium">中风险</option>
                    <option value="high">高风险</option>
                    <option value="critical">极高风险</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policies Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPolicies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onEdit={() => handleEditPolicy(policy)}
                onViewEffective={() => handleViewEffective(policy)}
              />
            ))}
          </div>

          {filteredPolicies.length === 0 && (
            <Card>
              <CardContent className="py-0">
                <EmptyState variant="search" title="没有找到匹配的策略配置" description="请尝试其他搜索条件" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>作用域</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>默认策略</TableHead>
                    <TableHead>继承上级</TableHead>
                    <TableHead>条件数</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaultConfigs.map((config) => (
                    <TableRow key={`${config.scope}-${config.scopeId || 'global'}`}>
                      <TableCell>
                        <Badge variant="outline">
                          {config.scope === 'global' ? '全局' :
                           config.scope === 'service' ? '服务' : '工具'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{config.scopeName}</TableCell>
                      <TableCell>
                        <PolicyBadge policy={config.defaultPolicy} />
                      </TableCell>
                      <TableCell>
                        {config.inheritFromParent ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>{config.conditions.length}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(config.updatedAt).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              条件规则允许根据特定条件动态调整策略
            </p>
            <Button>
              添加条件
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {conditions.map((condition) => (
              <ConditionCard
                key={condition.id}
                condition={condition}
                onToggle={() => handleToggleCondition(condition)}
                onEdit={() => handleEditCondition(condition)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>目标</TableHead>
                    <TableHead>作用域</TableHead>
                    <TableHead>策略变化</TableHead>
                    <TableHead>操作人</TableHead>
                    <TableHead>原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => (
                    <AuditLogEntry key={entry.id} entry={entry} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Policy Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑工具策略</DialogTitle>
            <DialogDescription>
              为工具 "{selectedPolicy?.toolName}" 配置批准策略
            </DialogDescription>
          </DialogHeader>

          {selectedPolicy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>工具名称</Label>
                  <div className="text-sm font-medium">{selectedPolicy.toolName}</div>
                </div>
                <div className="space-y-2">
                  <Label>所属服务</Label>
                  <div className="text-sm">{selectedPolicy.serviceName}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>风险级别</Label>
                <RiskLevelBadge level={selectedPolicy.riskLevel} />
              </div>

              <div className="space-y-2">
                <Label>默认策略</Label>
                <PolicyBadge policy={selectedPolicy.defaultPolicy} />
              </div>

              <div className="space-y-2">
                <Label>覆盖策略</Label>
                <Select defaultValue={selectedPolicy.override || 'none'}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择覆盖策略" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不覆盖（使用默认）</SelectItem>
                    <SelectItem value="auto">自动批准</SelectItem>
                    <SelectItem value="confirm">需要确认</SelectItem>
                    <SelectItem value="deny">拒绝执行</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>备注说明</Label>
                <Input placeholder="输入备注说明（可选）" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSavePolicy} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Effective Policy Dialog */}
      <Dialog open={effectiveDialogOpen} onOpenChange={setEffectiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>有效策略详情</DialogTitle>
            <DialogDescription>
              工具 "{selectedPolicy?.toolName}" 的策略继承链和生效规则
            </DialogDescription>
          </DialogHeader>

          {selectedPolicy && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">最终生效策略</span>
                  <PolicyBadge policy={selectedPolicy.effectivePolicy} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>策略来源</Label>
                <SourceBadge source={selectedPolicy.policySource} />
                <p className="text-sm text-muted-foreground">
                  {selectedPolicy.policySource === 'default' && '策略来自默认配置，未被覆盖'}
                  {selectedPolicy.policySource === 'override' && '策略被显式覆盖'}
                  {selectedPolicy.policySource === 'condition' && '策略由条件规则决定'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>策略继承链</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">全局默认</Badge>
                    <PolicyBadge policy="auto" />
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <Badge variant="outline">服务默认</Badge>
                    <PolicyBadge policy={selectedPolicy.defaultPolicy} />
                    {selectedPolicy.policySource === 'override' && (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        <Badge variant="outline">工具覆盖</Badge>
                        <PolicyBadge policy={selectedPolicy.effectivePolicy} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedPolicy.conditions && selectedPolicy.conditions.length > 0 && (
                <div className="space-y-2">
                  <Label>生效条件</Label>
                  <div className="space-y-2">
                    {selectedPolicy.conditions.map((cond) => (
                      <div key={cond.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{cond.name}</span>
                        <PolicyBadge policy={cond.policy} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEffectiveDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Condition Dialog */}
      <Dialog open={conditionDialogOpen} onOpenChange={setConditionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑条件规则</DialogTitle>
            <DialogDescription>
              配置基于条件的策略规则
            </DialogDescription>
          </DialogHeader>

          {selectedCondition && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>规则名称</Label>
                <Input defaultValue={selectedCondition.name} />
              </div>

              <div className="space-y-2">
                <Label>条件类型</Label>
                <Select defaultValue={selectedCondition.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="risk_level">风险级别</SelectItem>
                    <SelectItem value="time_window">时间窗口</SelectItem>
                    <SelectItem value="param_pattern">参数模式</SelectItem>
                    <SelectItem value="user_role">用户角色</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>匹配策略</Label>
                <Select defaultValue={selectedCondition.policy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动批准</SelectItem>
                    <SelectItem value="confirm">需要确认</SelectItem>
                    <SelectItem value="deny">拒绝执行</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>优先级</Label>
                <Input type="number" defaultValue={selectedCondition.priority} />
              </div>

              <div className="space-y-2">
                <Label>描述说明</Label>
                <Input defaultValue={selectedCondition.description} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConditionDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setConditionDialogOpen(false)}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MCPApprovePolicy