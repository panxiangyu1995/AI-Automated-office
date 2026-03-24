import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Star,
  Zap,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Target,
  Lightbulb,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'

// Types
export type QualityScore = 'excellent' | 'good' | 'fair' | 'poor'
export type QualityMetric = 'accuracy' | 'completeness' | 'relevance' | 'freshness' | 'usage'
export type UpdatePriority = 'high' | 'medium' | 'low'
export type QualityTrend = 'improving' | 'stable' | 'declining'

export interface QualityScoreResult {
  entryId: string
  entryTitle: string
  overallScore: number
  qualityLevel: QualityScore
  metrics: Record<QualityMetric, number>
  trend: QualityTrend
  lastUpdated: string
  updatePriority: UpdatePriority
  suggestions: string[]
}

export interface QualityStats {
  totalEntries: number
  excellentCount: number
  goodCount: number
  fairCount: number
  poorCount: number
  averageScore: number
  needsUpdateCount: number
  averageFreshness: number
}

export interface KnowledgeQualityEvaluationProps {
  // Reserved for future props
}

// Mock data
const MOCK_QUALITY_RESULTS: QualityScoreResult[] = [
  {
    entryId: 'entry-001',
    entryTitle: '员工报销流程指南',
    overallScore: 92,
    qualityLevel: 'excellent',
    metrics: { accuracy: 95, completeness: 90, relevance: 94, freshness: 88, usage: 95 },
    trend: 'stable',
    lastUpdated: '2026-03-15T10:00:00Z',
    updatePriority: 'low',
    suggestions: ['继续保持内容更新'],
  },
  {
    entryId: 'entry-002',
    entryTitle: '产品退货政策',
    overallScore: 78,
    qualityLevel: 'good',
    metrics: { accuracy: 82, completeness: 75, relevance: 80, freshness: 72, usage: 85 },
    trend: 'declining',
    lastUpdated: '2026-02-20T10:00:00Z',
    updatePriority: 'medium',
    suggestions: ['内容有些过时，需要更新退货政策细节', '建议增加常见问题解答'],
  },
  {
    entryId: 'entry-003',
    entryTitle: '会议室预约说明',
    overallScore: 65,
    qualityLevel: 'fair',
    metrics: { accuracy: 70, completeness: 60, relevance: 68, freshness: 55, usage: 72 },
    trend: 'declining',
    lastUpdated: '2026-01-10T10:00:00Z',
    updatePriority: 'high',
    suggestions: ['预约流程已更新，需同步知识库', '建议增加图片指引', '新鲜度较低，建议立即更新'],
  },
  {
    entryId: 'entry-004',
    entryTitle: '年会活动安排',
    overallScore: 42,
    qualityLevel: 'poor',
    metrics: { accuracy: 50, completeness: 40, relevance: 45, freshness: 30, usage: 40 },
    trend: 'declining',
    lastUpdated: '2025-12-01T10:00:00Z',
    updatePriority: 'high',
    suggestions: ['活动已结束，内容已过时', '建议归档或删除', '高优先级更新项目'],
  },
  {
    entryId: 'entry-005',
    entryTitle: '系统权限申请流程',
    overallScore: 88,
    qualityLevel: 'excellent',
    metrics: { accuracy: 90, completeness: 85, relevance: 92, freshness: 85, usage: 90 },
    trend: 'improving',
    lastUpdated: '2026-03-18T10:00:00Z',
    updatePriority: 'low',
    suggestions: ['内容质量优秀', '建议作为模板参考'],
  },
  {
    entryId: 'entry-006',
    entryTitle: '客户服务标准流程',
    overallScore: 75,
    qualityLevel: 'good',
    metrics: { accuracy: 78, completeness: 72, relevance: 80, freshness: 70, usage: 78 },
    trend: 'stable',
    lastUpdated: '2026-03-01T10:00:00Z',
    updatePriority: 'medium',
    suggestions: ['建议增加最新案例分析', '保持定期更新频率'],
  },
]

// Calculate stats from results
const calculateStats = (results: QualityScoreResult[]): QualityStats => {
  const total = results.length
  const excellent = results.filter(r => r.qualityLevel === 'excellent').length
  const good = results.filter(r => r.qualityLevel === 'good').length
  const fair = results.filter(r => r.qualityLevel === 'fair').length
  const poor = results.filter(r => r.qualityLevel === 'poor').length
  const average = results.reduce((sum, r) => sum + r.overallScore, 0) / total
  const needsUpdate = results.filter(r => r.updatePriority !== 'low').length
  const avgFreshness = results.reduce((sum, r) => sum + r.metrics.freshness, 0) / total

  return {
    totalEntries: total,
    excellentCount: excellent,
    goodCount: good,
    fairCount: fair,
    poorCount: poor,
    averageScore: Math.round(average),
    needsUpdateCount: needsUpdate,
    averageFreshness: Math.round(avgFreshness),
  }
}

