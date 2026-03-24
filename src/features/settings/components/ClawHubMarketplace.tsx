import { useState, useMemo } from 'react'
import {
  Store,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Shield,
  ArrowRight,
  RefreshCw,
  Package,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
export type ResourceStatus = 'available' | 'installed' | 'update_available' | 'incompatible'
export type ResourceCategory = 'skill' | 'soul' | 'plugin' | 'template' | 'dataset'
export type SecurityLevel = 'verified' | 'review_pending' | 'unverified'

export interface MarketplaceResource {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: ResourceCategory
  status: ResourceStatus
  securityLevel: SecurityLevel
  rating: number
  downloadCount: number
  lastUpdated: string
  price: number
  tags: string[]
  compatibility: string[]
  dependencies: string[]
  size: string
  previewImages?: string[]
  installProgress?: number
  securityNotes?: string[]
}

export interface SecurityCheck {
  id: string
  name: string
  status: 'passed' | 'failed' | 'pending' | 'warning'
  details?: string
}

export interface InstallationRequest {
  resourceId: string
  resourceName: string
  securityChecks: SecurityCheck[]
  isInstalling: boolean
  installError?: string
}

export interface MarketplaceStats {
  totalResources: number
  availableResources: number
  installedResources: number
  pendingInstalls: number
  averageRating: number
}

// Mock marketplace resources
const MOCK_RESOURCES: MarketplaceResource[] = [
  {
    id: 'res-001',
    name: 'HR员工入职助手',
    version: '1.3.0',
    description: '自动化员工入职流程，包括账号创建、工位分配、培训安排等完整流程',
    author: 'HR Solutions Inc.',
    category: 'skill',
    status: 'available',
    securityLevel: 'verified',
    rating: 4.8,
    downloadCount: 12500,
    lastUpdated: '2026-03-15T10:00:00Z',
    price: 0,
    tags: ['hr', 'automation', 'onboarding'],
    compatibility: ['HR系统', '企业微信', '飞书'],
    dependencies: ['mcp-hr-system@1.0.0', 'mcp-email-service@2.0.0'],
    size: '2.3 MB',
    securityNotes: ['代码审计通过', '无恶意代码', '数据加密传输'],
  },
  {
    id: 'res-002',
    name: '财务报销审核',
    version: '2.1.0',
    description: '智能财务报销审核技能，支持多级审批和异常检测',
    author: 'Finance Tools Co.',
    category: 'skill',
    status: 'installed',
    securityLevel: 'verified',
    rating: 4.6,
    downloadCount: 8900,
    lastUpdated: '2026-03-10T10:00:00Z',
    price: 299,
    tags: ['finance', 'approval', 'automation'],
    compatibility: ['财务系统', 'ERP系统'],
    dependencies: ['mcp-finance-system@1.5.0'],
    size: '1.8 MB',
  },
  {
    id: 'res-003',
    name: '客服温柔小姐姐',
    version: '1.0.0',
    description: '温暖型客服Persona，声音柔和，擅长处理客户投诉',
    author: 'Persona Studio',
    category: 'soul',
    status: 'update_available',
    securityLevel: 'verified',
    rating: 4.9,
    downloadCount: 5600,
    lastUpdated: '2026-03-18T10:00:00Z',
    price: 0,
    tags: ['customer-service', 'persona', 'warm'],
    compatibility: ['客服系统', '工单系统'],
    dependencies: [],
    size: '0.5 MB',
    installProgress: 0,
  },
  {
    id: 'res-004',
    name: '销售精英助手',
    version: '1.2.0',
    description: '高效销售支持Persona，擅长挖掘客户需求和促成交易',
    author: 'Sales Pro',
    category: 'soul',
    status: 'available',
    securityLevel: 'review_pending',
    rating: 4.5,
    downloadCount: 3200,
    lastUpdated: '2026-03-01T10:00:00Z',
    price: 199,
    tags: ['sales', 'persona', 'crm'],
    compatibility: ['CRM系统', '销售系统'],
    dependencies: [],
    size: '0.6 MB',
    securityNotes: ['审核中'],
  },
  {
    id: 'res-005',
    name: '数据库安全插件',
    version: '1.0.0',
    description: '提供数据库操作能力，支持SQL注入检测和访问控制',
    author: 'Security Plugins Ltd.',
    category: 'plugin',
    status: 'incompatible',
    securityLevel: 'verified',
    rating: 4.2,
    downloadCount: 2100,
    lastUpdated: '2026-02-20T10:00:00Z',
    price: 0,
    tags: ['database', 'security', 'plugin'],
    compatibility: ['需要专业版许可证'],
    dependencies: [],
    size: '3.1 MB',
  },
  {
    id: 'res-006',
    name: '项目管理模板包',
    version: '1.0.0',
    description: '包含多种项目管理模板，适用于敏捷开发和传统项目管理',
    author: 'Template Masters',
    category: 'template',
    status: 'available',
    securityLevel: 'verified',
    rating: 4.7,
    downloadCount: 15800,
    lastUpdated: '2026-03-12T10:00:00Z',
    price: 0,
    tags: ['project-management', 'template', 'agile'],
    compatibility: ['项目管理工具', '钉钉', '飞书'],
    dependencies: [],
    size: '5.2 MB',
  },
  {
    id: 'res-007',
    name: '客服知识数据集',
    version: '1.0.0',
    description: '包含10万+条客服对话数据，用于训练客服AI模型',
    author: 'Data Science Corp.',
    category: 'dataset',
    status: 'available',
    securityLevel: 'unverified',
    rating: 4.0,
    downloadCount: 980,
    lastUpdated: '2026-02-28T10:00:00Z',
    price: 999,
    tags: ['dataset', 'training', 'nlp'],
    compatibility: ['AI训练平台'],
    dependencies: [],
    size: '256 MB',
    securityNotes: ['数据脱敏处理', '用户隐私保护'],
  },
]

// Calculate stats
const calculateStats = (resources: MarketplaceResource[]): MarketplaceStats => {
  const available = resources.filter(r => r.status === 'available').length
  const installed = resources.filter(r => r.status === 'installed' || r.status === 'update_available').length
  const pending = resources.filter(r => r.installProgress !== undefined && r.installProgress < 100).length
  const avgRating = Math.round(
    (resources.reduce((sum, r) => sum + r.rating, 0) / resources.length) * 10
  ) / 10

  return {
    totalResources: resources.length,
    availableResources: available,
    installedResources: installed,
    pendingInstalls: pending,
    averageRating: avgRating,
  }
}

// Get category label
const getCategoryLabel = (category: ResourceCategory): string => {
  switch (category) {
    case 'skill':
      return '技能'
    case 'soul':
      return 'Persona'
    case 'plugin':
      return '插件'
    case 'template':
      return '模板'
    case 'dataset':
      return '数据集'
  }
}

// Get category color
const getCategoryColor = (category: ResourceCategory): string => {
  switch (category) {
    case 'skill':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'soul':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'plugin':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'template':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'dataset':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200'
  }
}

// Get status label
const getStatusLabel = (status: ResourceStatus): string => {
  switch (status) {
    case 'available':
      return '可安装'
    case 'installed':
      return '已安装'
    case 'update_available':
      return '有更新'
    case 'incompatible':
      return '不兼容'
  }
}

// Get status color
const getStatusColor = (status: ResourceStatus): string => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'installed':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'update_available':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'incompatible':
      return 'bg-red-100 text-red-700 border-red-200'
  }
}

