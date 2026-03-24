import { useState, useMemo } from 'react'
import {
  Puzzle,
  Wrench,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plug,
  RefreshCw,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
export type PluginStatus = 'active' | 'inactive' | 'error' | 'updating'
export type SandboxLevel = 'full' | 'restricted' | 'minimal'
export type CapabilityType = 'file_read' | 'file_write' | 'network' | 'exec' | 'env' | 'persist'

export interface PluginTool {
  id: string
  name: string
  originalName: string
  description: string
  parameters: string[]
  returnType: string
  isAdapted: boolean
  adaptationNotes?: string
}

export interface PluginCapability {
  type: CapabilityType
  allowed: boolean
  restrictions?: string[]
}

export interface PluginAdaptation {
  id: string
  name: string
  version: string
  description: string
  author: string
  status: PluginStatus
  sandboxLevel: SandboxLevel
  tools: PluginTool[]
  capabilities: PluginCapability[]
  memoryLimit?: number
  networkRestrictions?: string[]
  lastAdapted: string
  isEnabled: boolean
}

export interface AdaptationStats {
  totalPlugins: number
  activePlugins: number
  adaptedTools: number
  totalCapabilities: number
  restrictedCapabilities: number
  averageSandboxLevel: 'full' | 'restricted' | 'minimal'
}

// Mock plugins
const MOCK_PLUGINS: PluginAdaptation[] = [
  {
    id: 'plugin-001',
    name: '文件系统插件',
    version: '1.2.0',
    description: '提供文件系统读写能力',
    author: 'Platform Team',
    status: 'active',
    sandboxLevel: 'restricted',
    tools: [
      {
        id: 'tool-001',
        name: 'read_file',
        originalName: 'fs.read',
        description: '读取文件内容',
        parameters: ['path'],
        returnType: 'string',
        isAdapted: true,
        adaptationNotes: '已添加路径限制，只能读取白名单目录',
      },
      {
        id: 'tool-002',
        name: 'write_file',
        originalName: 'fs.write',
        description: '写入文件内容',
        parameters: ['path', 'content'],
        returnType: 'boolean',
        isAdapted: true,
        adaptationNotes: '已禁用，写入操作存在安全风险',
      },
      {
        id: 'tool-003',
        name: 'list_directory',
        originalName: 'fs.list',
        description: '列出目录内容',
        parameters: ['path'],
        returnType: 'array',
        isAdapted: true,
      },
    ],
    capabilities: [
      { type: 'file_read', allowed: true, restrictions: ['/allowed/path'] },
      { type: 'file_write', allowed: false },
      { type: 'network', allowed: false },
      { type: 'exec', allowed: false },
      { type: 'env', allowed: true },
      { type: 'persist', allowed: true },
    ],
    memoryLimit: 256,
    lastAdapted: '2026-03-20T10:00:00Z',
    isEnabled: true,
  },
  {
    id: 'plugin-002',
    name: '网络请求插件',
    version: '2.0.1',
    description: '提供HTTP请求能力',
    author: 'Network Team',
    status: 'active',
    sandboxLevel: 'minimal',
    tools: [
      {
        id: 'tool-004',
        name: 'http_get',
        originalName: 'net.http_get',
        description: '发送GET请求',
        parameters: ['url', 'headers'],
        returnType: 'object',
        isAdapted: true,
        adaptationNotes: '已添加域名白名单限制',
      },
      {
        id: 'tool-005',
        name: 'http_post',
        originalName: 'net.http_post',
        description: '发送POST请求',
        parameters: ['url', 'headers', 'body'],
        returnType: 'object',
        isAdapted: true,
      },
    ],
    capabilities: [
      { type: 'file_read', allowed: false },
      { type: 'file_write', allowed: false },
      { type: 'network', allowed: true, restrictions: ['*.company.com', 'api.example.com'] },
      { type: 'exec', allowed: false },
      { type: 'env', allowed: true },
      { type: 'persist', allowed: false },
    ],
    networkRestrictions: ['*.company.com', 'api.example.com'],
    lastAdapted: '2026-03-19T15:30:00Z',
    isEnabled: true,
  },
  {
    id: 'plugin-003',
    name: '数据库插件',
    version: '1.0.0',
    description: '提供数据库操作能力',
    author: 'Data Team',
    status: 'inactive',
    sandboxLevel: 'full',
    tools: [
      {
        id: 'tool-006',
        name: 'query',
        originalName: 'db.query',
        description: '执行SQL查询',
        parameters: ['sql', 'params'],
        returnType: 'array',
        isAdapted: false,
        adaptationNotes: '待适配，需要更多安全审核',
      },
      {
        id: 'tool-007',
        name: 'execute',
        originalName: 'db.execute',
        description: '执行SQL语句',
        parameters: ['sql', 'params'],
        returnType: 'object',
        isAdapted: false,
      },
    ],
    capabilities: [
      { type: 'file_read', allowed: false },
      { type: 'file_write', allowed: false },
      { type: 'network', allowed: false },
      { type: 'exec', allowed: false },
      { type: 'env', allowed: true },
      { type: 'persist', allowed: true },
    ],
    lastAdapted: '2026-03-18T09:00:00Z',
    isEnabled: false,
  },
  {
    id: 'plugin-004',
    name: 'Shell执行插件',
    version: '1.5.0',
    description: '提供Shell命令执行能力',
    author: 'System Team',
    status: 'error',
    sandboxLevel: 'minimal',
    tools: [
      {
        id: 'tool-008',
        name: 'run_command',
        originalName: 'sys.exec',
        description: '执行Shell命令',
        parameters: ['command', 'args'],
        returnType: 'object',
        isAdapted: true,
        adaptationNotes: '已禁用，Shell执行存在高安全风险',
      },
    ],
    capabilities: [
      { type: 'file_read', allowed: false },
      { type: 'file_write', allowed: false },
      { type: 'network', allowed: false },
      { type: 'exec', allowed: false },
      { type: 'env', allowed: false },
      { type: 'persist', allowed: false },
    ],
    lastAdapted: '2026-03-15T14:00:00Z',
    isEnabled: false,
  },
]

// Calculate stats
const calculateStats = (plugins: PluginAdaptation[]): AdaptationStats => {
  const active = plugins.filter(p => p.status === 'active' && p.isEnabled).length
  const adaptedTools = plugins.reduce((sum, p) => sum + p.tools.filter(t => t.isAdapted).length, 0)
  const totalCaps = plugins.reduce((sum, p) => sum + p.capabilities.length, 0)
  const restrictedCaps = plugins.reduce(
    (sum, p) => sum + p.capabilities.filter(c => !c.allowed || (c.restrictions && c.restrictions.length > 0)).length,
    0
  )

  return {
    totalPlugins: plugins.length,
    activePlugins: active,
    adaptedTools,
    totalCapabilities: totalCaps,
    restrictedCapabilities: restrictedCaps,
    averageSandboxLevel: 'restricted',
  }
}

// Get status color
const getStatusColor = (status: PluginStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'inactive':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'error':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'updating':
      return 'bg-blue-100 text-blue-700 border-blue-200'
  }
}