// Get quality color
const getQualityColor = (level: QualityScore): string => {
  switch (level) {
    case 'excellent':
      return 'text-green-500 bg-green-50 border-green-200'
    case 'good':
      return 'text-blue-500 bg-blue-50 border-blue-200'
    case 'fair':
      return 'text-yellow-500 bg-yellow-50 border-yellow-200'
    case 'poor':
      return 'text-red-500 bg-red-50 border-red-200'
  }
}

// Get quality label
const getQualityLabel = (level: QualityScore): string => {
  switch (level) {
    case 'excellent':
      return '优秀'
    case 'good':
      return '良好'
    case 'fair':
      return '一般'
    case 'poor':
      return '较差'
  }
}

// Get priority color
const getPriorityColor = (priority: UpdatePriority): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200'
  }
}

// Get priority label
const getPriorityLabel = (priority: UpdatePriority): string => {
  switch (priority) {
    case 'high':
      return '高'
    case 'medium':
      return '中'
    case 'low':
      return '低'
  }
}

// Get trend icon
const getTrendIcon = (trend: QualityTrend) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'stable':
      return <BarChart3 className="h-4 w-4 text-blue-500" />
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-red-500" />
  }
}

// Get trend label
const getTrendLabel = (trend: QualityTrend): string => {
  switch (trend) {
    case 'improving':
      return '上升'
    case 'stable':
      return '稳定'
    case 'declining':
      return '下降'
  }
}

