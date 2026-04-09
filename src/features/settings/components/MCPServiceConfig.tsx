/**
 * MCP Service Config - Story 21.3
 * MCP服务添加与配置
 * 
 * 功能：
 * - 添加 MCP 服务定义和命令配置
 * - 支持 args、env 和运行时策略设置
 * - 持久化 MCP 服务记录
 */

import { useState, useMemo, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Server, Plus, Trash2, Edit, Play, Pause,
  Settings, Terminal, Shield,
  AlertCircle, CheckCircle2, Clock,
  CheckCircle, XCircle, Eye, Regex
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// Types
export type MCPServiceStatus = 'running' | 'stopped' | 'error' | 'pending'
export type MCPServiceType = 'stdio' | 'http' | 'websocket'
export type RuntimePolicy = 'always' | 'on_demand' | 'manual'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface MCPServiceArg {
  name: string
  value: string
  description?: string
}

export interface MCPServiceEnv {
  key: string
  value: string
  encrypted: boolean
  description?: string
}

export interface MCPServiceCapability {
  name: string
  version: string
  description: string
}

export interface MCPServiceConfig {
  id: string
  name: string
  description: string
  type: MCPServiceType
  command: string
  args: MCPServiceArg[]
  env: MCPServiceEnv[]
  capabilities: MCPServiceCapability[]
  runtimePolicy: RuntimePolicy
  autoRestart: boolean
  maxRestarts: number
  restartDelay: number
  timeout: number
  logLevel: LogLevel
  status: MCPServiceStatus
  pid?: number
  startedAt?: string
  lastError?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  version: number
}

export interface MCPServiceRecord {
  id: string
  serviceId: string
  serviceName: string
  action: 'create' | 'update' | 'delete' | 'start' | 'stop' | 'restart'
  timestamp: string
  actor: string
  changes?: {
    field: string
    oldValue: string
    newValue: string
  }[]
  success: boolean
  errorMessage?: string
}

export interface MCPServiceStats {
  totalServices: number
  runningServices: number
  stoppedServices: number
  errorServices: number
  totalCapabilities: number
}

export interface MCPServiceConfigState {
  services: MCPServiceConfig[]
  records: MCPServiceRecord[]
  stats: MCPServiceStats
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

// Per-Tool Approval Policy Types
export type ApprovalPolicyType = 'auto_approve' | 'manual' | 'denied'

export interface PerToolApprovalConfig {
  id: string
  serviceId: string
  toolPattern: string
  isRegex: boolean
  policy: ApprovalPolicyType
  description?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface AutoApproveResult {
  approved: boolean
  policy: ApprovalPolicyType
  matchedConfigId?: string
  reason: string
}

// Mock data generators
const generateMockServices = (): MCPServiceConfig[] => [
  {
    id: 'mcp-1',
    name: 'filesystem',
    description: '文件系统访问 MCP 服务',
    type: 'stdio',
    command: 'mcp-server-filesystem',
    args: [
      { name: 'root', value: '/home/user/documents', description: '根目录路径' },
      { name: 'readonly', value: 'false', description: '只读模式' },
    ],
    env: [
      { key: 'LOG_LEVEL', value: 'info', encrypted: false },
    ],
    capabilities: [
      { name: 'fs.read', version: '1.0.0', description: '读取文件' },
      { name: 'fs.write', version: '1.0.0', description: '写入文件' },
      { name: 'fs.list', version: '1.0.0', description: '列出目录' },
    ],
    runtimePolicy: 'on_demand',
    autoRestart: true,
    maxRestarts: 3,
    restartDelay: 5,
    timeout: 30,
    logLevel: 'info',
    status: 'running',
    pid: 12345,
    startedAt: '2026-03-24T08:00:00Z',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-24T08:00:00Z',
    createdBy: 'admin',
    version: 2,
  },
  {
    id: 'mcp-2',
    name: 'brave-search',
    description: 'Brave 搜索 MCP 服务',
    type: 'http',
    command: 'https://api.brave.com/mcp',
    args: [],
    env: [
      { key: 'BRAVE_API_KEY', value: '••••••••••••', encrypted: true },
    ],
    capabilities: [
      { name: 'search.web', version: '1.0.0', description: '网页搜索' },
    ],
    runtimePolicy: 'always',
    autoRestart: true,
    maxRestarts: 5,
    restartDelay: 10,
    timeout: 60,
    logLevel: 'warn',
    status: 'running',
    pid: 12346,
    startedAt: '2026-03-24T09:00:00Z',
    createdAt: '2026-03-21T14:00:00Z',
    updatedAt: '2026-03-24T09:00:00Z',
    createdBy: 'admin',
    version: 1,
  },
  {
    id: 'mcp-3',
    name: 'postgres',
    description: 'PostgreSQL 数据库 MCP 服务',
    type: 'stdio',
    command: 'mcp-server-postgres',
    args: [
      { name: 'connection-string', value: 'postgresql://localhost:5432/mydb', description: '数据库连接字符串' },
    ],
    env: [
      { key: 'PG_PASSWORD', value: '••••••••••••', encrypted: true },
    ],
    capabilities: [
      { name: 'db.query', version: '1.0.0', description: '执行 SQL 查询' },
      { name: 'db.schema', version: '1.0.0', description: '获取数据库模式' },
    ],
    runtimePolicy: 'manual',
    autoRestart: false,
    maxRestarts: 0,
    restartDelay: 5,
    timeout: 30,
    logLevel: 'info',
    status: 'stopped',
    createdAt: '2026-03-22T16:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
    createdBy: 'user1',
    version: 3,
  },
]

const generateMockRecords = (): MCPServiceRecord[] => [
  {
    id: 'rec-1',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    action: 'start',
    timestamp: '2026-03-24T08:00:00Z',
    actor: 'system',
    success: true,
  },
  {
    id: 'rec-2',
    serviceId: 'mcp-3',
    serviceName: 'postgres',
    action: 'update',
    timestamp: '2026-03-24T10:00:00Z',
    actor: 'user1',
    changes: [
      { field: 'runtimePolicy', oldValue: 'on_demand', newValue: 'manual' },
    ],
    success: true,
  },
]

const generateMockStats = (services: MCPServiceConfig[]): MCPServiceStats => ({
  totalServices: services.length,
  runningServices: services.filter(s => s.status === 'running').length,
  stoppedServices: services.filter(s => s.status === 'stopped').length,
  errorServices: services.filter(s => s.status === 'error').length,
  totalCapabilities: services.reduce((acc, s) => acc + s.capabilities.length, 0),
})

// Status Badge Component
function StatusBadge({ status }: { status: MCPServiceStatus }) {
  const config: Record<MCPServiceStatus, { color: string; icon: typeof CheckCircle2; label: string }> = {
    running: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2, label: '运行中' },
    stopped: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300', icon: Pause, label: '已停止' },
    error: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: AlertCircle, label: '错误' },
    pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock, label: '启动中' },
  }
  const { color, icon: Icon, label } = config[status]
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// Policy Badge Component for Approval Policy
function PolicyBadge({ policy }: { policy: ApprovalPolicyType }) {
  const config: Record<ApprovalPolicyType, { color: string; icon: typeof CheckCircle; label: string }> = {
    auto_approve: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: '自动审批' },
    manual: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: Eye, label: '手动审批' },
    denied: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle, label: '拒绝' },
  }
  const { color, icon: Icon, label } = config[policy]
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// Service Card Component
function ServiceCard({ 
  service, 
  onEdit, 
  onStart, 
  onStop, 
  onDelete 
}: { 
  service: MCPServiceConfig
  onEdit: () => void
  onStart: () => void
  onStop: () => void
  onDelete: () => void
}) {
  const typeIcons: Record<MCPServiceType, string> = {
    stdio: '💻',
    http: '🌐',
    websocket: '🔌',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{typeIcons[service.type]}</span>
              {service.name}
            </CardTitle>
            <StatusBadge status={service.status} />
          </div>
          <div className="flex gap-1">
            {service.status === 'running' ? (
              <Button variant="outline" size="sm" onClick={onStop}>
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onStart}>
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Service Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">类型:</span> {service.type.toUpperCase()}
            </div>
            <div>
              <span className="text-muted-foreground">策略:</span> {service.runtimePolicy}
            </div>
            <div>
              <span className="text-muted-foreground">版本:</span> v{service.version}
            </div>
            {service.pid && (
              <div>
                <span className="text-muted-foreground">PID:</span> {service.pid}
              </div>
            )}
          </div>

          {/* Capabilities */}
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">能力:</div>
            <div className="flex flex-wrap gap-1">
              {service.capabilities.map((cap) => (
                <Badge key={cap.name} variant="outline" className="text-xs">
                  {cap.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Error Info */}
          {service.lastError && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
              <div className="font-medium">错误:</div>
              <div>{service.lastError}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export function MCPServiceConfig() {
  const [services, setServices] = useState<MCPServiceConfig[]>(generateMockServices())
  const [records] = useState<MCPServiceRecord[]>(generateMockRecords())
  const [activeTab, setActiveTab] = useState<string>('services')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<MCPServiceConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [, setIsLoading] = useState(false)

  // Approval Policy State
  const [approvalConfigs, setApprovalConfigs] = useState<PerToolApprovalConfig[]>([])
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<PerToolApprovalConfig | null>(null)
  const [selectedServiceForApproval, setSelectedServiceForApproval] = useState<MCPServiceConfig | null>(null)

  // Mock approval configs generator
  const generateMockApprovalConfigs = (svcId: string): PerToolApprovalConfig[] => [
    {
      id: `approval-${svcId}-1`,
      serviceId: svcId,
      toolPattern: '*',
      isRegex: false,
      policy: 'manual',
      description: '默认情况下所有工具需要手动审批',
      enabled: true,
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
      createdBy: 'admin',
    },
    {
      id: `approval-${svcId}-2`,
      serviceId: svcId,
      toolPattern: 'fs\\.read.*',
      isRegex: true,
      policy: 'auto_approve',
      description: '所有只读文件系统操作自动审批',
      enabled: true,
      createdAt: '2026-04-02T00:00:00Z',
      updatedAt: '2026-04-02T00:00:00Z',
      createdBy: 'admin',
    },
    {
      id: `approval-${svcId}-3`,
      serviceId: svcId,
      toolPattern: 'db\\..*',
      isRegex: true,
      policy: 'denied',
      description: '禁止所有数据库操作',
      enabled: false,
      createdAt: '2026-04-03T00:00:00Z',
      updatedAt: '2026-04-03T00:00:00Z',
      createdBy: 'admin',
    },
  ]

  // Fetch approval configs from backend
  useEffect(() => {
    const fetchApprovalConfigs = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await invoke<{ success: boolean; data?: any[]; error?: string }>('mcp_get_approval_configs')
        if (response.success && response.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const configs = response.data.map((c: any) => ({
            id: c.id,
            serviceId: c.service_id,
            toolPattern: c.tool_pattern,
            isRegex: c.is_regex,
            policy: c.policy,
            description: c.description,
            enabled: c.enabled,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            createdBy: c.created_by,
          }))
          setApprovalConfigs(configs)
        }
      } catch {
        // Use mock data if backend not available
        const allConfigs: PerToolApprovalConfig[] = []
        services.forEach(svc => {
          allConfigs.push(...generateMockApprovalConfigs(svc.id))
        })
        setApprovalConfigs(allConfigs)
      }
    }
    if (services.length > 0) {
      void fetchApprovalConfigs()
    }
  }, [services])

  // Handle open approval dialog for a service
  const handleOpenApproval = (service: MCPServiceConfig) => {
    setSelectedServiceForApproval(service)
    setSelectedApproval(null)
    setApprovalDialogOpen(true)
  }

  // Handle edit existing approval config
  const handleEditApproval = (approval: PerToolApprovalConfig) => {
    setSelectedApproval(approval)
    setApprovalDialogOpen(true)
  }

  // Handle save approval config
  const handleSaveApproval = async () => {
    if (!selectedApproval && selectedServiceForApproval) return
    setIsSaving(true)
    try {
      const config = {
        id: selectedApproval?.id || `approval-${Date.now()}`,
        service_id: selectedApproval?.serviceId || selectedServiceForApproval?.id,
        tool_pattern: selectedApproval?.toolPattern || '',
        is_regex: selectedApproval?.isRegex || false,
        policy: selectedApproval?.policy || 'manual',
        description: selectedApproval?.description || '',
        enabled: selectedApproval?.enabled ?? true,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await invoke<{ success: boolean; data?: any; error?: string }>('mcp_set_approval_config', { config })
      if (response.success) {
        setApprovalDialogOpen(false)
        setSelectedApproval(null)
        // Refresh approval configs
        // In real implementation, would trigger a refresh
      } else {
        console.error('Failed to save approval config:', response.error)
      }
    } catch (error) {
      console.error('Failed to save approval config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete approval config
  const handleDeleteApproval = async (approvalId: string) => {
    try {
      const response = await invoke<{ success: boolean; error?: string }>('mcp_delete_approval_config', { configId: approvalId })
      if (response.success) {
        setApprovalConfigs(prev => prev.filter(c => c.id !== approvalId))
      }
    } catch (error) {
      console.error('Failed to delete approval config:', error)
    }
  }

  // Handle toggle approval config enabled
  const handleToggleApproval = async (approval: PerToolApprovalConfig) => {
    const newEnabled = !approval.enabled
    try {
      const response = await invoke<{ success: boolean; error?: string }>('mcp_set_approval_config_enabled', { configId: approval.id, enabled: newEnabled })
      if (response.success) {
        setApprovalConfigs(prev =>
          prev.map(c => c.id === approval.id ? { ...c, enabled: newEnabled } : c)
        )
      }
    } catch (error) {
      console.error('Failed to toggle approval config:', error)
    }
  }

  // Get approval configs for a specific service
  const getServiceApprovalConfigs = (serviceId: string) => {
    return approvalConfigs.filter(c => c.serviceId === serviceId)
  }

  // Fetch services from backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await invoke<{ success: boolean; data?: any[]; error?: string }>('mcp_list_services')
        if (response.success && response.data) {
          // Transform backend data to frontend format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const backendServices = response.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description || '',
            type: s.transport || 'stdio',
            command: s.command || '',
            args: s.args || [],
            env: s.env || [],
            capabilities: [],
            runtimePolicy: 'on_demand' as const,
            autoRestart: s.auto_start || false,
            maxRestarts: s.max_concurrent || 3,
            restartDelay: s.restart_delay || 1,
            timeout: s.timeout_secs || 30,
            logLevel: 'info' as const,
            status: s.status || 'stopped',
            pid: s.pid,
            startedAt: s.started_at,
            lastError: s.last_error,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            version: 1,
          }))
          if (backendServices.length > 0) {
            setServices(backendServices)
          }
        }
      } catch (error) {
        console.error('Failed to fetch MCP services:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchServices()
  }, [])

  // Form state
  const [formData, setFormData] = useState<Partial<MCPServiceConfig>>({
    name: '',
    description: '',
    type: 'stdio',
    command: '',
    args: [],
    env: [],
    runtimePolicy: 'on_demand',
    autoRestart: true,
    maxRestarts: 3,
    timeout: 30,
    logLevel: 'info',
  })

  const stats = useMemo(() => generateMockStats(services), [services])

  const handleOpenEdit = (service?: MCPServiceConfig) => {
    if (service) {
      setSelectedService(service)
      setFormData({
        name: service.name,
        description: service.description,
        type: service.type,
        command: service.command,
        args: service.args,
        env: service.env,
        runtimePolicy: service.runtimePolicy,
        autoRestart: service.autoRestart,
        maxRestarts: service.maxRestarts,
        timeout: service.timeout,
        logLevel: service.logLevel,
      })
    } else {
      setSelectedService(null)
      setFormData({
        name: '',
        description: '',
        type: 'stdio',
        command: '',
        args: [],
        env: [],
        runtimePolicy: 'on_demand',
        autoRestart: true,
        maxRestarts: 3,
        timeout: 30,
        logLevel: 'info',
      })
    }
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const config = {
        id: selectedService?.id || `mcp-${Date.now()}`,
        name: formData.name,
        description: formData.description || '',
        transport_type: formData.type || 'stdio',
        command: formData.type === 'stdio' ? formData.command : undefined,
        args: formData.args?.map((a: MCPServiceArg) => a.value) || [],
        env: formData.env?.reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {} as Record<string, string>),
        url: formData.type === 'http' ? formData.command : undefined,
        ws_url: formData.type === 'websocket' ? formData.command : undefined,
        auto_start: formData.autoRestart,
        max_concurrent: formData.maxRestarts,
        timeout_secs: formData.timeout,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await invoke<{ success: boolean; data?: any; error?: string }>('mcp_add_service', config)

      if (response.success) {
        setEditDialogOpen(false)
        setSelectedService(null)
        // Refresh services list
        // In real implementation, would trigger a refresh
      } else {
        console.error('Failed to save service:', response.error)
        alert(`保存失败: ${response.error}`)
      }
    } catch (error) {
      console.error('Failed to save MCP service:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddArg = () => {
    setFormData(prev => ({
      ...prev,
      args: [...(prev.args || []), { name: '', value: '', description: '' }],
    }))
  }

  const handleUpdateArg = (index: number, field: keyof MCPServiceArg, value: string) => {
    setFormData(prev => ({
      ...prev,
      args: prev.args?.map((arg, i) => 
        i === index ? { ...arg, [field]: value } : arg
      ),
    }))
  }

  const handleRemoveArg = (index: number) => {
    setFormData(prev => ({
      ...prev,
      args: prev.args?.filter((_, i) => i !== index),
    }))
  }

  const handleAddEnv = () => {
    setFormData(prev => ({
      ...prev,
      env: [...(prev.env || []), { key: '', value: '', encrypted: false, description: '' }],
    }))
  }

  const handleUpdateEnv = (index: number, field: keyof MCPServiceEnv, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      env: prev.env?.map((env, i) => 
        i === index ? { ...env, [field]: value } : env
      ),
    }))
  }

  const handleRemoveEnv = (index: number) => {
    setFormData(prev => ({
      ...prev,
      env: prev.env?.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            MCP 服务配置
          </h2>
          <p className="text-muted-foreground">
            管理 Model Context Protocol 服务注册和配置
          </p>
        </div>
        <Button onClick={() => handleOpenEdit()}>
          <Plus className="h-4 w-4 mr-2" />
          添加服务
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <div className="text-sm text-muted-foreground">总服务数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.runningServices}</div>
            <div className="text-sm text-muted-foreground">运行中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-500">{stats.stoppedServices}</div>
            <div className="text-sm text-muted-foreground">已停止</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.errorServices}</div>
            <div className="text-sm text-muted-foreground">错误</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCapabilities}</div>
            <div className="text-sm text-muted-foreground">总能力数</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="services">服务列表</TabsTrigger>
          <TabsTrigger value="records">操作记录</TabsTrigger>
          <TabsTrigger value="approvals">工具审批</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => handleOpenEdit(service)}
                onStart={() => {}}
                onStop={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>服务</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>操作人</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>变更</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {new Date(record.timestamp).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="font-medium">{record.serviceName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.action === 'create' ? '创建' :
                           record.action === 'update' ? '更新' :
                           record.action === 'delete' ? '删除' :
                           record.action === 'start' ? '启动' :
                           record.action === 'stop' ? '停止' : '重启'}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.actor}</TableCell>
                      <TableCell>
                        {record.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {record.changes && record.changes.length > 0 && (
                          <div className="text-xs space-y-1">
                            {record.changes.map((change, i) => (
                              <div key={i}>
                                {change.field}: {change.oldValue} → {change.newValue}
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              为每个服务的工具配置自动审批策略。支持精确匹配和正则表达式匹配。
            </p>
          </div>
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    {service.name}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleOpenApproval(service)}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加规则
                  </Button>
                </div>
                <CardDescription>
                  配置 {service.name} 服务的工具审批策略
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>启用</TableHead>
                      <TableHead>工具模式</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>策略</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getServiceApprovalConfigs(service.id).map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <Switch
                            checked={approval.enabled}
                            onCheckedChange={() => handleToggleApproval(approval)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {approval.isRegex && <Regex className="h-3 w-3 text-muted-foreground" />}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {approval.toolPattern}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={approval.isRegex ? 'default' : 'outline'}>
                            {approval.isRegex ? '正则' : '精确'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <PolicyBadge policy={approval.policy} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {approval.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditApproval(approval)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteApproval(approval.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {getServiceApprovalConfigs(service.id).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          暂无审批规则，点击上方按钮添加
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? '编辑服务' : '添加服务'}
            </DialogTitle>
            <DialogDescription>
              配置 MCP 服务定义和运行时参数
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                基本信息
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>服务名称</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如: filesystem"
                  />
                </div>
                <div className="space-y-2">
                  <Label>服务类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as MCPServiceType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stdio">STDIO</SelectItem>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="websocket">WebSocket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="服务描述"
                />
              </div>
              <div className="space-y-2">
                <Label>命令</Label>
                <Input
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  placeholder={formData.type === 'stdio' ? '可执行文件路径' : '服务 URL'}
                />
              </div>
            </div>

            {/* Arguments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  命令参数
                </h4>
                <Button variant="outline" size="sm" onClick={handleAddArg}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加参数
                </Button>
              </div>
              <div className="space-y-2">
                {formData.args?.map((arg, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="参数名"
                      value={arg.name}
                      onChange={(e) => handleUpdateArg(index, 'name', e.target.value)}
                      className="w-32"
                    />
                    <Input
                      placeholder="参数值"
                      value={arg.value}
                      onChange={(e) => handleUpdateArg(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="描述"
                      value={arg.description || ''}
                      onChange={(e) => handleUpdateArg(index, 'description', e.target.value)}
                      className="w-40"
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveArg(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.args?.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    暂无参数，点击上方按钮添加
                  </div>
                )}
              </div>
            </div>

            {/* Environment Variables */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  环境变量
                </h4>
                <Button variant="outline" size="sm" onClick={handleAddEnv}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加变量
                </Button>
              </div>
              <div className="space-y-2">
                {formData.env?.map((env, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="变量名"
                      value={env.key}
                      onChange={(e) => handleUpdateEnv(index, 'key', e.target.value)}
                      className="w-40"
                    />
                    <Input
                      placeholder="变量值"
                      value={env.value}
                      onChange={(e) => handleUpdateEnv(index, 'value', e.target.value)}
                      type={env.encrypted ? 'password' : 'text'}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2 px-2">
                      <Label className="text-xs">加密</Label>
                      <Switch
                        checked={env.encrypted}
                        onCheckedChange={(checked) => handleUpdateEnv(index, 'encrypted', checked)}
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveEnv(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.env?.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    暂无环境变量，点击上方按钮添加
                  </div>
                )}
              </div>
            </div>

            {/* Runtime Policy */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                运行时策略
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>启动策略</Label>
                  <Select
                    value={formData.runtimePolicy}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, runtimePolicy: v as RuntimePolicy }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">始终运行</SelectItem>
                      <SelectItem value="on_demand">按需启动</SelectItem>
                      <SelectItem value="manual">手动启动</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>超时时间 (秒)</Label>
                  <Input
                    type="number"
                    value={formData.timeout}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>日志级别</Label>
                  <Select
                    value={formData.logLevel}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, logLevel: v as LogLevel }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>最大重启次数</Label>
                  <Input
                    type="number"
                    value={formData.maxRestarts}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxRestarts: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.autoRestart}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoRestart: checked }))}
                />
                <Label>自动重启</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Policy Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedApproval ? '编辑审批规则' : '添加审批规则'}
            </DialogTitle>
            <DialogDescription>
              {selectedServiceForApproval
                ? `为 ${selectedServiceForApproval.name} 服务配置工具审批规则`
                : '配置工具审批规则'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Service Selection */}
            <div className="space-y-2">
              <Label>服务</Label>
              <Select
                value={selectedApproval?.serviceId || selectedServiceForApproval?.id || ''}
                onValueChange={(v) => setSelectedApproval(prev => prev ? { ...prev, serviceId: v } : null)}
                disabled={!!selectedApproval}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择服务" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tool Pattern */}
            <div className="space-y-2">
              <Label>工具模式</Label>
              <div className="flex gap-2">
                <Input
                  value={selectedApproval?.toolPattern || ''}
                  onChange={(e) => setSelectedApproval(prev => prev ? { ...prev, toolPattern: e.target.value } : null)}
                  placeholder="例如: fs.read 或 fs\\..*"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedApproval?.isRegex || false}
                  onCheckedChange={(checked) => setSelectedApproval(prev => prev ? { ...prev, isRegex: checked } : null)}
                />
                <Label className="text-sm">使用正则表达式</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                使用 * 匹配所有工具，或使用正则表达式如 fs\\..* 匹配所有 fs 开头的工具
              </p>
            </div>

            {/* Policy */}
            <div className="space-y-2">
              <Label>审批策略</Label>
              <Select
                value={selectedApproval?.policy || 'manual'}
                onValueChange={(v) => setSelectedApproval(prev => prev ? { ...prev, policy: v as ApprovalPolicyType } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_approve">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      自动审批
                    </div>
                  </SelectItem>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-yellow-500" />
                      手动审批
                    </div>
                  </SelectItem>
                  <SelectItem value="denied">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      拒绝
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>描述 (可选)</Label>
              <Input
                value={selectedApproval?.description || ''}
                onChange={(e) => setSelectedApproval(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="规则描述，用于说明配置原因"
              />
            </div>

            {/* Enabled */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={selectedApproval?.enabled ?? true}
                onCheckedChange={(checked) => setSelectedApproval(prev => prev ? { ...prev, enabled: checked } : null)}
              />
              <Label>启用此规则</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveApproval} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MCPServiceConfig
