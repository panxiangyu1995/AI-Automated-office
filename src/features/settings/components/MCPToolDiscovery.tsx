/**
 * MCP Tool Discovery - Story 21.5
 * MCP工具发现与管理
 * 
 * 功能：
 * - 从已连接的 MCP 服务发现工具
 * - 启用或禁用单个 MCP 工具
 * - 将工具状态绑定到通用运行时注册表
 */

import { useState, useMemo } from 'react'
import { 
  Wrench, Search, Power, PowerOff, RefreshCw, 
  Server, CheckCircle2, XCircle, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

// Types
export type ToolStatus = 'enabled' | 'disabled' | 'available' | 'error'
export type ToolCategory = 'resource' | 'action' | 'prompt' | 'utility'

export interface MCPTool {
  id: string
  name: string
  description: string
  serviceId: string
  serviceName: string
  category: ToolCategory
  status: ToolStatus
  inputSchema: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  enabled: boolean
  lastUsed?: string
  usageCount: number
  errorCount: number
  avgExecutionTime?: number
  permissions: string[]
  tags: string[]
  version: string
}

export interface ToolRegistry {
  id: string
  name: string
  description: string
  tools: MCPTool[]
  totalTools: number
  enabledTools: number
  disabledTools: number
  lastSync: string
  status: 'synced' | 'pending' | 'error'
}

export interface ToolBinding {
  id: string
  toolId: string
  toolName: string
  runtimeId: string
  boundAt: string
  config?: Record<string, unknown>
  status: 'active' | 'inactive' | 'error'
}

export interface ToolDiscoveryStats {
  totalServices: number
  totalTools: number
  enabledTools: number
  disabledTools: number
  availableTools: number
  errorTools: number
  lastDiscovery: string
}

export interface ToolDiscoveryState {
  tools: MCPTool[]
  registries: ToolRegistry[]
  bindings: ToolBinding[]
  stats: ToolDiscoveryStats
  isLoading: boolean
  isDiscovering: boolean
  error: string | null
}

// Mock data generators
const generateMockTools = (): MCPTool[] => [
  {
    id: 'tool-1',
    name: 'read_file',
    description: 'Read contents of a file from the filesystem',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    category: 'resource',
    status: 'enabled',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
    enabled: true,
    lastUsed: '2026-03-24T10:30:00Z',
    usageCount: 1234,
    errorCount: 5,
    avgExecutionTime: 45,
    permissions: ['fs.read'],
    tags: ['filesystem', 'read', 'file'],
    version: '1.0.0',
  },
  {
    id: 'tool-2',
    name: 'write_file',
    description: 'Write content to a file on the filesystem',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    category: 'action',
    status: 'enabled',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } },
    enabled: true,
    lastUsed: '2026-03-24T10:00:00Z',
    usageCount: 567,
    errorCount: 12,
    avgExecutionTime: 78,
    permissions: ['fs.write'],
    tags: ['filesystem', 'write', 'file'],
    version: '1.0.0',
  },
  {
    id: 'tool-3',
    name: 'search_web',
    description: 'Search the web for information using Brave Search API',
    serviceId: 'mcp-2',
    serviceName: 'brave-search',
    category: 'resource',
    status: 'enabled',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, count: { type: 'number' } } },
    enabled: true,
    lastUsed: '2026-03-24T09:45:00Z',
    usageCount: 890,
    errorCount: 23,
    avgExecutionTime: 250,
    permissions: ['net.access'],
    tags: ['search', 'web', 'api'],
    version: '2.1.0',
  },
  {
    id: 'tool-4',
    name: 'query_database',
    description: 'Execute SQL queries against the PostgreSQL database',
    serviceId: 'mcp-3',
    serviceName: 'postgres',
    category: 'action',
    status: 'disabled',
    inputSchema: { type: 'object', properties: { sql: { type: 'string' } } },
    enabled: false,
    usageCount: 45,
    errorCount: 3,
    avgExecutionTime: 120,
    permissions: ['db.query', 'db.read'],
    tags: ['database', 'sql', 'postgres'],
    version: '1.2.0',
  },
  {
    id: 'tool-5',
    name: 'cache_get',
    description: 'Retrieve cached data from Redis',
    serviceId: 'mcp-4',
    serviceName: 'redis',
    category: 'resource',
    status: 'error',
    inputSchema: { type: 'object', properties: { key: { type: 'string' } } },
    enabled: false,
    usageCount: 0,
    errorCount: 15,
    permissions: ['cache.read'],
    tags: ['cache', 'redis'],
    version: '1.0.0',
  },
  {
    id: 'tool-6',
    name: 'analyze_sentiment',
    description: 'Analyze sentiment of text content',
    serviceId: 'mcp-5',
    serviceName: 'analytics',
    category: 'utility',
    status: 'available',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
    enabled: false,
    usageCount: 0,
    errorCount: 0,
    permissions: ['ai.analyze'],
    tags: ['ai', 'sentiment', 'nlp'],
    version: '3.0.0',
  },
  {
    id: 'tool-7',
    name: 'list_directory',
    description: 'List contents of a directory',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    category: 'resource',
    status: 'enabled',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
    enabled: true,
    lastUsed: '2026-03-24T10:15:00Z',
    usageCount: 789,
    errorCount: 2,
    avgExecutionTime: 35,
    permissions: ['fs.read'],
    tags: ['filesystem', 'directory'],
    version: '1.0.0',
  },
  {
    id: 'tool-8',
    name: 'prompt_template',
    description: 'Apply a prompt template with variables',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    category: 'prompt',
    status: 'enabled',
    inputSchema: { type: 'object', properties: { template: { type: 'string' }, variables: { type: 'object' } } },
    enabled: true,
    lastUsed: '2026-03-24T08:00:00Z',
    usageCount: 234,
    errorCount: 1,
    avgExecutionTime: 15,
    permissions: ['prompt.use'],
    tags: ['prompt', 'template'],
    version: '1.1.0',
  },
]

