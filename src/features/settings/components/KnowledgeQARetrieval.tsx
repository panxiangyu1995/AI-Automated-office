import { useState, useMemo } from 'react'
import {
  Search,
  BookOpen,
  MessageSquare,
  Quote,
  Link2,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Loader2,
  Brain,
  Sparkles,
  RefreshCw,
  Settings,
  BarChart3,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
export type RetrievalStrategy = 'keyword' | 'semantic' | 'hybrid' | 'graph'
export type QAConfidenceLevel = 'high' | 'medium' | 'low'

export interface KnowledgeChunk {
  id: string
  docId: string
  docName: string
  content: string
  pageNumber?: number
  chunkIndex: number
  relevanceScore: number
  position: 'intro' | 'body' | 'conclusion'
}

export interface RetrievedKnowledge {
  id: string
  query: string
  strategy: RetrievalStrategy
  timestamp: string
  chunks: KnowledgeChunk[]
  totalChunks: number
  avgRelevanceScore: number
  processingTimeMs: number
}

export interface QAAnswer {
  id: string
  question: string
  answer: string
  retrievedKnowledge: RetrievedKnowledge[]
  citations: Citation[]
  confidence: QAConfidenceLevel
  timestamp: string
  helpful?: boolean
}

export interface Citation {
  id: string
  chunkId: string
  docName: string
  excerpt: string
  relevanceScore: number
  position: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  docCount: number
  lastUpdated: string
  enabled: boolean
}

export interface RetrievalStats {
  totalQueries: number
  avgChunksRetrieved: number
  avgProcessingTime: number
  topKnowledgeBases: { name: string; count: number }[]
  successRate: number
}

export interface KnowledgeQARetrievalProps {
  className?: string
}

// Mock knowledge bases
const MOCK_KNOWLEDGE_BASES: KnowledgeBase[] = [
  { id: 'kb-001', name: '员工手册', description: '公司员工手册和政策文档', docCount: 12, lastUpdated: '2026-03-20T10:00:00Z', enabled: true },
  { id: 'kb-002', name: '财务制度', description: '财务报销和采购制度', docCount: 8, lastUpdated: '2026-03-19T14:00:00Z', enabled: true },
  { id: 'kb-003', name: '产品文档', description: '产品手册和操作指南', docCount: 25, lastUpdated: '2026-03-18T09:00:00Z', enabled: true },
  { id: 'kb-004', name: 'IT运维', description: 'IT系统运维知识库', docCount: 15, lastUpdated: '2026-03-15T16:00:00Z', enabled: false },
]

// Mock Q&A history
const MOCK_QA_HISTORY: QAAnswer[] = [
  {
    id: 'qa-001',
    question: '如何申请年假？',
    answer: '根据员工手册第五章第三条，员工年假申请流程如下：\n\n1. 登录公司OA系统\n2. 进入"人事服务" -> "假勤申请"\n3. 选择"年假申请"类型\n4. 填写休假日期和代岗人员\n5. 提交部门经理审批\n\n年假天数根据员工司龄计算：\n- 司龄1-3年：5天\n- 司龄3-5年：10天\n- 司龄5-10年：15天\n- 司龄10年以上：20天',
    retrievedKnowledge: [
      {
        id: 'ret-001',
        query: '如何申请年假',
        strategy: 'hybrid',
        timestamp: '2026-03-24T10:35:00Z',
        chunks: [
          { id: 'chunk-001', docId: 'doc-001', docName: '员工手册2026.pdf', content: '第五章第三条：员工年假管理办法...', pageNumber: 45, chunkIndex: 1, relevanceScore: 0.95, position: 'body' },
          { id: 'chunk-002', docId: 'doc-001', docName: '员工手册2026.pdf', content: '年假天数计算标准：司龄1-3年5天...', pageNumber: 46, chunkIndex: 3, relevanceScore: 0.88, position: 'body' },
        ],
        totalChunks: 2,
        avgRelevanceScore: 0.915,
        processingTimeMs: 125,
      }
    ],
    citations: [
      { id: 'cit-001', chunkId: 'chunk-001', docName: '员工手册2026.pdf', excerpt: '第五章第三条：员工年假管理办法', relevanceScore: 0.95, position: 'p.45' },
      { id: 'cit-002', chunkId: 'chunk-002', docName: '员工手册2026.pdf', excerpt: '年假天数计算标准', relevanceScore: 0.88, position: 'p.46' },
    ],
    confidence: 'high',
    timestamp: '2026-03-24T10:35:00Z',
    helpful: true,
  },
  {
    id: 'qa-002',
    question: '报销发票有什么要求？',
    answer: '根据财务制度第四章，发票报销要求如下：\n\n**发票基本要求：**\n1. 必须为正规增值税发票\n2. 发票内容须与实际业务相符\n3. 发票日期须在90天内\n4. 必须加盖发票专用章\n\n**电子发票：**\n- 需提供PDF或OFD格式\n- 需打印后由部门经理签字\n\n**特殊情况：**\n- 差旅费需附行程单\n- 招待费需说明招待对象',
    retrievedKnowledge: [
      {
        id: 'ret-002',
        query: '报销发票要求',
        strategy: 'semantic',
        timestamp: '2026-03-24T10:20:00Z',
        chunks: [
          { id: 'chunk-010', docId: 'doc-002', docName: '财务报销制度.docx', content: '第四章第二条：发票规范要求...', chunkIndex: 2, relevanceScore: 0.92, position: 'body' },
        ],
        totalChunks: 1,
        avgRelevanceScore: 0.92,
        processingTimeMs: 98,
      }
    ],
    citations: [
      { id: 'cit-010', chunkId: 'chunk-010', docName: '财务报销制度.docx', excerpt: '第四章第二条：发票规范要求', relevanceScore: 0.92, position: 'ch.2' },
    ],
    confidence: 'high',
    timestamp: '2026-03-24T10:20:00Z',
    helpful: true,
  },
  {
    id: 'qa-003',
    question: '如何重置邮箱密码？',
    answer: 'IT运维知识库中没有找到完全匹配的内容。根据一般IT流程，建议您：\n\n1. 访问公司IT自助服务门户\n2. 点击"密码重置"\n3. 通过手机验证码验证身份\n4. 设置新密码（8-20位，包含大小写和数字）\n\n**如果自助服务不可用：**\n请联系IT支持热线：400-xxxx-xxxx\n或发送邮件至 it-support@company.com',
    retrievedKnowledge: [
      {
        id: 'ret-003',
        query: '邮箱密码重置',
        strategy: 'hybrid',
        timestamp: '2026-03-24T09:45:00Z',
        chunks: [
          { id: 'chunk-020', docId: 'doc-005', docName: '服务器操作指南.md', content: '由于文档解析失败，无法提取相关内容', chunkIndex: 0, relevanceScore: 0.15, position: 'body' },
        ],
        totalChunks: 1,
        avgRelevanceScore: 0.15,
        processingTimeMs: 85,
      }
    ],
    citations: [],
    confidence: 'low',
    timestamp: '2026-03-24T09:45:00Z',
    helpful: false,
  },
]

// Get confidence badge
const getConfidenceBadge = (confidence: QAConfidenceLevel) => {
  switch (confidence) {
    case 'high':
      return { variant: 'default' as const, label: '高置信', className: 'bg-green-500' }
    case 'medium':
      return { variant: 'secondary' as const, label: '中置信' }
    case 'low':
      return { variant: 'destructive' as const, label: '低置信' }
  }
}

// Get strategy badge
const getStrategyBadge = (strategy: RetrievalStrategy) => {
  switch (strategy) {
    case 'keyword':
      return { variant: 'outline' as const, label: '关键词' }
    case 'semantic':
      return { variant: 'secondary' as const, label: '语义' }
    case 'hybrid':
      return { variant: 'default' as const, label: '混合' }
    case 'graph':
      return { variant: 'default' as const, label: '图谱', className: 'bg-purple-500' }
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

export function KnowledgeQARetrieval({ className = '' }: KnowledgeQARetrievalProps) {
  const [query, setQuery] = useState('')
  const [selectedKBs, setSelectedKBs] = useState<string[]>(['kb-001', 'kb-002', 'kb-003'])
  const [strategy, setStrategy] = useState<RetrievalStrategy>('hybrid')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<QAAnswer | null>(null)
  const [qaHistory] = useState<QAAnswer[]>(MOCK_QA_HISTORY)

  // Stats
  const stats = useMemo((): RetrievalStats => {
    const total = qaHistory.length
    const avgChunks = qaHistory.reduce((sum, qa) => sum + qa.retrievedKnowledge.reduce((s, r) => s + r.totalChunks, 0), 0) / total
    const avgTime = qaHistory.reduce((sum, qa) => sum + qa.retrievedKnowledge.reduce((s, r) => s + r.processingTimeMs, 0), 0) / total
    const helpful = qaHistory.filter(qa => qa.helpful === true).length
    const kbCounts: Record<string, number> = {}
    qaHistory.forEach(qa => {
      qa.retrievedKnowledge.forEach(r => {
        r.chunks.forEach(c => {
          kbCounts[c.docName] = (kbCounts[c.docName] || 0) + 1
        })
      })
    })
    const topKBs = Object.entries(kbCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 3)
    return {
      totalQueries: total,
      avgChunksRetrieved: avgChunks,
      avgProcessingTime: avgTime,
      topKnowledgeBases: topKBs,
      successRate: (helpful / total) * 100,
    }
  }, [qaHistory])

  // Handle search
  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 500))
    const result = MOCK_QA_HISTORY.find(qa => qa.question.includes(query)) || null
    setSearchResult(result)
    setIsSearching(false)
  }

  // Handle feedback
  const handleFeedback = (qaId: string, helpful: boolean) => {
    console.log('Feedback:', qaId, helpful)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6" />
            知识问答检索
          </h2>
          <p className="text-muted-foreground">
            基于知识库的混合检索问答，支持语义理解和溯源引用
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalQueries}</div>
                <div className="text-xs text-muted-foreground">问答总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgChunksRetrieved.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">平均检索块</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgProcessingTime.toFixed(0)}ms</div>
                <div className="text-xs text-muted-foreground">平均耗时</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">满意度</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{MOCK_KNOWLEDGE_BASES.filter(kb => kb.enabled).length}</div>
                <div className="text-xs text-muted-foreground">活跃知识库</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Search className="h-4 w-4" />
            知识检索
          </h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="输入您的问题..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    检索中
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-1" />
                    检索
                  </>
                )}
              </Button>
            </div>

            {/* Strategy Selection */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">检索策略：</span>
              <div className="flex gap-2">
                {(['keyword', 'semantic', 'hybrid', 'graph'] as RetrievalStrategy[]).map(s => (
                  <button
                    key={s}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      strategy === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setStrategy(s)}
                  >
                    {getStrategyBadge(s).label}
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge Base Selection */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">知识库：</span>
              <div className="flex flex-wrap gap-2">
                {MOCK_KNOWLEDGE_BASES.filter(kb => kb.enabled).map(kb => (
                  <button
                    key={kb.id}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedKBs.includes(kb.id)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => {
                      if (selectedKBs.includes(kb.id)) {
                        setSelectedKBs(prev => prev.filter(id => id !== kb.id))
                      } else {
                        setSelectedKBs(prev => [...prev, kb.id])
                      }
                    }}
                  >
                    {kb.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Result or Q&A History */}
      <Tabs defaultValue="history">
        <TabsList className="mb-4">
          <TabsTrigger value="history">问答历史</TabsTrigger>
          <TabsTrigger value="result">检索结果</TabsTrigger>
          <TabsTrigger value="knowledge-bases">知识库配置</TabsTrigger>
        </TabsList>

        {/* Q&A History */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">最近问答</h3>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              刷新
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {qaHistory.map(qa => (
                <Card key={qa.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Question */}
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{qa.question}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(qa.timestamp)}
                          </div>
                        </div>
                        <Badge {...getConfidenceBadge(qa.confidence)}>
                          {getConfidenceBadge(qa.confidence).label}
                        </Badge>
                      </div>

                      {/* Answer */}
                      <div className="pl-7 space-y-2">
                        <div className="text-sm whitespace-pre-wrap">
                          {qa.answer}
                        </div>

                        {/* Citations */}
                        {qa.citations.length > 0 && (
                          <div className="space-y-2 mt-3">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Quote className="h-3 w-3" />
                              引用来源
                            </div>
                            {qa.citations.map(cit => (
                              <div key={cit.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
                                <Link2 className="h-3 w-3 text-muted-foreground mt-0.5" />
                                <div>
                                  <div className="font-medium">{cit.docName}</div>
                                  <div className="text-muted-foreground">{cit.excerpt}</div>
                                  <div className="text-muted-foreground">相关度: {(cit.relevanceScore * 100).toFixed(0)}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Feedback */}
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs text-muted-foreground">是否有用：</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 ${qa.helpful === true ? 'text-green-500' : 'text-muted-foreground'}`}
                            onClick={() => handleFeedback(qa.id, true)}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            有用
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 ${qa.helpful === false ? 'text-red-500' : 'text-muted-foreground'}`}
                            onClick={() => handleFeedback(qa.id, false)}
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            没用
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                            <Copy className="h-3 w-3 mr-1" />
                            复制
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Search Result */}
        <TabsContent value="result">
          {searchResult ? (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-lg">{searchResult.question}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(searchResult.timestamp)}
                      </div>
                    </div>
                    <Badge {...getConfidenceBadge(searchResult.confidence)}>
                      {getConfidenceBadge(searchResult.confidence).label}
                    </Badge>
                  </div>

                  <div className="pl-7">
                    <div className="text-sm whitespace-pre-wrap">
                      {searchResult.answer}
                    </div>
                  </div>

                  {/* Retrieved Knowledge Details */}
                  <div className="pl-7 pt-4 border-t">
                    <div className="text-sm font-medium mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      检索详情
                    </div>
                    {searchResult.retrievedKnowledge.map(ret => (
                      <div key={ret.id} className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge {...getStrategyBadge(ret.strategy)}>
                            {getStrategyBadge(ret.strategy).label}
                          </Badge>
                          <span>检索到 {ret.totalChunks} 个相关块</span>
                          <span>•</span>
                          <span>耗时 {ret.processingTimeMs}ms</span>
                          <span>•</span>
                          <span>平均相关度 {(ret.avgRelevanceScore * 100).toFixed(0)}%</span>
                        </div>
                        {ret.chunks.map(chunk => (
                          <div key={chunk.id} className="p-3 bg-muted/50 rounded text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{chunk.docName}</span>
                                {chunk.pageNumber && (
                                  <span className="text-muted-foreground">p.{chunk.pageNumber}</span>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                相关度 {(chunk.relevanceScore * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <div className="text-muted-foreground">
                              {chunk.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">输入问题并点击检索查看结果</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Knowledge Bases Configuration */}
        <TabsContent value="knowledge-bases">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">知识库配置</h3>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                管理知识库
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_KNOWLEDGE_BASES.map(kb => (
                <Card key={kb.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded flex items-center justify-center ${
                          kb.enabled ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <BookOpen className={`h-5 w-5 ${kb.enabled ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {kb.name}
                            {!kb.enabled && (
                              <Badge variant="outline" className="text-xs">已禁用</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {kb.description}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span>{kb.docCount} 个文档</span>
                            <span>•</span>
                            <span>更新于 {formatTimeAgo(kb.lastUpdated)}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {kb.enabled ? '禁用' : '启用'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