// Get security label
const getSecurityLabel = (level: SecurityLevel): string => {
  switch (level) {
    case 'verified':
      return '已认证'
    case 'review_pending':
      return '审核中'
    case 'unverified':
      return '未认证'
  }
}

// Get security color
const getSecurityColor = (level: SecurityLevel): string => {
  switch (level) {
    case 'verified':
      return 'bg-green-100 text-green-700'
    case 'review_pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'unverified':
      return 'bg-slate-100 text-slate-700'
  }
}

// Format number
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  return num.toString()
}

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// Main component
export function ClawHubMarketplace() {
  const [resources, setResources] = useState<MarketplaceResource[]>(MOCK_RESOURCES)
  const [selectedResource, setSelectedResource] = useState<MarketplaceResource | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all')
  const [showInstalled, setShowInstalled] = useState(false)
  const [installingId, setInstallingId] = useState<string | null>(null)

  const stats = useMemo(() => calculateStats(resources), [resources])

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      if (searchQuery && !res.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !res.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (categoryFilter !== 'all' && res.category !== categoryFilter) {
        return false
      }
      if (!showInstalled && (res.status === 'installed' || res.status === 'update_available')) {
        return false
      }
      return true
    })
  }, [resources, searchQuery, categoryFilter, showInstalled])

  const handleInstall = (resourceId: string) => {
    setInstallingId(resourceId)
    setResources(prev =>
      prev.map(r =>
        r.id === resourceId ? { ...r, installProgress: 0 } : r
      )
    )

    // Simulate installation progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      if (progress <= 100) {
        setResources(prev =>
          prev.map(r =>
            r.id === resourceId ? { ...r, installProgress: progress } : r
          )
        )
      } else {
        clearInterval(interval)
        setResources(prev =>
          prev.map(r =>
            r.id === resourceId ? { ...r, installProgress: undefined, status: 'installed' as ResourceStatus } : r
          )
        )
        setInstallingId(null)
      }
    }, 300)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">ClawHub 市场</h2>
        <p className="text-sm text-slate-500 mt-1">浏览和安装兼容的 Agent 资源</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">资源总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalResources}</p>
              </div>
              <Store className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">可安装</p>
                <p className="text-2xl font-bold text-green-500">{stats.availableResources}</p>
              </div>
              <Download className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">已安装</p>
                <p className="text-2xl font-bold text-blue-500">{stats.installedResources}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">待安装</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pendingInstalls}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">平均评分</p>
                <p className="text-2xl font-bold text-slate-800">{stats.averageRating}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="搜索资源..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as ResourceCategory | 'all')}
            >
              <option value="all">全部分类</option>
              <option value="skill">技能</option>
              <option value="soul">Persona</option>
              <option value="plugin">插件</option>
              <option value="template">模板</option>
              <option value="dataset">数据集</option>
            </select>
            <Button
              variant={showInstalled ? 'default' : 'outline'}
              onClick={() => setShowInstalled(!showInstalled)}
            >
              {showInstalled ? '隐藏已安装' : '显示已安装'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resource List */}
      <div className="grid grid-cols-3 gap-4">
        {/* Resources */}
        <div className="col-span-1 space-y-3">
          {filteredResources.map(resource => (
            <div
              key={resource.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedResource?.id === resource.id
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${resource.status === 'incompatible' ? 'opacity-60' : ''}`}
              onClick={() => setSelectedResource(resource)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-500" />
                  <span className="font-medium text-sm text-slate-800">{resource.name}</span>
                </div>
                <Badge className={getStatusColor(resource.status)}>{getStatusLabel(resource.status)}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{resource.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getCategoryColor(resource.category)}>{getCategoryLabel(resource.category)}</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400" />
                  {resource.rating}
                </span>
                <span className="text-xs text-slate-400">
                  {formatNumber(resource.downloadCount)} 下载
                </span>
              </div>
              {resource.installProgress !== undefined && resource.installProgress < 100 && (
                <div className="mt-2">
                  <Progress value={resource.installProgress} className="h-1" />
                  <span className="text-xs text-slate-500">安装中: {resource.installProgress}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resource Detail */}
        <div className="col-span-2">
          {selectedResource ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-slate-500" />
                    <div>
                      <CardTitle className="text-base">{selectedResource.name}</CardTitle>
                      <p className="text-sm text-slate-500">
                        v{selectedResource.version} · by {selectedResource.author}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedResource.price === 0 ? (
                      <Badge className="bg-green-100 text-green-700">免费</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700">¥{selectedResource.price}</Badge>
                    )}
                    {selectedResource.status === 'available' && (
                      <Button
                        onClick={() => handleInstall(selectedResource.id)}
                        disabled={installingId !== null}
                      >
                        {installingId === selectedResource.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            安装中...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            安装
                          </>
                        )}
                      </Button>
                    )}
                    {selectedResource.status === 'installed' && (
                      <Button variant="outline" disabled>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        已安装
                      </Button>
                    )}
                    {selectedResource.status === 'update_available' && (
                      <Button onClick={() => handleInstall(selectedResource.id)}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        更新
                      </Button>
                    )}
                    {selectedResource.status === 'incompatible' && (
                      <Button variant="outline" disabled>
                        <Lock className="h-4 w-4 mr-1" />
                        不兼容
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getCategoryColor(selectedResource.category)}>
                        {getCategoryLabel(selectedResource.category)}
                      </Badge>
                      <Badge className={getStatusColor(selectedResource.status)}>
                        {getStatusLabel(selectedResource.status)}
                      </Badge>
                      <Badge className={getSecurityColor(selectedResource.securityLevel)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {getSecurityLabel(selectedResource.securityLevel)}
                      </Badge>
                      {selectedResource.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-1">描述</h4>
                      <p className="text-sm text-slate-700">{selectedResource.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-slate-800">{selectedResource.rating}</div>
                        <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          评分
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-slate-800">{formatNumber(selectedResource.downloadCount)}</div>
                        <div className="text-xs text-slate-500">下载</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-slate-800">{selectedResource.size}</div>
                        <div className="text-xs text-slate-500">大小</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-slate-800">{formatDate(selectedResource.lastUpdated)}</div>
                        <div className="text-xs text-slate-500">更新</div>
                      </div>
                    </div>

                    {/* Compatibility */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-2">兼容性</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResource.compatibility.map(c => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Dependencies */}
                    {selectedResource.dependencies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-600 mb-2">依赖</h4>
                        <div className="space-y-1">
                          {selectedResource.dependencies.map(dep => (
                            <div key={dep} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">{dep}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Security Notes */}
                    {selectedResource.securityNotes && selectedResource.securityNotes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          安全说明
                        </h4>
                        <div className="space-y-1">
                          {selectedResource.securityNotes.map((note, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Governance Check */}
                    {selectedResource.status === 'available' && (
                      <div className="border-t border-slate-200 pt-4">
                        <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          治理检查
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>安全扫描: 通过</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>权限审查: 通过</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {selectedResource.securityLevel === 'verified' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : selectedResource.securityLevel === 'review_pending' ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>安全认证: {getSecurityLabel(selectedResource.securityLevel)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Store className="h-12 w-12 mx-auto mb-2" />
                <p>选择左侧资源查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
