import { useState, useMemo } from 'react'
import {
  Server,
  Upload,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  Link,
  Edit3,
  Plus,
  Settings,
  RefreshCw,
  FileCode,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
export type MarketStatus = 'active' | 'inactive' | 'syncing'
export type ResourceVisibility = 'private' | 'internal' | 'public'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface MarketEndpoint {
  id: string
  name: string
  url: string
  isDefault: boolean
  status: MarketStatus
  lastSynced?: string
  resourceCount: number
}

export interface UploadedResource {
  id: string
  name: string
  version: string
  description: string
  category: string
  visibility: ResourceVisibility
  uploader: string
  uploadedAt: string
  reviewStatus: ReviewStatus
  reviewer?: string
  reviewedAt?: string
  reviewNotes?: string
  fileSize: string
  checksum: string
}

export interface PrivateMarketConfig {
  id: string
  name: string
  isEnabled: boolean
  endpoints: MarketEndpoint[]
  syncPolicy: 'manual' | 'auto' | 'scheduled'
  syncInterval?: number
  approvalRequired: boolean
  maxResourceSize: number
  allowedCategories: string[]
  createdAt: string
  updatedAt: string
}

export interface PrivateMarketStats {
  totalEndpoints: number
  activeEndpoints: number
  totalResources: number
  pendingReviews: number
  approvedResources: number
  rejectedResources: number
}

// Mock data
const MOCK_UPLOADED_RESOURCES: UploadedResource[] = [
  {
    id: 'upload-001',
    name: '企业内部培训助手',
    version: '1.0.0',
    description: '专门针对我司内部培训流程的AI助手技能',
    category: 'skill',
    visibility: 'private',
    uploader: '张经理',
    uploadedAt: '2026-03-24T10:00:00Z',
    reviewStatus: 'pending',
    fileSize: '1.2 MB',
    checksum: 'a1b2c3d4e5f6',
  },
  {
    id: 'upload-002',
    name: '销售话术模板库',
    version: '2.0.0',
    description: '公司销售团队专用的话术模板集合',
    category: 'template',
    visibility: 'internal',
    uploader: '李主管',
    uploadedAt: '2026-03-23T14:30:00Z',
    reviewStatus: 'approved',
    reviewer: '王总监',
    reviewedAt: '2026-03-24T09:00:00Z',
    reviewNotes: '内容合规，通过审核',
    fileSize: '3.5 MB',
    checksum: 'b2c3d4e5f6g7',
  },
  {
    id: 'upload-003',
    name: '财务报销流程',
    version: '1.1.0',
    description: '新版财务报销流程自动化技能',
    category: 'skill',
    visibility: 'private',
    uploader: '财务部-小王',
    uploadedAt: '2026-03-22T16:00:00Z',
    reviewStatus: 'rejected',
    reviewer: '审计部-老张',
    reviewedAt: '2026-03-23T11:00:00Z',
    reviewNotes: '存在数据安全风险，需要修改后重新提交',
    fileSize: '2.1 MB',
    checksum: 'c3d4e5f6g7h8',
  },
]

const MOCK_ENDPOINTS: MarketEndpoint[] = [
  {
    id: 'ep-001',
    name: '主市场',
    url: 'https://market.company.com/api/v1',
    isDefault: true,
    status: 'active',
    lastSynced: '2026-03-25T08:00:00Z',
    resourceCount: 156,
  },
  {
    id: 'ep-002',
    name: '备份市场',
    url: 'https://backup.market.company.com/api/v1',
    isDefault: false,
    status: 'inactive',
    resourceCount: 0,
  },
]

const MOCK_CONFIG: PrivateMarketConfig = {
  id: 'config-001',
  name: '企业私有市场',
  isEnabled: true,
  endpoints: MOCK_ENDPOINTS,
  syncPolicy: 'auto',
  syncInterval: 24,
  approvalRequired: true,
  maxResourceSize: 100,
  allowedCategories: ['skill', 'soul', 'template', 'plugin'],
  createdAt: '2025-06-01T10:00:00Z',
  updatedAt: '2026-03-20T14:30:00Z',
}

// Calculate stats
const calculateStats = (): PrivateMarketStats => {
  const pending = MOCK_UPLOADED_RESOURCES.filter(r => r.reviewStatus === 'pending').length
  const approved = MOCK_UPLOADED_RESOURCES.filter(r => r.reviewStatus === 'approved').length
  const rejected = MOCK_UPLOADED_RESOURCES.filter(r => r.reviewStatus === 'rejected').length

  return {
    totalEndpoints: MOCK_ENDPOINTS.length,
    activeEndpoints: MOCK_ENDPOINTS.filter(e => e.status === 'active').length,
    totalResources: MOCK_UPLOADED_RESOURCES.length,
    pendingReviews: pending,
    approvedResources: approved,
    rejectedResources: rejected,
  }
}

// Get visibility label
const getVisibilityLabel = (visibility: ResourceVisibility): string => {
  switch (visibility) {
    case 'private':
      return '私有'
    case 'internal':
      return '内部'
    case 'public':
      return '公开'
  }
}

// Get visibility color
const getVisibilityColor = (visibility: ResourceVisibility): string => {
  switch (visibility) {
    case 'private':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'internal':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'public':
      return 'bg-green-100 text-green-700 border-green-200'
  }
}

// Get review status label
const getReviewStatusLabel = (status: ReviewStatus): string => {
  switch (status) {
    case 'pending':
      return '待审核'
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已拒绝'
  }
}

// Get review status color
const getReviewStatusColor = (status: ReviewStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'approved':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200'
  }
}

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// Format datetime
const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Main component
export function PrivateMarketConfig() {
  const [config, setConfig] = useState<PrivateMarketConfig>(MOCK_CONFIG)
  const [uploadedResources] = useState<UploadedResource[]>(MOCK_UPLOADED_RESOURCES)
  const [selectedResource, setSelectedResource] = useState<UploadedResource | null>(null)
  const [activeTab, setActiveTab] = useState<string>('endpoints')
  const [isSyncing, setIsSyncing] = useState(false)

  const stats = useMemo(() => calculateStats(), [])

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
    }, 2000)
  }

  const handleToggleEnabled = () => {
    setConfig(prev => ({ ...prev, isEnabled: !prev.isEnabled }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">私有市场配置</h2>
        <p className="text-sm text-slate-500 mt-1">配置和管理企业私有资源市场</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">端点总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalEndpoints}</p>
              </div>
              <Server className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">活跃端点</p>
                <p className="text-2xl font-bold text-green-500">{stats.activeEndpoints}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">资源总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalResources}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">待审核</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pendingReviews}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">已通过</p>
                <p className="text-2xl font-bold text-blue-500">{stats.approvedResources}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">已拒绝</p>
                <p className="text-2xl font-bold text-red-500">{stats.rejectedResources}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="endpoints">端点管理</TabsTrigger>
          <TabsTrigger value="upload">上传资源</TabsTrigger>
          <TabsTrigger value="review">审核队列</TabsTrigger>
          <TabsTrigger value="settings">市场设置</TabsTrigger>
        </TabsList>

        {/* Endpoints */}
        <TabsContent value="endpoints">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">市场端点</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        同步中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        同步资源
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    添加端点
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {config.endpoints.map(endpoint => (
                  <div key={endpoint.id} className="p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5 text-slate-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{endpoint.name}</span>
                            {endpoint.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                默认
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Link className="h-3 w-3" />
                            {endpoint.url}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {endpoint.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            活跃
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                            <Lock className="h-3 w-3 mr-1" />
                            未启用
                          </Badge>
                        )}
                        <span className="text-sm text-slate-500">
                          {endpoint.resourceCount} 资源
                        </span>
                        {endpoint.lastSynced && (
                          <span className="text-xs text-slate-400">
                            上次同步: {formatDateTime(endpoint.lastSynced)}
                          </span>
                        )}
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload */}
        <TabsContent value="upload">
          <div className="grid grid-cols-3 gap-4">
            {/* Upload Form */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-base">上传资源</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                    <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-2">拖拽文件到此处或点击上传</p>
                    <p className="text-xs text-slate-400">支持 .zip, .tar.gz, .skill, .soul 格式</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">资源名称</label>
                    <Input className="mt-1" placeholder="输入资源名称" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">版本</label>
                    <Input className="mt-1" placeholder="如 1.0.0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">分类</label>
                    <select className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                      <option value="skill">技能</option>
                      <option value="soul">Persona</option>
                      <option value="template">模板</option>
                      <option value="plugin">插件</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">可见性</label>
                    <select className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                      <option value="private">私有</option>
                      <option value="internal">内部</option>
                      <option value="public">公开</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">描述</label>
                    <textarea
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm h-20"
                      placeholder="简要描述资源功能"
                    />
                  </div>
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-1" />
                    上传资源
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Resources List */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-base">已上传资源</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedResources.map(resource => (
                    <div
                      key={resource.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedResource?.id === resource.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedResource(resource)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-sm">{resource.name}</span>
                          <Badge className={getVisibilityColor(resource.visibility)}>
                            {getVisibilityLabel(resource.visibility)}
                          </Badge>
                        </div>
                        <Badge className={getReviewStatusColor(resource.reviewStatus)}>
                          {getReviewStatusLabel(resource.reviewStatus)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>上传者: {resource.uploader}</span>
                        <span>上传于: {formatDate(resource.uploadedAt)}</span>
                        <span>大小: {resource.fileSize}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Review Queue */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">审核队列</CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-yellow-100 text-yellow-700">
                    {stats.pendingReviews} 待审核
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedResources.map(resource => (
                  <div key={resource.id} className="p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <FileCode className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{resource.name}</span>
                            <Badge className={getVisibilityColor(resource.visibility)}>
                              {getVisibilityLabel(resource.visibility)}
                            </Badge>
                            <Badge className={getReviewStatusColor(resource.reviewStatus)}>
                              {getReviewStatusLabel(resource.reviewStatus)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{resource.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>上传者: {resource.uploader}</span>
                            <span>上传于: {formatDateTime(resource.uploadedAt)}</span>
                            <span>大小: {resource.fileSize}</span>
                            <span>校验码: {resource.checksum}</span>
                          </div>
                          {resource.reviewer && (
                            <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                              <span className="text-slate-500">审核结果: </span>
                              <span className="text-slate-700">
                                {resource.reviewer} 于 {formatDateTime(resource.reviewedAt!)} 审核
                              </span>
                              {resource.reviewNotes && (
                                <p className="text-slate-600 mt-1">{resource.reviewNotes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {resource.reviewStatus === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            通过
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            拒绝
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">市场配置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {config.isEnabled ? (
                      <Unlock className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-400" />
                    )}
                    <div>
                      <p className="font-medium">启用私有市场</p>
                      <p className="text-sm text-slate-500">关闭后用户将无法访问私有资源</p>
                    </div>
                  </div>
                  <Button
                    variant={config.isEnabled ? 'default' : 'outline'}
                    onClick={handleToggleEnabled}
                  >
                    {config.isEnabled ? '已启用' : '已禁用'}
                  </Button>
                </div>

                {/* Sync Policy */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">同步策略</label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={config.syncPolicy}
                    onChange={() => {}}
                  >
                    <option value="manual">手动同步</option>
                    <option value="auto">自动同步</option>
                    <option value="scheduled">定时同步</option>
                  </select>
                  {config.syncPolicy === 'scheduled' && (
                    <p className="text-xs text-slate-500">每隔 {config.syncInterval} 小时同步一次</p>
                  )}
                </div>

                {/* Approval Required */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">审核要求</p>
                    <p className="text-sm text-slate-500">上传的资源需要审核才能公开</p>
                  </div>
                  <Button variant={config.approvalRequired ? 'default' : 'outline'}>
                    {config.approvalRequired ? '已启用' : '已禁用'}
                  </Button>
                </div>

                {/* Max Resource Size */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">最大资源大小</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="w-24" defaultValue={config.maxResourceSize} />
                    <span className="text-sm text-slate-500">MB</span>
                  </div>
                </div>

                {/* Allowed Categories */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">允许的分类</label>
                  <div className="flex flex-wrap gap-2">
                    {['skill', 'soul', 'template', 'plugin', 'dataset'].map(cat => (
                      <Badge
                        key={cat}
                        variant={config.allowedCategories.includes(cat) ? 'default' : 'outline'}
                        className="cursor-pointer"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>创建于: {formatDateTime(config.createdAt)}</span>
                    <span>更新于: {formatDateTime(config.updatedAt)}</span>
                  </div>
                </div>

                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-1" />
                  保存配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