// Get metric label
const getMetricLabel = (metric: QualityMetric): string => {
  switch (metric) {
    case 'accuracy':
      return '准确性'
    case 'completeness':
      return '完整性'
    case 'relevance':
      return '相关性'
    case 'freshness':
      return '新鲜度'
    case 'usage':
      return '使用率'
  }
}

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// Main component
export function KnowledgeQualityEvaluation(_props: KnowledgeQualityEvaluationProps) {
  const [selectedEntry, setSelectedEntry] = useState<QualityScoreResult | null>(null)
  const [filterLevel, setFilterLevel] = useState<QualityScore | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<UpdatePriority | 'all'>('all')
  const [scoreThreshold, setScoreThreshold] = useState([0])

  const stats = useMemo(() => calculateStats(MOCK_QUALITY_RESULTS), [])

  const filteredResults = useMemo(() => {
    return MOCK_QUALITY_RESULTS.filter(result => {
      if (filterLevel !== 'all' && result.qualityLevel !== filterLevel) return false
      if (filterPriority !== 'all' && result.updatePriority !== filterPriority) return false
      if (result.overallScore < scoreThreshold[0]) return false
      return true
    })
  }, [filterLevel, filterPriority, scoreThreshold])

  const excellentPercent = Math.round((stats.excellentCount / stats.totalEntries) * 100)
  const goodPercent = Math.round((stats.goodCount / stats.totalEntries) * 100)
  const fairPercent = Math.round((stats.fairCount / stats.totalEntries) * 100)
  const poorPercent = Math.round((stats.poorCount / stats.totalEntries) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">知识质量评估</h2>
        <p className="text-sm text-slate-500 mt-1">评估知识条目质量，提供更新建议</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">总条目数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalEntries}</p>
              </div>
              <Award className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">平均质量分</p>
                <p className="text-2xl font-bold text-slate-800">{stats.averageScore}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">待更新</p>
                <p className="text-2xl font-bold text-red-500">{stats.needsUpdateCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">平均新鲜度</p>
                <p className="text-2xl font-bold text-slate-800">{stats.averageFreshness}%</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">质量分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 text-sm text-slate-600">优秀 (90+)</div>
              <Progress value={excellentPercent} className="flex-1 h-2" />
              <div className="w-12 text-sm text-slate-600 text-right">{excellentPercent}%</div>
              <Badge className="bg-green-100 text-green-700 border-green-200">{stats.excellentCount}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 text-sm text-slate-600">良好 (75-89)</div>
              <Progress value={goodPercent} className="flex-1 h-2" />
              <div className="w-12 text-sm text-slate-600 text-right">{goodPercent}%</div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">{stats.goodCount}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 text-sm text-slate-600">一般 (60-74)</div>
              <Progress value={fairPercent} className="flex-1 h-2" />
              <div className="w-12 text-sm text-slate-600 text-right">{fairPercent}%</div>
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{stats.fairCount}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 text-sm text-slate-600">较差 (&lt;60)</div>
              <Progress value={poorPercent} className="flex-1 h-2" />
              <div className="w-12 text-sm text-slate-600 text-right">{poorPercent}%</div>
              <Badge className="bg-red-100 text-red-700 border-red-200">{stats.poorCount}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">质量详情</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">列表视图</TabsTrigger>
              <TabsTrigger value="priority">优先级视图</TabsTrigger>
              <TabsTrigger value="trends">趋势视图</TabsTrigger>
            </TabsList>

            {/* List View */}
            <TabsContent value="list">
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <select
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={filterLevel}
                  onChange={e => setFilterLevel(e.target.value as QualityScore | 'all')}
                >
                  <option value="all">全部质量等级</option>
                  <option value="excellent">优秀</option>
                  <option value="good">良好</option>
                  <option value="fair">一般</option>
                  <option value="poor">较差</option>
                </select>
                <select
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value as UpdatePriority | 'all')}
                >
                  <option value="all">全部优先级</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-slate-600">最低分数:</span>
                  <span className="text-sm font-medium w-8">{scoreThreshold[0]}</span>
                  <Slider
                    value={scoreThreshold}
                    onValueChange={setScoreThreshold}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1 max-w-[200px]"
                  />
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-3">
                {filteredResults.map(result => (
                  <div
                    key={result.entryId}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedEntry?.entryId === result.entryId
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedEntry(result)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-slate-800">{result.overallScore}</div>
                        <div>
                          <div className="font-medium text-slate-800">{result.entryTitle}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getQualityColor(result.qualityLevel)}>
                              {getQualityLabel(result.qualityLevel)}
                            </Badge>
                            <Badge className={getPriorityColor(result.updatePriority)}>
                              更新优先级: {getPriorityLabel(result.updatePriority)}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              {getTrendIcon(result.trend)}
                              {getTrendLabel(result.trend)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <div>更新于 {formatDate(result.lastUpdated)}</div>
                        <div className="mt-1">{result.suggestions.length} 条建议</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Priority View */}
            <TabsContent value="priority">
              <div className="space-y-4">
                {filteredResults
                  .sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 }
                    return priorityOrder[a.updatePriority] - priorityOrder[b.updatePriority]
                  })
                  .map(result => (
                    <div key={result.entryId} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200">
                      <div className={`w-3 h-3 rounded-full ${
                        result.updatePriority === 'high' ? 'bg-red-500' :
                        result.updatePriority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{result.entryTitle}</div>
                        <div className="text-sm text-slate-500">{result.suggestions[0]}</div>
                      </div>
                      <Badge className={getPriorityColor(result.updatePriority)}>
                        {getPriorityLabel(result.updatePriority)}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        更新
                      </Button>
                    </div>
                  ))}
              </div>
            </TabsContent>

            {/* Trends View */}
            <TabsContent value="trends">
              <div className="space-y-3">
                {filteredResults
                  .sort((a, b) => {
                    const trendOrder = { declining: 0, stable: 1, improving: 2 }
                    return trendOrder[a.trend] - trendOrder[b.trend]
                  })
                  .map(result => (
                    <div key={result.entryId} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200">
                      {getTrendIcon(result.trend)}
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{result.entryTitle}</div>
                        <div className="text-sm text-slate-500">
                          {result.trend === 'declining' ? '质量下降，需要关注' :
                           result.trend === 'stable' ? '质量稳定' : '质量改善中'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-800">{result.overallScore}</div>
                        <div className="text-xs text-slate-500">质量分</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {result.trend === 'improving' ? (
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                        ) : result.trend === 'declining' ? (
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Entry Detail */}
      {selectedEntry && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{selectedEntry.entryTitle}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(null)}>
                关闭
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Metrics */}
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-3">质量指标</h4>
                <div className="space-y-3">
                  {(Object.keys(selectedEntry.metrics) as QualityMetric[]).map(metric => (
                    <div key={metric} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{getMetricLabel(metric)}</span>
                        <span className="font-medium text-slate-800">{selectedEntry.metrics[metric]}%</span>
                      </div>
                      <Progress value={selectedEntry.metrics[metric]} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-3">优化建议</h4>
                <div className="space-y-2">
                  {selectedEntry.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-slate-50">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{suggestion}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">
                    <Target className="h-4 w-4 mr-1" />
                    发起更新
                  </Button>
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4 mr-1" />
                    立即刷新评分
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
