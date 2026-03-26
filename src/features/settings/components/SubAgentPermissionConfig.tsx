import { useState, useMemo, useCallback } from 'react'
import {
  Bot,
  Shield,
  Building2,
  BookOpen,
  Lock,
  Eye,
  Plus,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  History,
  Settings,
  Users,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  SETTINGS_DEPARTMENTS,
  SETTINGS_KNOWLEDGE_BASES,
  SETTINGS_SUB_AGENT_OPTIONS,
} from './subAgentSettingsFixtures'

// Types
export type PermissionBoundary = 'department' | 'cross_department' | 'all'
export type DataAccessLevel = 'none' | 'read' | 'write' | 'full'
export type VisibilityLevel = 'hidden' | 'restricted' | 'visible' | 'full'

export interface DepartmentPermission {
  departmentId: string
  departmentName: string
  dataAccess: DataAccessLevel
  canExecuteActions: boolean
}

export interface KnowledgeScope {
  knowledgeBaseId: string
  knowledgeBaseName: string
  accessLevel: DataAccessLevel
}

export interface PermissionConfig {
  subAgentId: string
  boundary: PermissionBoundary
  departmentPermissions: DepartmentPermission[]
  knowledgeScopes: KnowledgeScope[]
  visibilityLevel: VisibilityLevel
  canAccessPersonalData: boolean
  canModifyOwnData: boolean
  isolationMode: 'strict' | 'standard' | 'open'
  lastModified: string
  version: number
}

export interface PermissionAuditEntry {
  id: string
  timestamp: string
  action: 'create' | 'update' | 'apply' | 'rollback'
  actor: string
  before?: Partial<PermissionConfig>
  after?: Partial<PermissionConfig>
  status: 'success' | 'failed'
  errorMessage?: string
}

export interface SubAgentPermissionConfigProps {
  className?: string
}

const CORRECTIVE_SUB_AGENTS = SETTINGS_SUB_AGENT_OPTIONS
const CORRECTIVE_DEPARTMENTS = SETTINGS_DEPARTMENTS
const CORRECTIVE_KNOWLEDGE_BASES = SETTINGS_KNOWLEDGE_BASES

// Isolation mode options
const ISOLATION_MODES: { value: 'strict' | 'standard' | 'open'; label: string; description: string }[] = [
  { value: 'strict', label: '严格隔离', description: '完全隔离，不与其他部门数据交互' },
  { value: 'standard', label: '标准隔离', description: '仅在授权范围内共享数据' },
  { value: 'open', label: '开放模式', description: '可访问所有授权数据，无额外限制' },
]

// Data access level options
const DATA_ACCESS_LEVELS: { value: DataAccessLevel; label: string }[] = [
  { value: 'none', label: '无权限' },
  { value: 'read', label: '只读' },
  { value: 'write', label: '读写' },
  { value: 'full', label: '完全控制' },
]

// Visibility level options
const VISIBILITY_LEVELS: { value: VisibilityLevel; label: string }[] = [
  { value: 'hidden', label: '隐藏' },
  { value: 'restricted', label: '受限' },
  { value: 'visible', label: '可见' },
  { value: 'full', label: '完全可见' },
]

const createCorrectiveAuditHistory = (): PermissionAuditEntry[] => [
  {
    id: 'audit-001',
    timestamp: '2026-03-24T10:30:00Z',
    action: 'apply',
    actor: 'admin',
    status: 'success',
  },
  {
    id: 'audit-002',
    timestamp: '2026-03-24T09:15:00Z',
    action: 'update',
    actor: 'admin',
    before: { boundary: 'department' },
    after: { boundary: 'cross_department' },
    status: 'success',
  },
  {
    id: 'audit-003',
    timestamp: '2026-03-23T16:45:00Z',
    action: 'update',
    actor: 'admin',
    before: { visibilityLevel: 'visible' },
    after: { visibilityLevel: 'restricted' },
    status: 'success',
  },
]

