import React, { useState, useMemo } from 'react'
import {
  Upload,
  FolderOpen,
  FileText,
  Search,
  MoreVertical,
  Download,
  Trash2,
  Edit,
  Eye,
  Clock,
  Users,
  Building,
  Globe,
  Lock,
  RefreshCw,
  Plus,
  AlertTriangle,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Enterprise Knowledge Base Types
export type DocumentStatus = 'processing' | 'indexed' | 'error' | 'archived'
export type AccessScope = 'public' | 'tenant' | 'department' | 'team' | 'private'
export type DocumentType = 'policy' | 'procedure' | 'guide' | 'reference' | 'template' | 'other'
export type CollectionType = 'department' | 'project' | 'topic' | 'custom'

export interface KnowledgeDocument {
  id: string
  title: string
  type: DocumentType
  status: DocumentStatus
  accessScope: AccessScope
  collectionId: string
  collectionName: string
  fileSize: number
  segments: number
  indexedAt?: number
  uploadedBy: string
  uploadedAt: number
  updatedAt: number
  tags: string[]
  metadata?: Record<string, unknown>
}

export interface KnowledgeCollection {
  id: string
  name: string
  description: string
  type: CollectionType
  documentCount: number
  totalSegments: number
  accessScope: AccessScope
  owner: string
  createdAt: number
  updatedAt: number
}

export interface KnowledgeStats {
  totalDocuments: number
  totalSegments: number
  totalCollections: number
  processingCount: number
  errorCount: number
  byType: Record<DocumentType, number>
  byScope: Record<AccessScope, number>
  storageUsed: number
  lastUpdated: number
}

// Mock Data
const mockDocuments: KnowledgeDocument[] = [
  {
    id: 'doc-001',
    title: '公司安全策略手册',
    type: 'policy',
    status: 'indexed',
    accessScope: 'tenant',
    collectionId: 'col-001',
    collectionName: '安全合规',
    fileSize: 2048576,
    segments: 128,
    indexedAt: Date.now() - 86400000 * 2,
    uploadedBy: 'admin@company.com',
    uploadedAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000,
    tags: ['安全', '合规', '策略'],
  },
  {
    id: 'doc-002',
    title: 'API开发规范指南',
    type: 'guide',
    status: 'indexed',
    accessScope: 'department',
    collectionId: 'col-002',
    collectionName: '技术文档',
    fileSize: 1536000,
    segments: 86,
    indexedAt: Date.now() - 86400000 * 5,
    uploadedBy: 'tech.lead@company.com',
    uploadedAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
    tags: ['API', '开发', '规范'],
  },
  {
    id: 'doc-003',
    title: '新人入职流程文档',
    type: 'procedure',
    status: 'processing',
    accessScope: 'public',
    collectionId: 'col-003',
    collectionName: '人事管理',
    fileSize: 512000,
    segments: 0,
    uploadedBy: 'hr@company.com',
    uploadedAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    tags: ['入职', '流程', '人事'],
  },
  {
    id: 'doc-004',
    title: '财务报销模板',
    type: 'template',
    status: 'indexed',
    accessScope: 'department',
    collectionId: 'col-004',
    collectionName: '财务文档',
    fileSize: 256000,
    segments: 12,
    indexedAt: Date.now() - 86400000 * 10,
    uploadedBy: 'finance@company.com',
    uploadedAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 5,
    tags: ['财务', '报销', '模板'],
  },
  {
    id: 'doc-005',
    title: '产品技术参考手册',
    type: 'reference',
    status: 'error',
    accessScope: 'team',
    collectionId: 'col-002',
    collectionName: '技术文档',
    fileSize: 4096000,
    segments: 0,
    uploadedBy: 'dev@company.com',
    uploadedAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    tags: ['产品', '技术', '参考'],
  },
]

const mockCollections: KnowledgeCollection[] = [
  {
    id: 'col-001',
    name: '安全合规',
    description: '公司安全策略和合规相关文档',
    type: 'department',
    documentCount: 15,
    totalSegments: 512,
    accessScope: 'tenant',
    owner: 'security@company.com',
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'col-002',
    name: '技术文档',
    description: '技术开发相关文档和指南',
    type: 'topic',
    documentCount: 28,
    totalSegments: 1024,
    accessScope: 'department',
    owner: 'tech.lead@company.com',
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'col-003',
    name: '人事管理',
    description: '人事管理相关流程和制度',
    type: 'department',
    documentCount: 12,
    totalSegments: 256,
    accessScope: 'public',
    owner: 'hr@company.com',
    createdAt: Date.now() - 86400000 * 120,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'col-004',
    name: '财务文档',
    description: '财务管理相关文档和模板',
    type: 'department',
    documentCount: 8,
    totalSegments: 128,
    accessScope: 'department',
    owner: 'finance@company.com',
    createdAt: Date.now() - 86400000 * 180,
    updatedAt: Date.now() - 86400000 * 5,
  },
]

const mockStats: KnowledgeStats = {
  totalDocuments: 63,
  totalSegments: 1920,
  totalCollections: 8,
  processingCount: 3,
  errorCount: 2,
  byType: {
    policy: 12,
    procedure: 8,
    guide: 18,
    reference: 15,
    template: 6,
    other: 4,
  },
  byScope: {
    public: 8,
    tenant: 25,
    department: 20,
    team: 7,
    private: 3,
  },
  storageUsed: 524288000,
  lastUpdated: Date.now() - 3600000,
}

const statusColors: Record<DocumentStatus, string> = {
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  indexed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

const scopeColors: Record<AccessScope, string> = {
  public: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  tenant: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  department: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  team: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  private: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
}

const scopeIcons: Record<AccessScope, React.ReactNode> = {
  public: <Globe className="h-3 w-3" />,
  tenant: <Building className="h-3 w-3" />,
  department: <Users className="h-3 w-3" />,
  team: <Users className="h-3 w-3" />,
  private: <Lock className="h-3 w-3" />,
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

export function EnterpriseKnowledgeBase(): React.ReactNode {
  const [activeTab, setActiveTab] = useState('documents')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all')
  const [selectedScope, setSelectedScope] = useState<AccessScope | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | 'all'>('all')
  const [selectedCollection] = useState<string>('all')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showCollectionDialog, setShowCollectionDialog] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null)
  const [showDocDetail, setShowDocDetail] = useState(false)

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((doc) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !doc.title.toLowerCase().includes(query) &&
          !doc.tags.some((t) => t.toLowerCase().includes(query))
        ) {
          return false
        }
      }
      if (selectedType !== 'all' && doc.type !== selectedType) return false
      if (selectedScope !== 'all' && doc.accessScope !== selectedScope) return false
      if (selectedStatus !== 'all' && doc.status !== selectedStatus) return false
      if (selectedCollection !== 'all' && doc.collectionId !== selectedCollection) return false
      return true
    })
  }, [searchQuery, selectedType, selectedScope, selectedStatus, selectedCollection])

  // Handlers
  const handleViewDocument = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc)
    setShowDocDetail(true)
  }

  const handleRetryIndex = (_docId: string) => {
    // Retry indexing
  }

  const handleDeleteDocument = (_docId: string) => {
    // Delete document
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ao-button.background)]">企业知识库管理</h2>
          <p className="text-muted-foreground">上传、处理和管理企业知识文档</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCollectionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建集合
          </Button>
          <Button size="sm" onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            上传文档
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--ao-button.background)]" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalDocuments}</p>
                <p className="text-sm text-muted-foreground">总文档数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalSegments}</p>
                <p className="text-sm text-muted-foreground">总片段数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalCollections}</p>
                <p className="text-sm text-muted-foreground">集合数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.processingCount}</p>
                <p className="text-sm text-muted-foreground">处理中</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.errorCount}</p>
                <p className="text-sm text-muted-foreground">错误</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">文档管理</TabsTrigger>
          <TabsTrigger value="collections">集合管理</TabsTrigger>
          <TabsTrigger value="analytics">统计分析</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文档..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="policy">策略</SelectItem>
                    <SelectItem value="procedure">流程</SelectItem>
                    <SelectItem value="guide">指南</SelectItem>
                    <SelectItem value="reference">参考</SelectItem>
                    <SelectItem value="template">模板</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedScope} onValueChange={(v) => setSelectedScope(v as AccessScope | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="访问范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部范围</SelectItem>
                    <SelectItem value="public">公开</SelectItem>
                    <SelectItem value="tenant">租户</SelectItem>
                    <SelectItem value="department">部门</SelectItem>
                    <SelectItem value="team">团队</SelectItem>
                    <SelectItem value="private">私有</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as DocumentStatus | 'all')}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="processing">处理中</SelectItem>
                    <SelectItem value="indexed">已索引</SelectItem>
                    <SelectItem value="error">错误</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Document List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={statusColors[doc.status]}>{doc.status}</Badge>
                          <Badge variant="outline">{doc.type}</Badge>
                          <div className="flex items-center gap-1">
                            {scopeIcons[doc.accessScope]}
                            <Badge className={scopeColors[doc.accessScope]}>
                              {doc.accessScope}
                            </Badge>
                          </div>
                          <span className="font-medium">{doc.title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            {doc.collectionName}
                          </span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>{doc.segments} 片段</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(doc.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryIndex(doc.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              下载
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {mockCollections.map((collection) => (
              <Card key={collection.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{collection.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {scopeIcons[collection.accessScope]}
                      <Badge className={scopeColors[collection.accessScope]}>
                        {collection.accessScope}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{collection.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">文档数</p>
                      <p className="font-medium">{collection.documentCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">片段数</p>
                      <p className="font-medium">{collection.totalSegments}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">类型</p>
                      <p className="font-medium">{collection.type}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>所有者: {collection.owner}</span>
                    <span>更新于 {formatTimeAgo(collection.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* By Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按类型分布</CardTitle>
                <CardDescription>各类型文档数量统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockStats.byType).map(([type, count]) => (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <Progress
                        value={(count / mockStats.totalDocuments) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按访问范围分布</CardTitle>
                <CardDescription>各访问范围文档数量统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockStats.byScope).map(([scope, count]) => (
                    <div key={scope} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {scopeIcons[scope as AccessScope]}
                          <span>{scope}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                      <Progress
                        value={(count / mockStats.totalDocuments) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">存储使用</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>已使用</span>
                      <span className="font-medium">{formatFileSize(mockStats.storageUsed)}</span>
                    </div>
                    <Progress value={(mockStats.storageUsed / (1024 * 1024 * 1024)) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      预算: 1 GB
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">平均文档大小</p>
                      <p className="font-medium">
                        {formatFileSize(mockStats.storageUsed / mockStats.totalDocuments)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">平均片段数</p>
                      <p className="font-medium">
                        {Math.round(mockStats.totalSegments / mockStats.totalDocuments)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">最近活动</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="flex-1">文档"公司安全策略手册"已更新</span>
                    <span className="text-muted-foreground">1天前</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="flex-1">新增文档"新人入职流程文档"</span>
                    <span className="text-muted-foreground">1小时前</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="flex-1">文档"产品技术参考手册"索引失败</span>
                    <span className="text-muted-foreground">1天前</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="flex-1">集合"技术文档"已更新</span>
                    <span className="text-muted-foreground">2天前</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>上传文档</DialogTitle>
            <DialogDescription>上传企业知识文档到知识库</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                拖拽文件到此处或点击上传
              </p>
              <p className="text-xs text-muted-foreground">
                支持 PDF, DOCX, TXT, MD 格式
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">目标集合</label>
              <Select defaultValue="col-001">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockCollections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">访问范围</label>
              <Select defaultValue="tenant">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">公开</SelectItem>
                  <SelectItem value="tenant">租户</SelectItem>
                  <SelectItem value="department">部门</SelectItem>
                  <SelectItem value="team">团队</SelectItem>
                  <SelectItem value="private">私有</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标签（逗号分隔）</label>
              <Input placeholder="输入标签..." />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collection Dialog */}
      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建集合</DialogTitle>
            <DialogDescription>创建新的知识文档集合</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">集合名称</label>
              <Input placeholder="输入集合名称..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input placeholder="输入集合描述..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <Select defaultValue="topic">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">部门</SelectItem>
                  <SelectItem value="project">项目</SelectItem>
                  <SelectItem value="topic">主题</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">访问范围</label>
              <Select defaultValue="tenant">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">公开</SelectItem>
                  <SelectItem value="tenant">租户</SelectItem>
                  <SelectItem value="department">部门</SelectItem>
                  <SelectItem value="team">团队</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={showDocDetail} onOpenChange={setShowDocDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>文档详情</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">标题</label>
                  <p className="font-medium">{selectedDoc.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <p>
                    <Badge className={statusColors[selectedDoc.status]}>{selectedDoc.status}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">类型</label>
                  <p>
                    <Badge variant="outline">{selectedDoc.type}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">访问范围</label>
                  <div className="flex items-center gap-1">
                    {scopeIcons[selectedDoc.accessScope]}
                    <Badge className={scopeColors[selectedDoc.accessScope]}>
                      {selectedDoc.accessScope}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">文件大小</label>
                  <p className="font-medium">{formatFileSize(selectedDoc.fileSize)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">片段数</label>
                  <p className="font-medium">{selectedDoc.segments}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">集合</label>
                  <p className="font-medium">{selectedDoc.collectionName}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">上传者</label>
                  <p className="font-medium">{selectedDoc.uploadedBy}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">标签</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedDoc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">上传时间</label>
                  <p>{new Date(selectedDoc.uploadedAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">更新时间</label>
                  <p>{new Date(selectedDoc.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
