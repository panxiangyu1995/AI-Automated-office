import React, { useState, useMemo } from 'react'
import {
  Search,
  Database,
  Brain,
  RefreshCw,
  Eye,
  Clock,
  Tag,
  Zap,
  Target,
  Download,
  TrendingUp,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'

// Memory Retrieval Types
export type RetrievalMode = 'vector' | 'keyword' | 'hybrid'
export type RetrievalScope = 'session' | 'user' | 'tenant' | 'enterprise' | 'all'
export type RelevanceLevel = 'high' | 'medium' | 'low'

export interface RetrievalResult {
  id: string
  memoryKey: string
  content: string
  scope: RetrievalScope
  relevanceScore: number
  relevanceLevel: RelevanceLevel
  vectorScore?: number
  keywordScore?: number
  source: string
  tags: string[]
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  metadata?: Record<string, unknown>
}

export interface CognitiveTunnelState {
  id: string
  sessionId: string
  timestamp: number
  activeMemories: string[]
  contextWindow: number
  compressionRatio: number
  retrievalLatency: number
  tokenBudget: number
  tokensUsed: number
  memoryLayers: {
    session: number
    user: number
    tenant: number
    enterprise: number
  }
}

export interface RetrievalStats {
  totalQueries: number
  avgLatency: number
  avgRelevance: number
  vectorQueries: number
  keywordQueries: number
  hybridQueries: number
  cacheHitRate: number
  topScopes: Record<RetrievalScope, number>
}

// Mock Data
const mockRetrievalResults: RetrievalResult[] = [
  {
    id: '1',
    memoryKey: 'user_project_context',
    content: '用户正在开发AI-Automated-office项目，使用React + Tauri + TypeScript技术栈',
    scope: 'session',
    relevanceScore: 0.98,
    relevanceLevel: 'high',
    vectorScore: 0.95,
    keywordScore: 1.0,
    source: 'extraction',
    tags: ['project', 'context', 'development'],
    createdAt: Date.now() - 3600000,
    lastAccessedAt: Date.now() - 300000,
    accessCount: 15,
  },
  {
    id: '2',
    memoryKey: 'user_code_style',
    content: 'TypeScript with strict mode, prefer functional components, use Tailwind CSS',
    scope: 'user',
    relevanceScore: 0.92,
    relevanceLevel: 'high',
    vectorScore: 0.88,
    keywordScore: 0.96,
    source: 'preference',
    tags: ['style', 'typescript', 'frontend'],
    createdAt: Date.now() - 86400000 * 7,
    lastAccessedAt: Date.now() - 600000,
    accessCount: 28,
  },
  {
    id: '3',
    memoryKey: 'company_deployment_policy',
    content: '公司部署策略：使用Docker容器化，Kubernetes编排，CI/CD通过GitHub Actions',
    scope: 'tenant',
    relevanceScore: 0.78,
    relevanceLevel: 'medium',
    vectorScore: 0.72,
    keywordScore: 0.85,
    source: 'imported',
    tags: ['deployment', 'devops', 'policy'],
    createdAt: Date.now() - 86400000 * 30,
    lastAccessedAt: Date.now() - 3600000,
    accessCount: 12,
  },
  {
    id: '4',
    memoryKey: 'enterprise_security_guidelines',
    content: '企业安全指南：所有API密钥必须存储在环境变量中，禁止硬编码敏感信息',
    scope: 'enterprise',
    relevanceScore: 0.65,
    relevanceLevel: 'medium',
    vectorScore: 0.58,
    keywordScore: 0.72,
    source: 'imported',
    tags: ['security', 'guidelines', 'api'],
    createdAt: Date.now() - 86400000 * 60,
    lastAccessedAt: Date.now() - 86400000,
    accessCount: 8,
  },
  {
    id: '5',
    memoryKey: 'user_workflow_preference',
    content: '用户偏好自动化测试和代码审查的工作流程',
    scope: 'user',
    relevanceScore: 0.55,
    relevanceLevel: 'low',
    vectorScore: 0.48,
    keywordScore: 0.62,
    source: 'inferred',
    tags: ['workflow', 'testing', 'review'],
    createdAt: Date.now() - 86400000 * 5,
    lastAccessedAt: Date.now() - 7200000,
    accessCount: 6,
  },
]

const mockCognitiveState: CognitiveTunnelState = {
  id: 'ct-001',
  sessionId: 'session-001',
  timestamp: Date.now(),
  activeMemories: [
    'user_project_context',
    'user_code_style',
    'user_preferred_language',
    'company_deployment_policy',
  ],
  contextWindow: 4096,
  compressionRatio: 0.72,
  retrievalLatency: 45,
  tokenBudget: 8000,
  tokensUsed: 3248,
  memoryLayers: {
    session: 15,
    user: 28,
    tenant: 8,
    enterprise: 4,
  },
}

const mockStats: RetrievalStats = {
  totalQueries: 1247,
  avgLatency: 38,
  avgRelevance: 0.84,
  vectorQueries: 456,
  keywordQueries: 312,
  hybridQueries: 479,
  cacheHitRate: 0.67,
  topScopes: {
    session: 456,
    user: 398,
    tenant: 234,
    enterprise: 159,
    all: 0,
  },
}

const scopeColors: Record<RetrievalScope, string> = {
  session: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  tenant: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  all: 'bg-gray-100 text-gray-800',
}

const relevanceColors: Record<RelevanceLevel, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-600',
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

export function MemoryRetrieval(): React.ReactNode {
  const [activeTab, setActiveTab] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>('hybrid')
  const [selectedScope, setSelectedScope] = useState<RetrievalScope | 'all'>('all')
  const [minRelevance, setMinRelevance] = useState([50])
  const [maxResults, setMaxResults] = useState([10])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<RetrievalResult | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCognitiveDialog, setShowCognitiveDialog] = useState(false)

  // Filter results
  const filteredResults = useMemo(() => {
    return mockRetrievalResults.filter((result) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !result.memoryKey.toLowerCase().includes(query) &&
          !result.content.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (selectedScope !== 'all' && result.scope !== selectedScope) return false
      if (result.relevanceScore * 100 < minRelevance[0]) return false
      return true
    }).slice(0, maxResults[0])
  }, [searchQuery, selectedScope, minRelevance, maxResults])

  // Handlers
  const handleSearch = () => {
    setIsSearching(true)
    setTimeout(() => setIsSearching(false), 1000)
  }

  const handleViewResult = (result: RetrievalResult) => {
    setSelectedResult(result)
    setShowDetailDialog(true)
  }

  const handleExportResults = () => {
    const data = JSON.stringify(filteredResults, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memory-retrieval-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ao-button.background)]">记忆检索功能</h2>
          <p className="text-muted-foreground">混合检索和认知状态重建</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCognitiveDialog(true)}>
            <Brain className="h-4 w-4 mr-2" />
            认知状态
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportResults}>
            <Download className="h-4 w-4 mr-2" />
            导出结果
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[var(--ao-button.background)]" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalQueries}</p>
                <p className="text-sm text-muted-foreground">总查询次数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.avgLatency}ms</p>
                <p className="text-sm text-muted-foreground">平均延迟</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{(mockStats.avgRelevance * 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">平均相关性</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{(mockStats.cacheHitRate * 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">缓存命中率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search">检索搜索</TabsTrigger>
          <TabsTrigger value="byMode">按模式统计</TabsTrigger>
          <TabsTrigger value="cognitive">认知隧道</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          {/* Search Controls */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入检索查询..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={retrievalMode}
                  onValueChange={(v) => setRetrievalMode(v as RetrievalMode)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="检索模式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vector">向量检索</SelectItem>
                    <SelectItem value="keyword">关键词检索</SelectItem>
                    <SelectItem value="hybrid">混合检索</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedScope}
                  onValueChange={(v) => setSelectedScope(v as RetrievalScope | 'all')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部范围</SelectItem>
                    <SelectItem value="session">会话</SelectItem>
                    <SelectItem value="user">用户</SelectItem>
                    <SelectItem value="tenant">租户</SelectItem>
                    <SelectItem value="enterprise">企业</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  检索
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">最低相关性: {minRelevance[0]}%</label>
                  </div>
                  <Slider
                    value={minRelevance}
                    onValueChange={setMinRelevance}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">最大结果数: {maxResults[0]}</label>
                  </div>
                  <Slider
                    value={maxResults}
                    onValueChange={setMaxResults}
                    max={50}
                    min={5}
                    step={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredResults.map((result) => (
                <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={scopeColors[result.scope]}>{result.scope}</Badge>
                          <span className={`font-medium ${relevanceColors[result.relevanceLevel]}`}>
                            相关性: {(result.relevanceScore * 100).toFixed(0)}%
                          </span>
                          <span className="font-mono text-sm">{result.memoryKey}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {result.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {result.tags.join(', ')}
                          </span>
                          <span>来源: {result.source}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            访问 {result.accessCount} 次
                          </span>
                        </div>
                        {retrievalMode !== 'keyword' && result.vectorScore && (
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <span>向量分数: {(result.vectorScore * 100).toFixed(0)}%</span>
                            {result.keywordScore && (
                              <>
                                <span>|</span>
                                <span>关键词分数: {(result.keywordScore * 100).toFixed(0)}%</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewResult(result)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* By Mode Tab */}
        <TabsContent value="byMode" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">向量检索</CardTitle>
                  <Badge variant="secondary">{mockStats.vectorQueries}</Badge>
                </div>
                <CardDescription>基于语义相似度的检索</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>占总查询</span>
                    <span className="font-medium">
                      {((mockStats.vectorQueries / mockStats.totalQueries) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={(mockStats.vectorQueries / mockStats.totalQueries) * 100}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    适用于语义相似性搜索，理解上下文含义
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">关键词检索</CardTitle>
                  <Badge variant="secondary">{mockStats.keywordQueries}</Badge>
                </div>
                <CardDescription>基于精确匹配的检索</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>占总查询</span>
                    <span className="font-medium">
                      {((mockStats.keywordQueries / mockStats.totalQueries) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={(mockStats.keywordQueries / mockStats.totalQueries) * 100}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    适用于精确匹配场景，查找特定术语
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">混合检索</CardTitle>
                  <Badge variant="secondary">{mockStats.hybridQueries}</Badge>
                </div>
                <CardDescription>结合向量和关键词的综合检索</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>占总查询</span>
                    <span className="font-medium">
                      {((mockStats.hybridQueries / mockStats.totalQueries) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={(mockStats.hybridQueries / mockStats.totalQueries) * 100}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    最佳综合效果，平衡语义理解和精确匹配
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scope Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">按范围分布</CardTitle>
              <CardDescription>各范围层级的检索次数统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(['session', 'user', 'tenant', 'enterprise'] as RetrievalScope[]).map(
                  (scope) => (
                    <div key={scope} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className={scopeColors[scope]}>{scope}</Badge>
                        <span className="font-medium">{mockStats.topScopes[scope]}</span>
                      </div>
                      <Progress
                        value={(mockStats.topScopes[scope] / mockStats.totalQueries) * 100}
                        className="h-2"
                      />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cognitive Tunnel Tab */}
        <TabsContent value="cognitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">认知隧道状态</CardTitle>
              <CardDescription>Agent当前激活的记忆上下文</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">会话ID</label>
                    <p className="font-mono">{mockCognitiveState.sessionId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">激活记忆数</label>
                    <p className="text-2xl font-bold">{mockCognitiveState.activeMemories.length}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">检索延迟</label>
                    <p className="text-2xl font-bold">{mockCognitiveState.retrievalLatency}ms</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">压缩比率</label>
                    <p className="text-2xl font-bold">
                      {(mockCognitiveState.compressionRatio * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Token预算</label>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{mockCognitiveState.tokensUsed}</span>
                      <span className="text-sm text-muted-foreground">
                        / {mockCognitiveState.tokenBudget}
                      </span>
                    </div>
                    <Progress
                      value={(mockCognitiveState.tokensUsed / mockCognitiveState.tokenBudget) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">记忆层分布</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(mockCognitiveState.memoryLayers).map(([layer, count]) => (
                        <div
                          key={layer}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <Badge className={scopeColors[layer as RetrievalScope]}>{layer}</Badge>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Memories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">激活的记忆</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {mockCognitiveState.activeMemories.map((memory, index) => (
                    <div
                      key={memory}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <span className="text-muted-foreground text-sm w-6">{index + 1}.</span>
                      <code className="font-mono text-sm flex-1">{memory}</code>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>检索结果详情</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">记忆键</label>
                  <p className="font-mono">{selectedResult.memoryKey}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">范围</label>
                  <p>
                    <Badge className={scopeColors[selectedResult.scope]}>
                      {selectedResult.scope}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">相关性</label>
                  <p className={relevanceColors[selectedResult.relevanceLevel]}>
                    {(selectedResult.relevanceScore * 100).toFixed(0)}% ({selectedResult.relevanceLevel})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">来源</label>
                  <p>{selectedResult.source}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">内容</label>
                <p className="p-3 bg-muted rounded-md">{selectedResult.content}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">标签</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedResult.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedResult.vectorScore && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">向量分数</div>
                    <div className="text-xl font-bold">
                      {(selectedResult.vectorScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  {selectedResult.keywordScore && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">关键词分数</div>
                      <div className="text-xl font-bold">
                        {(selectedResult.keywordScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">创建时间</label>
                  <p>{formatTimeAgo(selectedResult.createdAt)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">最后访问</label>
                  <p>{formatTimeAgo(selectedResult.lastAccessedAt)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">访问次数</label>
                  <p>{selectedResult.accessCount}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cognitive State Dialog */}
      <Dialog open={showCognitiveDialog} onOpenChange={setShowCognitiveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>认知隧道状态详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">状态ID</label>
                <p className="font-mono">{mockCognitiveState.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">会话ID</label>
                <p className="font-mono">{mockCognitiveState.sessionId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">上下文窗口</label>
                <p>{mockCognitiveState.contextWindow} tokens</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">检索延迟</label>
                <p>{mockCognitiveState.retrievalLatency}ms</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Token使用</label>
              <div className="flex items-center justify-between mb-1 mt-1">
                <span className="text-sm">{mockCognitiveState.tokensUsed}</span>
                <span className="text-sm text-muted-foreground">
                  / {mockCognitiveState.tokenBudget}
                </span>
              </div>
              <Progress
                value={(mockCognitiveState.tokensUsed / mockCognitiveState.tokenBudget) * 100}
                className="h-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">记忆层分布</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(mockCognitiveState.memoryLayers).map(([layer, count]) => (
                  <div
                    key={layer}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <Badge className={scopeColors[layer as RetrievalScope]}>{layer}</Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">激活的记忆列表</label>
              <ScrollArea className="h-[150px] mt-2">
                <div className="space-y-1">
                  {mockCognitiveState.activeMemories.map((memory, index) => (
                    <div
                      key={memory}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <span className="text-muted-foreground text-sm w-6">{index + 1}.</span>
                      <code className="font-mono text-sm flex-1">{memory}</code>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}