export function SubAgentPermissionConfig({ className = '' }: SubAgentPermissionConfigProps) {
  const [selectedSubAgentId, setSelectedSubAgentId] = useState<string | null>(null)
  const [permissionConfig, setPermissionConfig] = useState<PermissionConfig | null>(null)
  const [auditHistory] = useState<PermissionAuditEntry[]>(createCorrectiveAuditHistory)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Get selected sub-agent info
  const selectedSubAgent = useMemo(() => {
    return CORRECTIVE_SUB_AGENTS.find(a => a.id === selectedSubAgentId)
  }, [selectedSubAgentId])

  // Load permission config for selected sub-agent
  const handleSelectSubAgent = useCallback((subAgentId: string) => {
    setSelectedSubAgentId(subAgentId)
    const presets: Record<string, Pick<PermissionConfig, 'boundary' | 'departmentPermissions' | 'knowledgeScopes' | 'visibilityLevel' | 'canAccessPersonalData' | 'canModifyOwnData' | 'isolationMode'>> = {
      'subagent-001': {
        boundary: 'cross_department',
        departmentPermissions: [
          { departmentId: 'dept-tender', departmentName: '招投标部', dataAccess: 'read', canExecuteActions: true },
          { departmentId: 'dept-legal', departmentName: '法务部', dataAccess: 'read', canExecuteActions: false },
        ],
        knowledgeScopes: [
          { knowledgeBaseId: 'kb-bid-archive', knowledgeBaseName: '历史标书知识库', accessLevel: 'read' },
          { knowledgeBaseId: 'kb-template', knowledgeBaseName: '模板资产库', accessLevel: 'read' },
        ],
        visibilityLevel: 'visible',
        canAccessPersonalData: false,
        canModifyOwnData: false,
        isolationMode: 'standard',
      },
      'subagent-002': {
        boundary: 'cross_department',
        departmentPermissions: [
          { departmentId: 'dept-tender', departmentName: '招投标部', dataAccess: 'read', canExecuteActions: true },
          { departmentId: 'dept-ops', departmentName: '运营支持', dataAccess: 'read', canExecuteActions: true },
        ],
        knowledgeScopes: [
          { knowledgeBaseId: 'kb-bid-archive', knowledgeBaseName: '历史标书知识库', accessLevel: 'read' },
          { knowledgeBaseId: 'kb-collaboration', knowledgeBaseName: '协作摘要知识库', accessLevel: 'read' },
        ],
        visibilityLevel: 'restricted',
        canAccessPersonalData: false,
        canModifyOwnData: false,
        isolationMode: 'standard',
      },
      'subagent-003': {
        boundary: 'cross_department',
        departmentPermissions: [
          { departmentId: 'dept-legal', departmentName: '法务部', dataAccess: 'read', canExecuteActions: true },
          { departmentId: 'dept-finance', departmentName: '财务部', dataAccess: 'read', canExecuteActions: false },
        ],
        knowledgeScopes: [
          { knowledgeBaseId: 'kb-policy', knowledgeBaseName: '制度与规则知识库', accessLevel: 'read' },
          { knowledgeBaseId: 'kb-template', knowledgeBaseName: '模板资产库', accessLevel: 'read' },
        ],
        visibilityLevel: 'restricted',
        canAccessPersonalData: false,
        canModifyOwnData: false,
        isolationMode: 'strict',
      },
      'subagent-004': {
        boundary: 'cross_department',
        departmentPermissions: [
          { departmentId: 'dept-management', departmentName: '管理层', dataAccess: 'read', canExecuteActions: true },
          { departmentId: 'dept-sales', departmentName: '销售部', dataAccess: 'read', canExecuteActions: true },
        ],
        knowledgeScopes: [
          { knowledgeBaseId: 'kb-collaboration', knowledgeBaseName: '协作摘要知识库', accessLevel: 'read' },
        ],
        visibilityLevel: 'visible',
        canAccessPersonalData: false,
        canModifyOwnData: false,
        isolationMode: 'standard',
      },
    }

    const preset = presets[subAgentId]
    if (preset) {
      setPermissionConfig({
        subAgentId,
        ...preset,
        lastModified: new Date().toISOString(),
        version: 1,
      })
      setSubmitMessage(null)
      return
    }

    setPermissionConfig({
      subAgentId,
      boundary: 'cross_department',
      departmentPermissions: [
        {
          departmentId: 'dept-management',
          departmentName: '管理层',
          dataAccess: 'read',
          canExecuteActions: false,
        },
      ],
      knowledgeScopes: [
        {
          knowledgeBaseId: 'kb-policy',
          knowledgeBaseName: '制度与规则知识库',
          accessLevel: 'read',
        },
      ],
      visibilityLevel: 'restricted',
      canAccessPersonalData: false,
      canModifyOwnData: false,
      isolationMode: 'standard',
      lastModified: new Date().toISOString(),
      version: 1,
    })
    setSubmitMessage(null)
  }, [])

  // Update boundary
  const handleBoundaryChange = useCallback((boundary: PermissionBoundary) => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      boundary,
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Update department permission
  const handleUpdateDepartmentPermission = useCallback((deptId: string, updates: Partial<DepartmentPermission>) => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      departmentPermissions: prev.departmentPermissions.map(p =>
        p.departmentId === deptId ? { ...p, ...updates } : p
      ),
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Add department permission
  const handleAddDepartmentPermission = useCallback((dept: typeof CORRECTIVE_DEPARTMENTS[0]) => {
    if (!permissionConfig) return
    const exists = permissionConfig.departmentPermissions.some(p => p.departmentId === dept.id)
    if (exists) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      departmentPermissions: [
        ...prev.departmentPermissions,
        { departmentId: dept.id, departmentName: dept.name, dataAccess: 'read', canExecuteActions: false }
      ],
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Remove department permission
  const handleRemoveDepartmentPermission = useCallback((deptId: string) => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      departmentPermissions: prev.departmentPermissions.filter(p => p.departmentId !== deptId),
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Update knowledge scope
  const handleUpdateKnowledgeScope = useCallback((kbId: string, updates: Partial<KnowledgeScope>) => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      knowledgeScopes: prev.knowledgeScopes.map(k =>
        k.knowledgeBaseId === kbId ? { ...k, ...updates } : k
      ),
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Add knowledge scope
  const handleAddKnowledgeScope = useCallback((kb: typeof CORRECTIVE_KNOWLEDGE_BASES[0]) => {
    if (!permissionConfig) return
    const exists = permissionConfig.knowledgeScopes.some(k => k.knowledgeBaseId === kb.id)
    if (exists) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      knowledgeScopes: [
        ...prev.knowledgeScopes,
        { knowledgeBaseId: kb.id, knowledgeBaseName: kb.name, accessLevel: 'read' }
      ],
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Remove knowledge scope
  const handleRemoveKnowledgeScope = useCallback((kbId: string) => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      knowledgeScopes: prev.knowledgeScopes.filter(k => k.knowledgeBaseId !== kbId),
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Update visibility
  const handleVisibilityChange = useCallback((visibility: VisibilityLevel) => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      visibilityLevel: visibility,
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Update isolation mode
  const handleIsolationModeChange = useCallback((mode: 'strict' | 'standard' | 'open') => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      isolationMode: mode,
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Toggle personal data access
  const handleTogglePersonalDataAccess = useCallback(() => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      canAccessPersonalData: !prev.canAccessPersonalData,
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Toggle own data modification
  const handleToggleOwnDataModification = useCallback(() => {
    if (!permissionConfig) return
    setPermissionConfig(prev => prev ? {
      ...prev,
      canModifyOwnData: !prev.canModifyOwnData,
      lastModified: new Date().toISOString(),
    } : null)
  }, [permissionConfig])

  // Apply permission config
  const handleApply = useCallback(async () => {
    if (!permissionConfig) return

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPermissionConfig(prev => prev ? {
        ...prev,
        version: prev.version + 1,
        lastModified: new Date().toISOString(),
      } : null)
      setSubmitMessage({ type: 'success', text: '权限配置已应用' })
    } catch {
      setSubmitMessage({ type: 'error', text: '应用失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }, [permissionConfig])

  // Rollback
  const handleRollback = useCallback(async () => {
    if (!permissionConfig || permissionConfig.version <= 1) return

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setPermissionConfig(prev => prev ? {
        ...prev,
        version: prev.version - 1,
        lastModified: new Date().toISOString(),
      } : null)
      setSubmitMessage({ type: 'success', text: '已回滚到上一版本' })
    } catch {
      setSubmitMessage({ type: 'error', text: '回滚失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }, [permissionConfig])

  // Get available departments (not yet added)
  const availableDepartments = useMemo(() => {
    if (!permissionConfig) return CORRECTIVE_DEPARTMENTS
    const addedIds = new Set(permissionConfig.departmentPermissions.map(p => p.departmentId))
    return CORRECTIVE_DEPARTMENTS.filter(d => !addedIds.has(d.id))
  }, [permissionConfig])

  // Get available knowledge bases (not yet added)
  const availableKnowledgeBases = useMemo(() => {
    if (!permissionConfig) return CORRECTIVE_KNOWLEDGE_BASES
    const addedIds = new Set(permissionConfig.knowledgeScopes.map(k => k.knowledgeBaseId))
    return CORRECTIVE_KNOWLEDGE_BASES.filter(k => !addedIds.has(k.id))
  }, [permissionConfig])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Sub-Agent 权限配置
          </h2>
          <p className="text-muted-foreground">
            配置当前用户主 Agent 下 Sub-Agent 的部门边界、数据权限和知识访问范围。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sub-Agent List */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                选择 Sub-Agent
              </h3>
              <div className="space-y-2">
                {CORRECTIVE_SUB_AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSubAgentId === agent.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    } ${!agent.enabled ? 'opacity-50' : ''}`}
                    onClick={() => handleSelectSubAgent(agent.id)}
                    disabled={!agent.enabled}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      {agent.enabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6 capitalize">
                      {agent.template}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permission Config Panel */}
        <div className="col-span-12 lg:col-span-8">
          {!selectedSubAgentId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">请从左侧选择一个 Sub-Agent 进行权限配置</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4">
                {/* Sub-Agent Info Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{selectedSubAgent?.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {selectedSubAgent?.template}
                      </div>
                    </div>
                  </div>
                  {permissionConfig && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        v{permissionConfig.version}
                      </Badge>
                      <Badge variant={permissionConfig.isolationMode === 'strict' ? 'destructive' : 'outline'}>
                        {permissionConfig.isolationMode === 'strict' ? '严格隔离' :
                         permissionConfig.isolationMode === 'standard' ? '标准隔离' : '开放'}
                      </Badge>
                    </div>
                  )}
                </div>

                {permissionConfig && (
                  <Tabs defaultValue="boundaries">
                    <TabsList className="mb-4">
                      <TabsTrigger value="boundaries">边界设置</TabsTrigger>
                      <TabsTrigger value="departments">部门权限</TabsTrigger>
                      <TabsTrigger value="knowledge">知识访问</TabsTrigger>
                      <TabsTrigger value="isolation">隔离模式</TabsTrigger>
                      <TabsTrigger value="audit">审计历史</TabsTrigger>
                    </TabsList>

                    {/* Boundaries Tab */}
                    <TabsContent value="boundaries" className="space-y-4">
                      {/* Permission Boundary */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          权限边界
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              permissionConfig.boundary === 'department'
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleBoundaryChange('department')}
                          >
                            <div className="font-medium text-sm">部门内</div>
                            <div className="text-xs text-muted-foreground">仅可访问所属部门数据</div>
                          </button>
                          <button
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              permissionConfig.boundary === 'cross_department'
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleBoundaryChange('cross_department')}
                          >
                            <div className="font-medium text-sm">跨部门</div>
                            <div className="text-xs text-muted-foreground">可访问授权的跨部门数据</div>
                          </button>
                          <button
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              permissionConfig.boundary === 'all'
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleBoundaryChange('all')}
                          >
                            <div className="font-medium text-sm">全部</div>
                            <div className="text-xs text-muted-foreground">可访问所有授权数据</div>
                          </button>
                        </div>
                      </div>

                      {/* Visibility Level */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          可见性级别
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {VISIBILITY_LEVELS.map(level => (
                            <button
                              key={level.value}
                              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                                permissionConfig.visibilityLevel === level.value
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => handleVisibilityChange(level.value)}
                            >
                              {level.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Personal Data Toggle */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">访问个人数据</div>
                            <div className="text-xs text-muted-foreground">
                              允许访问用户个人身份信息
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={permissionConfig.canAccessPersonalData ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleTogglePersonalDataAccess}
                        >
                          {permissionConfig.canAccessPersonalData ? '允许' : '禁止'}
                        </Button>
                      </div>

                      {/* Own Data Modification Toggle */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">修改自有数据</div>
                            <div className="text-xs text-muted-foreground">
                              允许修改自身产生的数据
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={permissionConfig.canModifyOwnData ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleToggleOwnDataModification}
                        >
                          {permissionConfig.canModifyOwnData ? '允许' : '禁止'}
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Departments Tab */}
                    <TabsContent value="departments" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            部门权限
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            配置可访问的部门及数据权限
                          </p>
                        </div>
                      </div>

                      {permissionConfig.departmentPermissions.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg">
                          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-4">
                            暂无部门权限配置
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {permissionConfig.departmentPermissions.map(perm => (
                            <div key={perm.departmentId} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{perm.departmentName}</span>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">数据权限:</Label>
                                    <select
                                      className="text-xs border rounded px-2 py-1"
                                      value={perm.dataAccess}
                                      onChange={(e) => handleUpdateDepartmentPermission(
                                        perm.departmentId,
                                        { dataAccess: e.target.value as DataAccessLevel }
                                      )}
                                    >
                                      {DATA_ACCESS_LEVELS.map(level => (
                                        <option key={level.value} value={level.value}>
                                          {level.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">执行操作:</Label>
                                    <Button
                                      variant={perm.canExecuteActions ? 'default' : 'outline'}
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => handleUpdateDepartmentPermission(
                                        perm.departmentId,
                                        { canExecuteActions: !perm.canExecuteActions }
                                      )}
                                    >
                                      {perm.canExecuteActions ? '允许' : '禁止'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleRemoveDepartmentPermission(perm.departmentId)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {availableDepartments.length > 0 && (
                        <div className="mt-4">
                          <Label className="mb-2">添加部门</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {availableDepartments.map(dept => (
                              <Button
                                key={dept.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddDepartmentPermission(dept)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {dept.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Knowledge Tab */}
                    <TabsContent value="knowledge" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            知识库访问
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            配置可访问的知识库及权限级别
                          </p>
                        </div>
                      </div>

                      {permissionConfig.knowledgeScopes.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg">
                          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-4">
                            暂无知识库权限配置
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {permissionConfig.knowledgeScopes.map(scope => (
                            <div key={scope.knowledgeBaseId} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{scope.knowledgeBaseName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">访问级别:</Label>
                                  <select
                                    className="text-xs border rounded px-2 py-1"
                                    value={scope.accessLevel}
                                    onChange={(e) => handleUpdateKnowledgeScope(
                                      scope.knowledgeBaseId,
                                      { accessLevel: e.target.value as DataAccessLevel }
                                    )}
                                  >
                                    {DATA_ACCESS_LEVELS.map(level => (
                                      <option key={level.value} value={level.value}>
                                        {level.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleRemoveKnowledgeScope(scope.knowledgeBaseId)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {availableKnowledgeBases.length > 0 && (
                        <div className="mt-4">
                          <Label className="mb-2">添加知识库</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {availableKnowledgeBases.map(kb => (
                              <Button
                                key={kb.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddKnowledgeScope(kb)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {kb.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Isolation Tab */}
                    <TabsContent value="isolation" className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          隔离模式
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          选择 Sub-Agent 的数据隔离级别
                        </p>
                      </div>

                      <div className="space-y-3">
                        {ISOLATION_MODES.map(mode => (
                          <button
                            key={mode.value}
                            className={`w-full p-4 rounded-lg border text-left transition-colors ${
                              permissionConfig.isolationMode === mode.value
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleIsolationModeChange(mode.value)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{mode.label}</span>
                              {mode.value === 'strict' && (
                                <Badge variant="destructive" className="text-xs">高安全</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {mode.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Audit History Tab */}
                    <TabsContent value="audit">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          审计历史
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          查看权限配置的变更历史和操作记录
                        </p>
                      </div>

                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {auditHistory.map(entry => (
                            <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="mt-1">
                                {entry.action === 'create' && <Plus className="h-4 w-4 text-green-500" />}
                                {entry.action === 'update' && <Settings className="h-4 w-4 text-blue-500" />}
                                {entry.action === 'apply' && entry.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                {entry.action === 'apply' && entry.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                {entry.action === 'rollback' && <RotateCcw className="h-4 w-4 text-yellow-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm capitalize">
                                    {entry.action === 'create' ? '创建' :
                                     entry.action === 'update' ? '更新' :
                                     entry.action === 'apply' ? '应用' :
                                     entry.action === 'rollback' ? '回滚' : entry.action}
                                  </span>
                                  <Badge
                                    variant={entry.status === 'success' ? 'secondary' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {entry.status === 'success' ? '成功' : '失败'}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(entry.timestamp).toLocaleString()}
                                  <span className="ml-2">by {entry.actor}</span>
                                </div>
                                {entry.errorMessage && (
                                  <div className="text-xs text-red-500 mt-1">
                                    {entry.errorMessage}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Action Buttons */}
                {permissionConfig && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleRollback} disabled={isSubmitting || permissionConfig.version <= 1}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        回滚
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {submitMessage && (
                        <span className={`text-sm ${
                          submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {submitMessage.text}
                        </span>
                      )}
                      <Button onClick={handleApply} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        应用配置
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
