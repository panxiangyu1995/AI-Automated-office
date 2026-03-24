import { useState, useMemo } from 'react'
import {
  BookOpen,
  Edit,
  Trash2,
  Merge,
  History,
  Search,
  Filter,
  Grid,
  List,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Tag,
  Calendar,
  RefreshCw,
  MoreVertical,
  Eye,
  Copy,
  Download,
  Upload,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
export type EntryStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived' | 'deleted'
export type EntryCategory = 'troubleshooting' | 'procedure' | 'policy' | 'guideline' | 'faq' | 'other'
export type AccessScope = 'public' | 'department' | 'team' | 'private'

export interface KnowledgeEntryItem {
  id: string
  title: string
  content: string
  category: EntryCategory
  status: EntryStatus
  accessScope: AccessScope
  tags: string[]
  department?: string
  author: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  viewCount: number
  helpfulCount: number
  version: number
  source?: string
  relatedEntries: { id: string; title: string }[]
}

export interface EntryAuditRecord {
  id: string
  entryId: string
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'published' | 'archived' | 'restored'
  performedBy: string
  performedAt: string
  changes?: { field: string; oldValue: string; newValue: string }[]
  comment?: string
}

export interface EntryMergeCandidate {
  id: string
  title: string
  similarity: number
  overlap: string[]
}

export interface KnowledgeEntryManagementProps {
  className?: string
}

// Category labels
const CATEGORY_LABELS: Record<EntryCategory, string> = {
  troubleshooting: '故障排除',
  procedure: '操作流程',
  policy: '政策制度',
  guideline: '操作指南',
  faq: '常见问题',
  other: '其他',
}

// Status config
const getStatusConfig = (status: EntryStatus) => {
  switch (status) {
    case 'draft':
      return { icon: Edit, color: 'text-purple-500', label: '草稿', variant: 'secondary' as const }
    case 'pending_review':
      return { icon: Clock, color: 'text-yellow-500', label: '待审核', variant: 'secondary' as const }
    case 'approved':
      return { icon: CheckCircle2, color: 'text-green-500', label: '已批准', variant: 'default' as const }
    case 'published':
      return { icon: BookOpen, color: 'text-blue-500', label: '已发布', variant: 'default' as const }
    case 'archived':
      return { icon: FileText, color: 'text-gray-500', label: '已归档', variant: 'outline' as const }
    case 'deleted':
      return { icon: Trash2, color: 'text-red-500', label: '已删除', variant: 'destructive' as const }
  }
}

// Access scope badge
const getAccessBadge = (scope: AccessScope) => {
  switch (scope) {
    case 'public':
      return { variant: 'default' as const, label: '公开', className: 'bg-green-500' }
    case 'department':
      return { variant: 'secondary' as const, label: '部门' }
    case 'team':
      return { variant: 'secondary' as const, label: '团队' }
    case 'private':
      return { variant: 'outline' as const, label: '私有' }
  }
}

// Mock entries
const createMockEntries = (): KnowledgeEntryItem[] => [
  {
    id: 'entry-001',
    title: '验证码失效问题处理流程',
    content: `## 问题描述
客户在使用手机号登录时，经常遇到验证码错误或无法收到验证码的问题。

## 原因分析
1. 短信网关存在超时问题
2. 验证码有效期过短
3. 短信发送高峰期队列积压

## 解决方案
1. 联系运营商优化网关性能
2. 将验证码有效期延长至10分钟
3. 增加短信发送队列监控`,
    category: 'troubleshooting',
    status: 'published',
    accessScope: 'public',
    tags: ['登录问题', '验证码', '短信网关'],
    author: '张三',
    createdAt: '2026-03-23T12:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
    publishedAt: '2026-03-24T10:00:00Z',
    viewCount: 156,
    helpfulCount: 42,
    version: 2,
    source: '工单#1234',
    relatedEntries: [
      { id: 'entry-002', title: '系统登录异常排查' },
    ],
  },
  {
    id: 'entry-002',
    title: '系统登录异常排查',
    content: `## 登录异常类型
1. 账号密码错误
2. 验证码获取失败
3. 账户被锁定
4. 权限不足

## 排查步骤
1. 确认账户状态
2. 检查网络连接
3. 清除浏览器缓存
4. 联系技术支持`,
    category: 'troubleshooting',
    status: 'published',
    accessScope: 'public',
    tags: ['登录', '异常', '排查'],
    author: '李四',
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-03-20T09:00:00Z',
    publishedAt: '2026-03-20T09:00:00Z',
    viewCount: 234,
    helpfulCount: 67,
    version: 1,
    relatedEntries: [],
  },
  {
    id: 'entry-003',
    title: '采购审批流程优化指南',
    content: `## 背景
为提高采购效率，对现有审批流程进行优化。

## 优化方案
### 重要物品（>10000元）
部门主管 → 财务审核 → 分管副总

### 普通物品（≤10000元）
部门主管 → 部门经理 → 财务审核`,
    category: 'procedure',
    status: 'approved',
    accessScope: 'department',
    tags: ['采购', '审批流程', '效率优化'],
    department: '行政部',
    author: '王五',
    createdAt: '2026-03-22T16:30:00Z',
    updatedAt: '2026-03-23T14:00:00Z',
    viewCount: 45,
    helpfulCount: 12,
    version: 1,
    relatedEntries: [],
  },
  {
    id: 'entry-004',
    title: '新员工入职培训安排',
    content: `## 培训目的
帮助新员工快速了解公司文化、熟悉工作环境。

## 培训内容
1. 公司文化（1小时）
2. 系统使用（2小时）
3. 安全规范（1小时）

## 培训安排
每周五下午14:00-17:00`,
    category: 'procedure',
    status: 'pending_review',
    accessScope: 'department',
    tags: ['入职培训', '新员工'],
    department: '人力资源部',
    author: '赵六',
    createdAt: '2026-03-24T11:00:00Z',
    updatedAt: '2026-03-24T11:00:00Z',
    viewCount: 0,
    helpfulCount: 0,
    version: 1,
    relatedEntries: [],
  },
  {
    id: 'entry-005',
    title: '财务报销制度V2.0',
    content: `## 报销基本要求
1. 必须为正规增值税发票
2. 发票日期须在90天内
3. 必须加盖发票专用章

## 报销流程
1. 部门主管审批
2. 财务审核
3. 出纳付款`,
    category: 'policy',
    status: 'published',
    accessScope: 'public',
    tags: ['财务', '报销', '制度'],
    author: '孙七',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-18T15:00:00Z',
    publishedAt: '2026-03-18T15:00:00Z',
    viewCount: 312,
    helpfulCount: 89,
    version: 2,
    relatedEntries: [],
  },
  {
    id: 'entry-006',
    title: '如何申请年假？',
    content: `## 年假申请流程
1. 登录OA系统
2. 进入"人事服务" -> "假勤申请"
3. 选择"年假申请"类型
4. 填写休假日期
5. 提交审批

## 年假天数
- 司龄1-3年：5天
- 司龄3-5年：10天
- 司龄5-10年：15天`,
    category: 'faq',
    status: 'published',
    accessScope: 'public',
    tags: ['年假', '请假', '人事'],
    author: '周八',
    createdAt: '2026-03-10T14:00:00Z',
    updatedAt: '2026-03-12T09:00:00Z',
    publishedAt: '2026-03-12T09:00:00Z',
    viewCount: 567,
    helpfulCount: 234,
    version: 3,
    relatedEntries: [],
  },
]

// Mock audit records
const MOCK_AUDIT_RECORDS: EntryAuditRecord[] = [
  { id: 'audit-001', entryId: 'entry-001', action: 'published', performedBy: '张三', performedAt: '2026-03-24T10:00:00Z' },
  { id: 'audit-002', entryId: 'entry-001', action: 'updated', performedBy: '张三', performedAt: '2026-03-23T16:00:00Z', changes: [{ field: 'content', oldValue: '...', newValue: '...' }] },
  { id: 'audit-003', entryId: 'entry-001', action: 'approved', performedBy: '李四', performedAt: '2026-03-23T15:00:00Z' },
  { id: 'audit-004', entryId: 'entry-001', action: 'created', performedBy: '张三', performedAt: '2026-03-23T12:00:00Z' },
]

// Mock merge candidates
const MOCK_MERGE_CANDIDATES: EntryMergeCandidate[] = [
  { id: 'entry-001', title: '验证码失效问题处理流程', similarity: 0.85, overlap: ['验证码问题', '短信网关'] },
  { id: 'entry-002', title: '系统登录异常排查', similarity: 0.72, overlap: ['登录问题', '验证码'] },
]

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

export function KnowledgeEntryManagement({ className = '' }: KnowledgeEntryManagementProps) {
  const [entries] = useState<KnowledgeEntryItem[]>(createMockEntries)
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<EntryCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<EntryStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Stats
  const stats = useMemo(() => ({
    total: entries.filter(e => e.status !== 'deleted').length,
    published: entries.filter(e => e.status === 'published').length,
    pending: entries.filter(e => e.status === 'pending_review').length,
    draft: entries.filter(e => e.status === 'draft').length,
    archived: entries.filter(e => e.status === 'archived').length,
  }), [entries])

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (entry.status === 'deleted') return false
      if (searchQuery && !entry.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (categoryFilter !== 'all' && entry.category !== categoryFilter) return false
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false
      return true
    })
  }, [entries, searchQuery, categoryFilter, statusFilter])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            知识条目管理
          </h2>
          <p className="text-muted-foreground">
            统一管理知识库条目，支持编辑、合并、归档和生命周期管理
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            导入
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-1" />
            新建条目
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">总条目</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.published}</div>
                <div className="text-xs text-muted-foreground">已发布</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">待审核</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.draft}</div>
                <div className="text-xs text-muted-foreground">草稿</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{stats.archived}</div>
                <div className="text-xs text-muted-foreground">已归档</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索知识条目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="border rounded px-2 py-1 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as EntryCategory | 'all')}
              >
                <option value="all">全部分类</option>
                <option value="troubleshooting">故障排除</option>
                <option value="procedure">操作流程</option>
                <option value="policy">政策制度</option>
                <option value="guideline">操作指南</option>
                <option value="faq">常见问题</option>
                <option value="other">其他</option>
              </select>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EntryStatus | 'all')}
              >
                <option value="all">全部状态</option>
                <option value="published">已发布</option>
                <option value="approved">已批准</option>
                <option value="pending_review">待审核</option>
                <option value="draft">草稿</option>
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
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="published">已发布</TabsTrigger>
          <TabsTrigger value="pending">待审核</TabsTrigger>
          <TabsTrigger value="draft">草稿</TabsTrigger>
          <TabsTrigger value="merge">合并建议</TabsTrigger>
          <TabsTrigger value="audit">审计日志</TabsTrigger>
        </TabsList>

        {/* All Entries */}
        <TabsContent value="all">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无知识条目</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map(entry => {
                const statusConfig = getStatusConfig(entry.status)
                const StatusIcon = statusConfig.icon
                return (
                  <Card
                    key={entry.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedEntry?.id === entry.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{entry.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                {CATEGORY_LABELS[entry.category]}
                              </Badge>
                              <Badge {...getAccessBadge(entry.accessScope)} className="text-xs">
                                {getAccessBadge(entry.accessScope).label}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {entry.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatTimeAgo(entry.updatedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {entry.viewCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {entry.helpfulCount}
                              </span>
                              <span>v{entry.version}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Published */}
        <TabsContent value="published">
          <div className="space-y-3">
            {filteredEntries.filter(e => e.status === 'published').map(entry => (
              <Card key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEntry(entry)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.viewCount} 次浏览 | {entry.helpfulCount} 次有帮助
                        </div>
                      </div>
                    </div>
                    <Badge {...getAccessBadge(entry.accessScope)} className="text-xs">
                      {getAccessBadge(entry.accessScope).label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pending */}
        <TabsContent value="pending">
          <div className="space-y-3">
            {filteredEntries.filter(e => e.status === 'pending_review' || e.status === 'approved').map(entry => (
              <Card key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEntry(entry)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-xs text-muted-foreground">
                          等待 {entry.author} 的审核
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">
                        <XCircle className="h-4 w-4 mr-1" />
                        拒绝
                      </Button>
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        批准
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Draft */}
        <TabsContent value="draft">
          <div className="space-y-3">
            {filteredEntries.filter(e => e.status === 'draft').map(entry => (
              <Card key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEntry(entry)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Edit className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-xs text-muted-foreground">
                          上次编辑 {formatTimeAgo(entry.updatedAt)}
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-1" />
                      提交审核
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Merge Suggestions */}
        <TabsContent value="merge">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Merge className="h-4 w-4" />
                合并建议
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                系统检测到以下条目可能存在重复，建议合并以提高知识库质量
              </p>
              <div className="space-y-3">
                {MOCK_MERGE_CANDIDATES.map(candidate => (
                  <div key={candidate.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">{candidate.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        相似度: {(candidate.similarity * 100).toFixed(0)}% | 重叠标签: {candidate.overlap.join(', ')}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Merge className="h-4 w-4 mr-1" />
                      合并
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <History className="h-4 w-4" />
                审计日志
              </h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {MOCK_AUDIT_RECORDS.map(record => (
                    <div key={record.id} className="flex items-start gap-3 pb-3 border-b">
                      <div className={`mt-1 ${
                        record.action === 'approved' ? 'text-green-500' :
                        record.action === 'rejected' ? 'text-red-500' :
                        record.action === 'published' ? 'text-blue-500' :
                        'text-muted-foreground'
                      }`}>
                        {record.action === 'created' && <FileText className="h-4 w-4" />}
                        {record.action === 'updated' && <Edit className="h-4 w-4" />}
                        {record.action === 'approved' && <CheckCircle2 className="h-4 w-4" />}
                        {record.action === 'rejected' && <XCircle className="h-4 w-4" />}
                        {record.action === 'published' && <BookOpen className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{record.performedBy}</span>
                          <Badge variant="secondary" className="text-xs">
                            {record.action === 'created' ? '创建' :
                             record.action === 'updated' ? '更新' :
                             record.action === 'approved' ? '批准' :
                             record.action === 'rejected' ? '拒绝' :
                             record.action === 'published' ? '发布' : record.action}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(record.performedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Entry Detail Panel */}
      {selectedEntry && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                条目详情
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(null)}>
                关闭
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">基本信息</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">标题</span>
                      <span className="font-medium">{selectedEntry.title}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">分类</span>
                      <Badge variant="secondary">{CATEGORY_LABELS[selectedEntry.category]}</Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">状态</span>
                      <Badge {...getStatusConfig(selectedEntry.status)}>
                        {getStatusConfig(selectedEntry.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">访问范围</span>
                      <Badge {...getAccessBadge(selectedEntry.accessScope)}>
                        {getAccessBadge(selectedEntry.accessScope).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">统计信息</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <div className="text-2xl font-bold">{selectedEntry.viewCount}</div>
                      <div className="text-xs text-muted-foreground">浏览</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <div className="text-2xl font-bold">{selectedEntry.helpfulCount}</div>
                      <div className="text-xs text-muted-foreground">有帮助</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <div className="text-2xl font-bold">v{selectedEntry.version}</div>
                      <div className="text-xs text-muted-foreground">版本</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">标签</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedEntry.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">内容预览</div>
                  <ScrollArea className="h-[200px]">
                    <div className="text-sm whitespace-pre-wrap p-3 bg-muted/50 rounded">
                      {selectedEntry.content}
                    </div>
                  </ScrollArea>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">元信息</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>作者: {selectedEntry.author}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>创建: {new Date(selectedEntry.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4" />
                      <span>更新: {new Date(selectedEntry.updatedAt).toLocaleString()}</span>
                    </div>
                    {selectedEntry.source && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>来源: {selectedEntry.source}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-1" />
                    复制
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Merge className="h-4 w-4 mr-1" />
                    合并
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
