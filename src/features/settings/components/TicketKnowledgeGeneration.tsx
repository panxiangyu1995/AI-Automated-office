import { useState, useMemo } from 'react'
import {
  Ticket,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Eye,
  Edit,
  Lightbulb,
  User,
  RefreshCw,
  Brain,
  Zap,
  BookOpen,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// Types
export type GenerationStatus = 'captured' | 'generating' | 'draft' | 'reviewing' | 'approved' | 'published' | 'rejected'
export type WorkflowSource = 'ticket' | 'chat' | 'email' | 'meeting' | 'document'
export type EntryQuality = 'high' | 'medium' | 'low'

export interface SourceTicket {
  id: string
  title: string
  content: string
  resolution?: string
  department: string
  createdAt: string
  resolvedAt?: string
}

export interface DraftEntry {
  id: string
  title: string
  content: string
  sourceTicket: SourceTicket
  sourceType: WorkflowSource
  quality: EntryQuality
  confidenceScore: number
  status: GenerationStatus
  createdAt: string
  updatedAt: string
  suggestedTags: string[]
  suggestedCategory: string
  relatedDocs: { id: string; name: string }[]
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface GenerationTask {
  id: string
  sourceTicket: SourceTicket
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface KnowledgeGenerationStats {
  totalCaptured: number
  pendingGeneration: number
  draftsInReview: number
  approvedToday: number
  publishedTotal: number
  avgGenerationTime: number
  qualityDistribution: { high: number; medium: number; low: number }
}

export interface TicketKnowledgeGenerationProps {
  className?: string
}

// Mock source tickets
const MOCK_SOURCE_TICKETS: SourceTicket[] = [
  {
    id: 'ticket-001',
    title: '客户账户无法登录',
    content: '客户反馈使用手机号无法登录系统，提示验证码错误。',
    resolution: '经排查是短信网关超时导致验证码失效，已联系运营商解决，后续增加验证码有效期到10分钟。',
    department: '客服部',
    createdAt: '2026-03-23T10:00:00Z',
    resolvedAt: '2026-03-23T11:30:00Z',
  },
  {
    id: 'ticket-002',
    title: '采购审批流程优化',
    content: '建议简化采购审批流程，当前需要5级审批导致效率低下。',
    resolution: '经评估已将5级优化为3级，重要物品保留3级，普通物品2级。',
    department: '行政部',
    createdAt: '2026-03-22T14:00:00Z',
    resolvedAt: '2026-03-22T16:00:00Z',
  },
  {
    id: 'ticket-003',
    title: '财务报表数据异常',
    content: '3月份财务报表中成本数据与实际差异较大。',
    resolution: '发现是ERP系统数据同步延迟导致，已修复同步机制并手动校正数据。',
    department: '财务部',
    createdAt: '2026-03-21T09:00:00Z',
    resolvedAt: '2026-03-21T10:00:00Z',
  },
  {
    id: 'ticket-004',
    title: '员工培训需求调研',
    content: 'IT部门希望开展新员工入职培训。',
    resolution: '已安排每周五下午进行新员工入职培训，内容涵盖公司文化、系统使用、安全规范。',
    department: '人力资源部',
    createdAt: '2026-03-20T11:00:00Z',
    resolvedAt: '2026-03-20T15:00:00Z',
  },
]

// Mock draft entries
const createMockDraftEntries = (): DraftEntry[] => [
  {
    id: 'draft-001',
    title: '验证码失效问题处理流程',
    content: `## 问题描述
客户在使用手机号登录时，经常遇到验证码错误或无法收到验证码的问题。

## 原因分析
1. 短信网关存在超时问题
2. 验证码有效期过短（默认2分钟）
3. 短信发送高峰期队列积压

## 解决方案
1. 联系运营商优化网关性能
2. 将验证码有效期延长至10分钟
3. 增加短信发送队列监控

## 预防措施
- 定期巡检短信网关状态
- 设置验证码有效期告警`,
    sourceTicket: MOCK_SOURCE_TICKETS[0],
    sourceType: 'ticket',
    quality: 'high',
    confidenceScore: 0.92,
    status: 'reviewing',
    createdAt: '2026-03-23T12:00:00Z',
    updatedAt: '2026-03-23T14:00:00Z',
    suggestedTags: ['登录问题', '验证码', '短信网关'],
    suggestedCategory: 'IT运维',
    relatedDocs: [
      { id: 'doc-005', name: '服务器操作指南.md' },
    ],
    reviewNotes: '内容完整，建议补充短信服务商SLA信息',
  },
  {
    id: 'draft-002',
    title: '采购审批流程优化指南',
    content: `## 背景
为提高采购效率，对现有审批流程进行优化。

## 优化方案
### 调整前（5级审批）
1. 部门主管
2. 部门经理
3. 财务审核
4. 分管副总
5. 总经理

### 调整后（3级审批）
- 重要物品（>10000元）：部门主管 → 财务审核 → 分管副总
- 普通物品（≤10000元）：部门主管 → 部门经理 → 财务审核

## 实施时间
2026年3月25日起正式执行`,
    sourceTicket: MOCK_SOURCE_TICKETS[1],
    sourceType: 'ticket',
    quality: 'medium',
    confidenceScore: 0.78,
    status: 'draft',
    createdAt: '2026-03-22T16:30:00Z',
    updatedAt: '2026-03-22T16:30:00Z',
    suggestedTags: ['采购', '审批流程', '效率优化'],
    suggestedCategory: '行政管理',
    relatedDocs: [],
  },
  {
    id: 'draft-003',
    title: 'ERP数据同步异常处理',
    content: `## 问题现象
财务报表中成本数据与实际业务数据存在较大差异。

## 问题原因
ERP系统与财务系统之间的数据同步存在延迟机制，在高峰期可能出现30分钟以上延迟。

## 排查过程
1. 检查同步日志发现队列积压
2. 分析发现同步任务未设置超时重试
3. 验证网络连接稳定性

## 修复措施
1. 增加同步任务超时重试机制（3次，间隔5分钟）
2. 优化数据同步批次大小
3. 增加同步状态监控告警

## 数据校正
手动执行增量同步，并校正差异期间数据。`,
    sourceTicket: MOCK_SOURCE_TICKETS[2],
    sourceType: 'ticket',
    quality: 'high',
    confidenceScore: 0.88,
    status: 'approved',
    createdAt: '2026-03-21T11:00:00Z',
    updatedAt: '2026-03-21T12:00:00Z',
    suggestedTags: ['ERP', '数据同步', '财务系统'],
    suggestedCategory: 'IT运维',
    relatedDocs: [],
    reviewedBy: '张三',
    reviewedAt: '2026-03-21T15:00:00Z',
  },
  {
    id: 'draft-004',
    title: '新员工入职培训安排',
    content: `## 培训目的
帮助新员工快速了解公司文化、熟悉工作环境、掌握基本技能。

## 培训对象
入职时间在3个月以内的新员工。

## 培训内容
1. **公司文化**（1小时）
   - 企业愿景与价值观
   - 组织架构与部门职责
   - 员工行为规范

2. **系统使用**（2小时）
   - OA系统操作
   - 邮件与即时通讯
   - 常用办公工具

3. **安全规范**（1小时）
   - 信息安全基础
   - 物理安全
   - 应急响应流程

## 培训安排
- 时间：每周五下午14:00-17:00
- 地点：总部培训室
- 讲师：人力资源部培训专员`,
    sourceTicket: MOCK_SOURCE_TICKETS[3],
    sourceType: 'ticket',
    quality: 'low',
    confidenceScore: 0.55,
    status: 'rejected',
    createdAt: '2026-03-20T16:00:00Z',
    updatedAt: '2026-03-20T16:00:00Z',
    suggestedTags: ['入职培训', '新员工', '培训安排'],
    suggestedCategory: '人力资源',
    relatedDocs: [],
    reviewNotes: '内容不够专业，建议由培训部重新起草',
  },
]

// Status config
const getStatusConfig = (status: GenerationStatus) => {
  switch (status) {
    case 'captured':
      return { icon: Lightbulb, color: 'text-yellow-500', label: '已捕获', variant: 'secondary' as const }
    case 'generating':
      return { icon: Loader2, color: 'text-blue-500', label: '生成中', variant: 'secondary' as const, animate: true }
    case 'draft':
      return { icon: Edit, color: 'text-purple-500', label: '草稿', variant: 'secondary' as const }
    case 'reviewing':
      return { icon: Eye, color: 'text-orange-500', label: '审核中', variant: 'secondary' as const }
    case 'approved':
      return { icon: CheckCircle2, color: 'text-green-500', label: '已批准', variant: 'default' as const }
    case 'published':
      return { icon: BookOpen, color: 'text-green-600', label: '已发布', variant: 'default' as const }
    case 'rejected':
      return { icon: XCircle, color: 'text-red-500', label: '已拒绝', variant: 'destructive' as const }
  }
}

// Quality badge
const getQualityBadge = (quality: EntryQuality) => {
  switch (quality) {
    case 'high':
      return { variant: 'default' as const, label: '高质量', className: 'bg-green-500' }
    case 'medium':
      return { variant: 'secondary' as const, label: '中等质量' }
    case 'low':
      return { variant: 'destructive' as const, label: '低质量' }
  }
}

// Source type badge
const getSourceBadge = (source: WorkflowSource) => {
  switch (source) {
    case 'ticket':
      return { variant: 'outline' as const, label: '工单' }
    case 'chat':
      return { variant: 'outline' as const, label: '会话' }
    case 'email':
      return { variant: 'outline' as const, label: '邮件' }
    case 'meeting':
      return { variant: 'outline' as const, label: '会议' }
    case 'document':
      return { variant: 'outline' as const, label: '文档' }
  }
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

export function TicketKnowledgeGeneration({ className = '' }: TicketKnowledgeGenerationProps) {
  const [draftEntries] = useState<DraftEntry[]>(createMockDraftEntries)
  const [selectedEntry, setSelectedEntry] = useState<DraftEntry | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Stats
  const stats = useMemo((): KnowledgeGenerationStats => {
    const total = draftEntries.length
    const pending = draftEntries.filter(e => e.status === 'captured' || e.status === 'generating').length
    const drafts = draftEntries.filter(e => e.status === 'draft' || e.status === 'reviewing').length
    const approved = draftEntries.filter(e => e.status === 'approved' || e.status === 'published').length
    const qualityDist = {
      high: draftEntries.filter(e => e.quality === 'high').length,
      medium: draftEntries.filter(e => e.quality === 'medium').length,
      low: draftEntries.filter(e => e.quality === 'low').length,
    }
    return {
      totalCaptured: total + 12,
      pendingGeneration: pending,
      draftsInReview: drafts,
      approvedToday: approved,
      publishedTotal: draftEntries.filter(e => e.status === 'published').length,
      avgGenerationTime: 45,
      qualityDistribution: qualityDist,
    }
  }, [draftEntries])

  // Handle generate
  const handleGenerate = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsGenerating(false)
  }

  // Handle status change
  const handleStatusChange = (entryId: string, newStatus: GenerationStatus) => {
    console.log('Status change:', entryId, newStatus)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            工单知识自动生成
          </h2>
          <p className="text-muted-foreground">
            将工单和对话中的解决方案自动转化为结构化知识条目
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1" />
              批量生成
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalCaptured}</div>
                <div className="text-xs text-muted-foreground">已捕获</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.pendingGeneration}</div>
                <div className="text-xs text-muted-foreground">待生成</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.draftsInReview}</div>
                <div className="text-xs text-muted-foreground">审核中</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
                <div className="text-xs text-muted-foreground">已批准</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgGenerationTime}秒</div>
                <div className="text-xs text-muted-foreground">平均生成</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.publishedTotal}</div>
                <div className="text-xs text-muted-foreground">已发布</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            质量分布
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600">高质量</span>
                <span>{stats.qualityDistribution.high}</span>
              </div>
              <Progress value={(stats.qualityDistribution.high / stats.totalCaptured) * 100} className="h-2" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-600">中等质量</span>
                <span>{stats.qualityDistribution.medium}</span>
              </div>
              <Progress value={(stats.qualityDistribution.medium / stats.totalCaptured) * 100} className="h-2" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600">低质量</span>
                <span>{stats.qualityDistribution.low}</span>
              </div>
              <Progress value={(stats.qualityDistribution.low / stats.totalCaptured) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">待处理</TabsTrigger>
          <TabsTrigger value="drafts">草稿箱</TabsTrigger>
          <TabsTrigger value="review">审核中</TabsTrigger>
          <TabsTrigger value="approved">已批准</TabsTrigger>
          <TabsTrigger value="rejected">已拒绝</TabsTrigger>
        </TabsList>

        {/* Pending */}
        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">待生成的知识条目</h3>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              刷新
            </Button>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无待处理的工单</p>
                <p className="text-sm text-muted-foreground mt-1">
                  系统会自动捕获已解决的工单进行知识生成
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drafts */}
        <TabsContent value="drafts" className="space-y-4">
          <h3 className="font-medium">草稿箱</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {draftEntries.filter(e => e.status === 'draft').map(entry => {
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
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{entry.title}</span>
                              <Badge {...getQualityBadge(entry.quality)}>
                                {getQualityBadge(entry.quality).label}
                              </Badge>
                              <Badge {...getSourceBadge(entry.sourceType)}>
                                {getSourceBadge(entry.sourceType).label}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              置信度: {(entry.confidenceScore * 100).toFixed(0)}%
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {entry.suggestedTags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Ticket className="h-3 w-3" />
                              <span>来源: {entry.sourceTicket.title}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(entry.createdAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {draftEntries.filter(e => e.status === 'draft').length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无草稿</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Review */}
        <TabsContent value="review" className="space-y-4">
          <h3 className="font-medium">审核中</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {draftEntries.filter(e => e.status === 'reviewing').map(entry => {
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
                              <Badge {...getQualityBadge(entry.quality)}>
                                {getQualityBadge(entry.quality).label}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {entry.content.substring(0, 100)}...
                            </div>
                            {entry.reviewNotes && (
                              <div className="text-xs text-orange-600 p-2 bg-orange-50 rounded mb-2">
                                审核备注: {entry.reviewNotes}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>等待审核</span>
                              <span>•</span>
                              <span>置信度 {(entry.confidenceScore * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(entry.id, 'approved'); }}>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(entry.id, 'rejected'); }}>
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {draftEntries.filter(e => e.status === 'reviewing').length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无待审核条目</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Approved */}
        <TabsContent value="approved" className="space-y-4">
          <h3 className="font-medium">已批准</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {draftEntries.filter(e => e.status === 'approved' || e.status === 'published').map(entry => {
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
                              <Badge {...getStatusConfig(entry.status)}>
                                {getStatusConfig(entry.status).label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {entry.reviewedBy && (
                                <>
                                  <User className="h-3 w-3" />
                                  <span>{entry.reviewedBy}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{formatTimeAgo(entry.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        {entry.status === 'approved' && (
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-1" />
                            发布
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {draftEntries.filter(e => e.status === 'approved' || e.status === 'published').length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无已批准条目</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Rejected */}
        <TabsContent value="rejected" className="space-y-4">
          <h3 className="font-medium">已拒绝</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {draftEntries.filter(e => e.status === 'rejected').map(entry => {
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
                            </div>
                            {entry.reviewNotes && (
                              <div className="text-xs text-red-600 p-2 bg-red-50 rounded mb-2">
                                拒绝原因: {entry.reviewNotes}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatTimeAgo(entry.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          重新编辑
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {draftEntries.filter(e => e.status === 'rejected').length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无被拒绝的条目</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Entry Detail Panel */}
      {selectedEntry && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                知识条目详情
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(null)}>
                关闭
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-lg">{selectedEntry.title}</span>
                  <Badge {...getStatusConfig(selectedEntry.status)}>
                    {getStatusConfig(selectedEntry.status).label}
                  </Badge>
                  <Badge {...getQualityBadge(selectedEntry.quality)}>
                    {getQualityBadge(selectedEntry.quality).label}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  置信度: {(selectedEntry.confidenceScore * 100).toFixed(0)}% | 分类: {selectedEntry.suggestedCategory}
                </div>
              </div>

              {/* Source Ticket */}
              <div className="p-3 bg-muted/50 rounded">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  来源工单
                </div>
                <div className="text-sm">
                  <div className="font-medium">{selectedEntry.sourceTicket.title}</div>
                  <div className="text-muted-foreground mt-1">{selectedEntry.sourceTicket.resolution}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {selectedEntry.sourceTicket.department} | {formatTimeAgo(selectedEntry.sourceTicket.createdAt)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="text-sm font-medium mb-2">知识内容</div>
                <ScrollArea className="h-[200px]">
                  <div className="text-sm whitespace-pre-wrap p-3 bg-muted/50 rounded">
                    {selectedEntry.content}
                  </div>
                </ScrollArea>
              </div>

              {/* Tags */}
              <div>
                <div className="text-sm font-medium mb-2">建议标签</div>
                <div className="flex flex-wrap gap-1">
                  {selectedEntry.suggestedTags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Review Notes */}
              {selectedEntry.reviewNotes && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <div className="text-sm font-medium mb-1 text-orange-800">审核备注</div>
                  <div className="text-sm text-orange-700">{selectedEntry.reviewNotes}</div>
                  {selectedEntry.reviewedBy && (
                    <div className="text-xs text-orange-600 mt-2">
                      审核人: {selectedEntry.reviewedBy} | {formatTimeAgo(selectedEntry.reviewedAt!)}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedEntry.status === 'draft' && (
                  <>
                    <Button variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                    <Button className="flex-1">
                      <Send className="h-4 w-4 mr-1" />
                      提交审核
                    </Button>
                  </>
                )}
                {selectedEntry.status === 'reviewing' && (
                  <>
                    <Button variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                    <Button variant="default" className="flex-1 bg-green-500">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      批准
                    </Button>
                    <Button variant="destructive" className="flex-1">
                      <XCircle className="h-4 w-4 mr-1" />
                      拒绝
                    </Button>
                  </>
                )}
                {selectedEntry.status === 'approved' && (
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-1" />
                    发布到知识库
                  </Button>
                )}
                {selectedEntry.status === 'rejected' && (
                  <Button className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    重新编辑
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