// Get status label
const getStatusLabel = (status: PluginStatus): string => {
  switch (status) {
    case 'active':
      return '活跃'
    case 'inactive':
      return '未启用'
    case 'error':
      return '错误'
    case 'updating':
      return '更新中'
  }
}

// Get sandbox color
const getSandboxColor = (level: SandboxLevel): string => {
  switch (level) {
    case 'full':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'restricted':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'minimal':
      return 'bg-red-100 text-red-700 border-red-200'
  }
}

// Get sandbox label
const getSandboxLabel = (level: SandboxLevel): string => {
  switch (level) {
    case 'full':
      return '完全'
    case 'restricted':
      return '受限'
    case 'minimal':
      return '最小'
  }
}

// Get capability label
const getCapabilityLabel = (type: CapabilityType): string => {
  switch (type) {
    case 'file_read':
      return '文件读取'
    case 'file_write':
      return '文件写入'
    case 'network':
      return '网络'
    case 'exec':
      return '执行'
    case 'env':
      return '环境变量'
    case 'persist':
      return '持久化'
  }
}

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// Main component
export function PluginAdaptation() {
  const [plugins, setPlugins] = useState<PluginAdaptation[]>(MOCK_PLUGINS)
  const [selectedPlugin, setSelectedPlugin] = useState<PluginAdaptation | null>(null)
  const [activeTab, setActiveTab] = useState<string>('plugins')

  const stats = useMemo(() => calculateStats(plugins), [plugins])

  const handleTogglePlugin = (pluginId: string) => {
    setPlugins(prev =>
      prev.map(p =>
        p.id === pluginId ? { ...p, isEnabled: !p.isEnabled } : p
      )
    )
    if (selectedPlugin?.id === pluginId) {
      setSelectedPlugin(prev =>
        prev ? { ...prev, isEnabled: !prev.isEnabled } : null
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Plugin 适配转换</h2>
        <p className="text-sm text-slate-500 mt-1">将 Plugin 工具适配到内部运行时合约</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">插件总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalPlugins}</p>
              </div>
              <Plug className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">活跃插件</p>
                <p className="text-2xl font-bold text-green-500">{stats.activePlugins}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">已适配工具</p>
                <p className="text-2xl font-bold text-blue-500">{stats.adaptedTools}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">总能力数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalCapabilities}</p>
              </div>
              <Shield className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">受限能力</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.restrictedCapabilities}</p>
              </div>
              <Lock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">平均沙箱</p>
                <p className="text-2xl font-bold text-slate-800">{getSandboxLabel(stats.averageSandboxLevel)}</p>
              </div>
              <Database className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plugins">插件列表</TabsTrigger>
          <TabsTrigger value="capabilities">能力矩阵</TabsTrigger>
          <TabsTrigger value="sandbox">沙箱配置</TabsTrigger>
        </TabsList>

        {/* Plugins List */}
        <TabsContent value="plugins">
          <div className="grid grid-cols-3 gap-4">
            {/* Plugin List */}
            <div className="col-span-1 space-y-3">
              {plugins.map(plugin => (
                <div
                  key={plugin.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlugin?.id === plugin.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedPlugin(plugin)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Puzzle className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-sm text-slate-800">{plugin.name}</span>
                    </div>
                    <Badge className={getStatusColor(plugin.status)}>{getStatusLabel(plugin.status)}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{plugin.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getSandboxColor(plugin.sandboxLevel)}>
                      沙箱: {getSandboxLabel(plugin.sandboxLevel)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {plugin.tools.length} 工具
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Plugin Detail */}
            <div className="col-span-2">
              {selectedPlugin ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Puzzle className="h-6 w-6 text-slate-500" />
                        <div>
                          <CardTitle className="text-base">{selectedPlugin.name}</CardTitle>
                          <p className="text-sm text-slate-500">v{selectedPlugin.version} · {selectedPlugin.author}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedPlugin.isEnabled ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleTogglePlugin(selectedPlugin.id)}
                        >
                          {selectedPlugin.isEnabled ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              禁用
                            </>
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 mr-1" />
                              启用
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          重新适配
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {/* Status */}
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(selectedPlugin.status)}>
                            状态: {getStatusLabel(selectedPlugin.status)}
                          </Badge>
                          <Badge className={getSandboxColor(selectedPlugin.sandboxLevel)}>
                            沙箱等级: {getSandboxLabel(selectedPlugin.sandboxLevel)}
                          </Badge>
                          {selectedPlugin.memoryLimit && (
                            <Badge variant="outline">
                              内存限制: {selectedPlugin.memoryLimit}MB
                            </Badge>
                          )}
                        </div>

                        {/* Tools */}
                        <div>
                          <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                            <Wrench className="h-4 w-4" />
                            工具 ({selectedPlugin.tools.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedPlugin.tools.map(tool => (
                              <div key={tool.id} className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-sm">{tool.name}</span>
                                    <span className="text-xs text-slate-400 mx-2">← {tool.originalName}</span>
                                  </div>
                                  {tool.isAdapted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{tool.description}</p>
                                {tool.adaptationNotes && (
                                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {tool.adaptationNotes}
                                  </p>
                                )}
                                <div className="flex gap-1 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    返回: {tool.returnType}
                                  </Badge>
                                  {tool.parameters.map(param => (
                                    <Badge key={param} variant="secondary" className="text-xs">
                                      {param}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Capabilities */}
                        <div>
                          <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            能力权限
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedPlugin.capabilities.map(cap => (
                              <div
                                key={cap.type}
                                className={`p-2 rounded-lg border ${
                                  cap.allowed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">
                                    {getCapabilityLabel(cap.type)}
                                  </span>
                                  {cap.allowed ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  )}
                                </div>
                                {cap.restrictions && cap.restrictions.length > 0 && (
                                  <div className="mt-1">
                                    {cap.restrictions.slice(0, 2).map((r, i) => (
                                      <Badge key={i} variant="outline" className="text-xs block mt-1">
                                        {r}
                                      </Badge>
                                    ))}
                                    {cap.restrictions.length > 2 && (
                                      <span className="text-xs text-slate-500">
                                        +{cap.restrictions.length - 2} 更多
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>上次适配: {formatDate(selectedPlugin.lastAdapted)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedPlugin.isEnabled ? (
                                <span className="flex items-center gap-1 text-green-500">
                                  <CheckCircle2 className="h-3 w-3" />
                                  已启用
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Lock className="h-3 w-3" />
                                  已禁用
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <Puzzle className="h-12 w-12 mx-auto mb-2" />
                    <p>选择左侧插件查看详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Capabilities Matrix */}
        <TabsContent value="capabilities">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">能力权限矩阵</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">插件</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">文件读取</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">文件写入</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">网络</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">执行</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">环境变量</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">持久化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plugins.map(plugin => (
                      <tr key={plugin.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{plugin.name}</span>
                          </div>
                        </td>
                        {(['file_read', 'file_write', 'network', 'exec', 'env', 'persist'] as CapabilityType[]).map(
                          capType => {
                            const cap = plugin.capabilities.find(c => c.type === capType)
                            return (
                              <td key={capType} className="text-center py-2 px-3">
                                {cap?.allowed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-300 mx-auto" />
                                )}
                              </td>
                            )
                          }
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sandbox Configuration */}
        <TabsContent value="sandbox">
          <div className="grid grid-cols-2 gap-4">
            {plugins.map(plugin => (
              <Card key={plugin.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plugin.name}</CardTitle>
                    <Badge className={getSandboxColor(plugin.sandboxLevel)}>
                      {getSandboxLabel(plugin.sandboxLevel)}沙箱
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">沙箱等级</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            plugin.sandboxLevel === 'full' ? 100 : plugin.sandboxLevel === 'restricted' ? 50 : 20
                          }
                          className="w-20 h-2"
                        />
                        <span className="text-sm font-medium">{getSandboxLabel(plugin.sandboxLevel)}</span>
                      </div>
                    </div>
                    {plugin.memoryLimit && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">内存限制</span>
                        <span className="text-sm font-medium">{plugin.memoryLimit} MB</span>
                      </div>
                    )}
                    {plugin.networkRestrictions && plugin.networkRestrictions.length > 0 && (
                      <div>
                        <span className="text-sm text-slate-600">网络限制</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {plugin.networkRestrictions.map((r, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">已适配工具</span>
                      <span className="text-sm font-medium">
                        {plugin.tools.filter(t => t.isAdapted).length} / {plugin.tools.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
