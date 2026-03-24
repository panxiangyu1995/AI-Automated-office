import { useState, useMemo } from 'react'
import {
  FileText,
  Upload,
  FolderOpen,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  Search,
  Filter,
  Grid,
  List,
  Archive,
  Trash,
  Eye,
  Link2,
  BarChart3,
  Tag,
  HardDrive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// Types
export type DocStatus = 'uploading' | 'parsing' | 'indexing' | 'ready' | 'error' | 'archived' | 'deleted'
export type DocCategory = 'manual' | 'policy' | 'contract' | 'report' | 'guideline' | 'other'
export type ViewMode = 'grid' | 'list'

export interface KnowledgeDocument {
  id: string
  name: string
  category: DocCategory
  status: DocStatus
  size: number // bytes
  mimeType: string
  uploadTime: string
  updateTime: string
  parsedAt?: string
  indexedAt?: string
  parseProgress?: number
  indexProgress?: number
  pageCount?: number
  chunkCount?: number
  error?: string
  tags: string[]
  description?: string
  source?: string
  version: number
}

export interface UploadTask {
  id: string
  fileName: string
  fileSize: number
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface KnowledgeStats {
  totalDocs: number
  totalSize: number
  readyDocs: number
  parsingDocs: number
  errorDocs: number
  categoriesCount: number
  avgParseTime: number
}

export interface KnowledgeDocUploadProps {
  className?: string
}

// Category labels
const CATEGORY_LABELS: Record<DocCategory, string> = {
  manual: '使用手册',
  policy: '政策文件',
  contract: '合同协议',
  report: '分析报告',
  guideline: '操作指南',
  other: '其他',
}

// Status config
const getStatusConfig = (status: DocStatus) => {
  switch (status) {
    case 'uploading':
      return { icon: Upload, color: 'text-blue-500', label: '上传中', variant: 'secondary' as const }
    case 'parsing':
      return { icon: Loader2, color: 'text-yellow-500', label: '解析中', variant: 'secondary' as const, animate: true }
    case 'indexing':
      return { icon: Loader2, color: 'text-purple-500', label: '索引中', variant: 'secondary' as const, animate: true }
    case 'ready':
      return { icon: CheckCircle2, color: 'text-green-500', label: '就绪', variant: 'default' as const }
    case 'error':
      return { icon: AlertCircle, color: 'text-red-500', label: '错误', variant: 'destructive' as const }
    case 'archived':
      return { icon: Archive, color: 'text-gray-500', label: '已归档', variant: 'outline' as const }
    case 'deleted':
      return { icon: Trash, color: 'text-gray-400', label: '已删除', variant: 'outline' as const }
  }
}

// Mock documents
const createMockDocuments = (): KnowledgeDocument[] => [
  {
    id: 'doc-001',
    name: '员工手册2026.pdf',
    category: 'manual',
    status: 'ready',
    size: 2457600,
    mimeType: 'application/pdf',
    uploadTime: '2026-03-20T10:30:00Z',
    updateTime: '2026-03-20T10:35:00Z',
    parsedAt: '2026-03-20T10:34:00Z',
    indexedAt: '2026-03-20T10:35:00Z',
    pageCount: 45,
    chunkCount: 128,
    tags: ['人力资源', '员工', '手册'],
    description: '2026年最新版员工手册',
    source: 'HR部门',
    version: 3,
  },
  {
    id: 'doc-002',
    name: '财务报销制度.docx',
    category: 'policy',
    status: 'ready',
    size: 524288,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadTime: '2026-03-19T14:20:00Z',
    updateTime: '2026-03-19T14:25:00Z',
    parsedAt: '2026-03-19T14:24:00Z',
    indexedAt: '2026-03-19T14:25:00Z',
    pageCount: 12,
    chunkCount: 45,
    tags: ['财务', '报销', '制度'],
    description: '财务报销管理制度v2.0',
    source: '财务部',
    version: 2,
  },
  {
    id: 'doc-003',
    name: '采购合同模板.pdf',
    category: 'contract',
    status: 'parsing',
    size: 1048576,
    mimeType: 'application/pdf',
    uploadTime: '2026-03-24T09:15:00Z',
    updateTime: '2026-03-24T09:15:00Z',
    parseProgress: 65,
    tags: ['合同', '采购', '模板'],
    description: '标准采购合同模板',
    version: 1,
  },
  {
    id: 'doc-004',
    name: 'Q1销售分析报告.xlsx',
    category: 'report',
    status: 'indexing',
    size: 786432,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadTime: '2026-03-24T08:00:00Z',
    updateTime: '2026-03-24T08:05:00Z',
    parseProgress: 100,
    indexProgress: 40,
    tags: ['销售', '分析', 'Q1'],
    description: '2026年第一季度销售分析报告',
    source: '销售部',
    version: 1,
  },
  {
    id: 'doc-005',
    name: '服务器操作指南.md',
    category: 'guideline',
    status: 'error',
    size: 32768,
    mimeType: 'text/markdown',
    uploadTime: '2026-03-18T16:30:00Z',
    updateTime: '2026-03-18T16:35:00Z',
    error: '解析失败：不支持的文件格式',
    tags: ['IT', '服务器', '操作指南'],
    description: '服务器运维操作指南',
    version: 1,
  },
  {
    id: 'doc-006',
    name: '会议室使用规定.pdf',
    category: 'policy',
    status: 'ready',
    size: 204800,
    mimeType: 'application/pdf',
    uploadTime: '2026-03-15T11:00:00Z',
    updateTime: '2026-03-15T11:10:00Z',
    parsedAt: '2026-03-15T11:09:00Z',
    indexedAt: '2026-03-15T11:10:00Z',
    pageCount: 5,
    chunkCount: 18,
    tags: ['行政', '会议室', '规定'],
    version: 1,
  },
  {
    id: 'doc-007',
    name: '产品培训资料.pptx',
    category: 'manual',
    status: 'uploading',
    size: 5242880,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    uploadTime: '2026-03-24T10:40:00Z',
    updateTime: '2026-03-24T10:40:00Z',
    parseProgress: 0,
    tags: ['产品', '培训'],
    version: 1,
  },
]

// Format file size
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Format time ago
const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

export function KnowledgeDocUpload({ className = '' }: KnowledgeDocUploadProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(createMockDocuments())
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter] = useState<DocCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'all'>('all')
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null)
  const [uploadTasks] = useState<UploadTask[]>([])

  // Stats
  const stats = useMemo((): KnowledgeStats => {
    const total = documents.filter(d => d.status !== 'deleted')
    const totalSize = total.reduce((sum, d) => sum + d.size, 0)
    const ready = documents.filter(d => d.status === 'ready').length
    const parsing = documents.filter(d => d.status === 'parsing' || d.status === 'indexing').length
    const errors = documents.filter(d => d.status === 'error').length
    const categories = new Set(documents.filter(d => d.status !== 'deleted').map(d => d.category)).size
    return {
      totalDocs: total.length,
      totalSize,
      readyDocs: ready,
      parsingDocs: parsing,
      errorDocs: errors,
      categoriesCount: categories,
      avgParseTime: 45, // mock
    }
  }, [documents])

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (doc.status === 'deleted') return false
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false
      return true
    })
  }, [documents, searchQuery, categoryFilter, statusFilter])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    documents.filter(d => d.status !== 'deleted').forEach(doc => {
      counts[doc.category] = (counts[doc.category] || 0) + 1
    })
    return counts
  }, [documents])

  // Handle delete
  const handleDelete = (docId: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === docId ? { ...d, status: 'deleted' as DocStatus, updateTime: new Date().toISOString() } : d
    ))
  }

  // Handle archive
  const handleArchive = (docId: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === docId ? { ...d, status: 'archived' as DocStatus, updateTime: new Date().toISOString() } : d
    ))
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            知识文档管理
          </h2>
          <p className="text-muted-foreground">
            上传、组织和管理企业知识文档，支持全文检索和智能问答
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-1" />
          上传文档
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalDocs}</div>
                <div className="text-xs text-muted-foreground">文档总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{formatSize(stats.totalSize)}</div>
                <div className="text-xs text-muted-foreground">总大小</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.readyDocs}</div>
                <div className="text-xs text-muted-foreground">已就绪</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.parsingDocs}</div>
                <div className="text-xs text-muted-foreground">处理中</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.errorDocs}</div>
                <div className="text-xs text-muted-foreground">错误</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.categoriesCount}</div>
                <div className="text-xs text-muted-foreground">分类</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgParseTime}秒</div>
                <div className="text-xs text-muted-foreground">平均解析</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Tasks */}
      {uploadTasks.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              上传任务
            </h3>
            <div className="space-y-2">
              {uploadTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{task.fileName}</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">全部文档</TabsTrigger>
          <TabsTrigger value="manual">
            {CATEGORY_LABELS.manual}
            {categoryCounts.manual && <Badge variant="secondary" className="ml-1">{categoryCounts.manual}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="policy">
            {CATEGORY_LABELS.policy}
            {categoryCounts.policy && <Badge variant="secondary" className="ml-1">{categoryCounts.policy}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="contract">
            {CATEGORY_LABELS.contract}
            {categoryCounts.contract && <Badge variant="secondary" className="ml-1">{categoryCounts.contract}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="report">
            {CATEGORY_LABELS.report}
            {categoryCounts.report && <Badge variant="secondary" className="ml-1">{categoryCounts.report}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="guideline">
            {CATEGORY_LABELS.guideline}
            {categoryCounts.guideline && <Badge variant="secondary" className="ml-1">{categoryCounts.guideline}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="border rounded px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DocStatus | 'all')}
            >
              <option value="all">全部状态</option>
              <option value="ready">就绪</option>
              <option value="parsing">解析中</option>
              <option value="indexing">索引中</option>
              <option value="error">错误</option>
              <option value="archived">已归档</option>
            </select>
          </div>
          <div className="flex items-center gap-1 border rounded p-1">
            <button
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-muted' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-muted' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Documents Grid/List */}
        <TabsContent value="all">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无文档，点击上传按钮添加</p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredDocuments.map(doc => {
                const statusConfig = getStatusConfig(doc.status)
                const StatusIcon = statusConfig.icon
                return (
                  <Card
                    key={doc.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedDoc?.id === doc.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-1">
                          <StatusIcon className={`h-4 w-4 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-sm truncate" title={doc.name}>
                          {doc.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORY_LABELS[doc.category]}
                          </Badge>
                          <span>{formatSize(doc.size)}</span>
                        </div>
                        {doc.status === 'parsing' && doc.parseProgress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">解析进度</span>
                              <span>{doc.parseProgress}%</span>
                            </div>
                            <Progress value={doc.parseProgress} />
                          </div>
                        )}
                        {doc.status === 'indexing' && doc.indexProgress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">索引进度</span>
                              <span>{doc.indexProgress}%</span>
                            </div>
                            <Progress value={doc.indexProgress} />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(doc.uploadTime)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredDocuments.map(doc => {
                    const statusConfig = getStatusConfig(doc.status)
                    const StatusIcon = statusConfig.icon
                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 ${
                          selectedDoc?.id === doc.id ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{doc.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {CATEGORY_LABELS[doc.category]}
                            </Badge>
                            <Badge {...statusConfig} className="text-xs">
                              <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{formatSize(doc.size)}</span>
                            {doc.pageCount && <span>{doc.pageCount}页</span>}
                            {doc.chunkCount && <span>{doc.chunkCount}块</span>}
                            <span>上传于 {formatTimeAgo(doc.uploadTime)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleArchive(doc.id); }}>
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Category tabs - simplified for brevity, same content as "all" */}
        {(['manual', 'policy', 'contract', 'report', 'guideline'] as DocCategory[]).map(cat => (
          <TabsContent key={cat} value={cat}>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredDocuments.filter(d => d.category === cat).map(doc => {
                const statusConfig = getStatusConfig(doc.status)
                const StatusIcon = statusConfig.icon
                return (
                  <Card
                    key={doc.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedDoc?.id === doc.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-sm truncate" title={doc.name}>
                          {doc.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORY_LABELS[doc.category]}
                          </Badge>
                          <span>{formatSize(doc.size)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(doc.uploadTime)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Document Detail Panel */}
      {selectedDoc && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                文档详情
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
                关闭
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">基本信息</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">文件名</span>
                      <span className="font-medium truncate max-w-[200px]" title={selectedDoc.name}>
                        {selectedDoc.name}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">分类</span>
                      <Badge variant="secondary">{CATEGORY_LABELS[selectedDoc.category]}</Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">状态</span>
                      <Badge {...getStatusConfig(selectedDoc.status)}>
                        {getStatusConfig(selectedDoc.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">大小</span>
                      <span>{formatSize(selectedDoc.size)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">版本</span>
                      <span>v{selectedDoc.version}</span>
                    </div>
                  </div>
                </div>

                {selectedDoc.description && (
                  <div>
                    <div className="text-sm font-medium mb-2">描述</div>
                    <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                      {selectedDoc.description}
                    </p>
                  </div>
                )}

                {selectedDoc.tags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">标签</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedDoc.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">时间信息</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">上传时间</span>
                      <span className="ml-auto">{new Date(selectedDoc.uploadTime).toLocaleString()}</span>
                    </div>
                    {selectedDoc.parsedAt && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">解析完成</span>
                        <span className="ml-auto">{new Date(selectedDoc.parsedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedDoc.indexedAt && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Link2 className="h-4 w-4 text-blue-500" />
                        <span className="text-muted-foreground">索引完成</span>
                        <span className="ml-auto">{new Date(selectedDoc.indexedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedDoc.pageCount || selectedDoc.chunkCount) && (
                  <div>
                    <div className="text-sm font-medium mb-2">统计信息</div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDoc.pageCount && (
                        <div className="p-3 bg-muted/50 rounded text-center">
                          <div className="text-2xl font-bold">{selectedDoc.pageCount}</div>
                          <div className="text-xs text-muted-foreground">页数</div>
                        </div>
                      )}
                      {selectedDoc.chunkCount && (
                        <div className="p-3 bg-muted/50 rounded text-center">
                          <div className="text-2xl font-bold">{selectedDoc.chunkCount}</div>
                          <div className="text-xs text-muted-foreground">块数</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedDoc.error && (
                  <div>
                    <div className="text-sm font-medium mb-2 text-red-500">错误信息</div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                      {selectedDoc.error}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    预览
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleArchive(selectedDoc.id)}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    归档
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleDelete(selectedDoc.id)
                      setSelectedDoc(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