const generateMockRegistries = (tools: MCPTool[]): ToolRegistry[] => {
  const serviceMap = new Map<string, MCPTool[]>()
  tools.forEach(tool => {
    if (!serviceMap.has(tool.serviceId)) {
      serviceMap.set(tool.serviceId, [])
    }
    serviceMap.get(tool.serviceId)!.push(tool)
  })

  return Array.from(serviceMap.entries()).map(([serviceId, serviceTools]) => ({
    id: `registry-${serviceId}`,
    name: serviceTools[0].serviceName,
    description: `Tool registry for ${serviceTools[0].serviceName} MCP service`,
    tools: serviceTools,
    totalTools: serviceTools.length,
    enabledTools: serviceTools.filter(t => t.enabled).length,
    disabledTools: serviceTools.filter(t => !t.enabled).length,
    lastSync: '2026-03-24T10:30:00Z',
    status: 'synced' as const,
  }))
}

const generateMockBindings = (): ToolBinding[] => [
  {
    id: 'binding-1',
    toolId: 'tool-1',
    toolName: 'read_file',
    runtimeId: 'runtime-main',
    boundAt: '2026-03-24T08:00:00Z',
    status: 'active',
  },
  {
    id: 'binding-2',
    toolId: 'tool-2',
    toolName: 'write_file',
    runtimeId: 'runtime-main',
    boundAt: '2026-03-24T08:00:00Z',
    status: 'active',
  },
  {
    id: 'binding-3',
    toolId: 'tool-3',
    toolName: 'search_web',
    runtimeId: 'runtime-main',
    boundAt: '2026-03-24T09:00:00Z',
    status: 'active',
  },
]

const generateMockStats = (tools: MCPTool[]): ToolDiscoveryStats => ({
  totalServices: new Set(tools.map(t => t.serviceId)).size,
  totalTools: tools.length,
  enabledTools: tools.filter(t => t.enabled).length,
  disabledTools: tools.filter(t => !t.enabled).length,
  availableTools: tools.filter(t => t.status === 'available').length,
  errorTools: tools.filter(t => t.status === 'error').length,
  lastDiscovery: '2026-03-24T10:30:00Z',
})

// Status Badge Component
function StatusBadge({ status }: { status: ToolStatus }) {
  const config: Record<ToolStatus, { color: string; icon: typeof CheckCircle2; label: string }> = {
    enabled: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2, label: '已启用' },
    disabled: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300', icon: PowerOff, label: '已禁用' },
    available: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Info, label: '可用' },
    error: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle, label: '错误' },
  }
  const { color, icon: Icon, label } = config[status]
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// Category Badge Component
function CategoryBadge({ category }: { category: ToolCategory }) {
  const config: Record<ToolCategory, { color: string; label: string }> = {
    resource: { color: 'bg-purple-100 text-purple-700', label: '资源' },
    action: { color: 'bg-orange-100 text-orange-700', label: '操作' },
    prompt: { color: 'bg-cyan-100 text-cyan-700', label: '提示词' },
    utility: { color: 'bg-teal-100 text-teal-700', label: '工具' },
  }
  const { color, label } = config[category]
  return <Badge className={color}>{label}</Badge>
}

// Tool Card Component
function ToolCard({ 
  tool, 
  onToggle,
  onBindView 
}: { 
  tool: MCPTool
  onToggle: () => void
  onBindView: () => void
}) {
  return (
    <Card className={tool.status === 'error' ? 'border-red-200' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {tool.name}
            </CardTitle>
            <StatusBadge status={tool.status} />
          </div>
          <Button 
            size="sm" 
            variant={tool.enabled ? "destructive" : "default"}
            onClick={onToggle}
            disabled={tool.status === 'error'}
          >
            {tool.enabled ? (
              <><PowerOff className="h-4 w-4 mr-1" />禁用</>
            ) : (
              <><Power className="h-4 w-4 mr-1" />启用</>
            )}
          </Button>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span className="text-xs">{tool.serviceName}</span>
          <CategoryBadge category={tool.category} />
          <span className="text-xs text-muted-foreground">v{tool.version}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tool.description}
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium">{tool.usageCount}</div>
              <div className="text-muted-foreground">调用次数</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-500">{tool.errorCount}</div>
              <div className="text-muted-foreground">错误次数</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{tool.avgExecutionTime || '-'}ms</div>
              <div className="text-muted-foreground">平均耗时</div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {tool.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" onClick={onBindView}>
              绑定配置
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export function MCPToolDiscovery() {
  const [tools] = useState<MCPTool[]>(generateMockTools())
  const [registries] = useState<ToolRegistry[]>(generateMockRegistries(generateMockTools()))
  const [bindings] = useState<ToolBinding[]>(generateMockBindings())
  const [activeTab, setActiveTab] = useState<string>('tools')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ToolCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ToolStatus | 'all'>('all')
  const [bindDialogOpen, setBindDialogOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null)
  const [isDiscovering, setIsDiscovering] = useState(false)

  const stats = useMemo(() => generateMockStats(tools), [tools])

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || tool.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [tools, searchQuery, categoryFilter, statusFilter])

  const handleToggle = (_tool: MCPTool) => {
    // Toggle tool
  }

  const handleBindView = (tool: MCPTool) => {
    setSelectedTool(tool)
    setBindDialogOpen(true)
  }

  const handleDiscover = () => {
    setIsDiscovering(true)
    setTimeout(() => {
      setIsDiscovering(false)
    }, 2000)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            MCP 工具发现与管理
          </h2>
          <p className="text-muted-foreground">
            发现、启用和管理 MCP 提供的工具
          </p>
        </div>
        <Button onClick={handleDiscover} disabled={isDiscovering}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
          {isDiscovering ? '发现中...' : '发现工具'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <div className="text-sm text-muted-foreground">服务数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalTools}</div>
            <div className="text-sm text-muted-foreground">总工具数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.enabledTools}</div>
            <div className="text-sm text-muted-foreground">已启用</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-500">{stats.disabledTools}</div>
            <div className="text-sm text-muted-foreground">已禁用</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.availableTools}</div>
            <div className="text-sm text-muted-foreground">可用</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.errorTools}</div>
            <div className="text-sm text-muted-foreground">错误</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tools">工具列表</TabsTrigger>
          <TabsTrigger value="registries">服务注册表</TabsTrigger>
          <TabsTrigger value="bindings">运行时绑定</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索工具..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="px-3 py-2 border rounded-md text-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as ToolCategory | 'all')}
                  >
                    <option value="all">所有类别</option>
                    <option value="resource">资源</option>
                    <option value="action">操作</option>
                    <option value="prompt">提示词</option>
                    <option value="utility">工具</option>
                  </select>
                  <select 
                    className="px-3 py-2 border rounded-md text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ToolStatus | 'all')}
                  >
                    <option value="all">所有状态</option>
                    <option value="enabled">已启用</option>
                    <option value="disabled">已禁用</option>
                    <option value="available">可用</option>
                    <option value="error">错误</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onToggle={() => handleToggle(tool)}
                onBindView={() => handleBindView(tool)}
              />
            ))}
          </div>

          {filteredTools.length === 0 && (
            <Card>
              <CardContent className="py-0">
                <EmptyState variant="search" title="没有找到匹配的工具" description="请尝试其他搜索条件" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="registries">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>服务名称</TableHead>
                    <TableHead>总工具数</TableHead>
                    <TableHead>已启用</TableHead>
                    <TableHead>已禁用</TableHead>
                    <TableHead>最后同步</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registries.map((registry) => (
                    <TableRow key={registry.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          {registry.name}
                        </div>
                      </TableCell>
                      <TableCell>{registry.totalTools}</TableCell>
                      <TableCell className="text-green-600">{registry.enabledTools}</TableCell>
                      <TableCell className="text-gray-500">{registry.disabledTools}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(registry.lastSync).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">
                          {registry.status === 'synced' ? '已同步' : registry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bindings">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工具名称</TableHead>
                    <TableHead>运行时 ID</TableHead>
                    <TableHead>绑定时间</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bindings.map((binding) => (
                    <TableRow key={binding.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          {binding.toolName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {binding.runtimeId}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(binding.boundAt).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <Badge className={binding.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'}>
                          {binding.status === 'active' ? '活跃' : '非活跃'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bind Dialog */}
      <Dialog open={bindDialogOpen} onOpenChange={setBindDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>工具绑定配置</DialogTitle>
            <DialogDescription>
              配置工具 "{selectedTool?.name}" 到运行时注册表
            </DialogDescription>
          </DialogHeader>

          {selectedTool && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>工具 ID</Label>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                  {selectedTool.id}
                </div>
              </div>
              <div className="space-y-2">
                <Label>所属服务</Label>
                <div className="text-sm">{selectedTool.serviceName}</div>
              </div>
              <div className="space-y-2">
                <Label>输入 Schema</Label>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(selectedTool.inputSchema, null, 2)}
                </pre>
              </div>
              <div className="space-y-2">
                <Label>权限要求</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedTool.permissions.map((perm) => (
                    <Badge key={perm} variant="outline">{perm}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBindDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setBindDialogOpen(false)}>
              确认绑定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MCPToolDiscovery
