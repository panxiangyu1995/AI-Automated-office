/**
 * ToolSelection - 工具选择决策组件
 * Story 7.4 - 工具选择决策
 * 
 * 支持功能：
 * - 候选工具排名
 * - 选择理由记录
 * - 选择结果审计
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 * - FR412: 工具选择可见和可度量
 */

import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  XCircle,
  Minus,
  Star,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Filter,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ==================== Types ====================

export type SelectionToolCategory = 'core' | 'plugin' | 'mcp' | 'builtin'

export type SelectionStatus = 'candidate' | 'selected' | 'rejected' | 'fallback'

export interface ToolCandidate {
  id: string
  name: string
  description: string
  category: SelectionToolCategory
  score: number // 0-100
  rank: number
  status: SelectionStatus
  capabilities: string[]
  limitations: string[]
  selectionReason?: string
  rejectionReason?: string
  usageCount?: number
  successRate?: number // 0-100
  avgExecutionTime?: number // ms
}

export interface SelectionContext {
  intentId: string
  intentText: string
  requiredCapabilities: string[]
  constraints: string[]
  userPreferences?: string[]
}

export interface SelectionResult {
  id: string
  timestamp: string
  context: SelectionContext
  candidates: ToolCandidate[]
  selectedTool?: ToolCandidate
  selectionReason: string
  confidence: number // 0-1
  alternateTools: string[] // tool IDs
}

export interface SelectionStats {
  totalCandidates: number
  selectedCount: number
  rejectedCount: number
  avgScore: number
  topCategory: SelectionToolCategory | null
}

// ==================== Helper Functions ====================

const getCategoryColor = (category: SelectionToolCategory) => {
  switch (category) {
    case 'core':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'plugin':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'mcp':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'builtin':
      return 'bg-green-100 text-green-700 border-green-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const getStatusIcon = (status: SelectionStatus) => {
  switch (status) {
    case 'selected':
      return CheckCircle2
    case 'rejected':
      return XCircle
    case 'fallback':
      return AlertTriangle
    default:
      return Minus
  }
}

const getStatusColor = (status: SelectionStatus) => {
  switch (status) {
    case 'selected':
      return 'text-green-600'
    case 'rejected':
      return 'text-red-500'
    case 'fallback':
      return 'text-amber-500'
    default:
      return 'text-slate-400'
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-500'
}

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-50 border-green-200'
  if (score >= 60) return 'bg-blue-50 border-blue-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

// ==================== Sub Components ====================

interface ToolCardProps {
  tool: ToolCandidate
  isSelected: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onSelect?: () => void
}

function ToolCard({ tool, isSelected, isExpanded, onToggleExpand, onSelect }: ToolCardProps) {
  const StatusIcon = getStatusIcon(tool.status)
  
  return (
    <div
      className={cn(
        'border rounded-lg p-4 transition-all',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200',
        getScoreBg(tool.score)
      )}
      style={isSelected ? { borderColor: 'var(--ao-button.background)' } : undefined}
    >
      <div className="flex items-start gap-3">
        {/* 排名和分数 */}
        <div className="flex flex-col items-center">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            tool.rank === 1 ? 'bg-amber-100 text-amber-700' :
            tool.rank === 2 ? 'bg-slate-200 text-slate-600' :
            tool.rank === 3 ? 'bg-orange-100 text-orange-700' :
            'bg-slate-100 text-slate-500'
          )}>
            {tool.rank <= 3 ? <Star className="w-4 h-4" /> : tool.rank}
          </div>
          <div className={cn('text-xs font-medium mt-1', getScoreColor(tool.score))}>
            {tool.score}分
          </div>
        </div>
        
        {/* 工具信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-800">{tool.name}</h4>
            <Badge variant="outline" className={cn('text-xs', getCategoryColor(tool.category))}>
              {tool.category}
            </Badge>
            <div className={getStatusColor(tool.status)}>
              <StatusIcon className="w-4 h-4" />
            </div>
          </div>
          
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{tool.description}</p>
          
          {/* 能力标签 */}
          <div className="flex flex-wrap gap-1 mt-2">
            {tool.capabilities.slice(0, 3).map((cap, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {cap}
              </Badge>
            ))}
            {tool.capabilities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tool.capabilities.length - 3}
              </Badge>
            )}
          </div>
          
          {/* 选择/拒绝理由 */}
          {tool.selectionReason && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
              <span className="font-medium">选择理由: </span>
              {tool.selectionReason}
            </div>
          )}
          {tool.rejectionReason && (
            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
              <span className="font-medium">拒绝理由: </span>
              {tool.rejectionReason}
            </div>
          )}
          
          {/* 展开详情 */}
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            style={{ color: 'var(--ao-button.background)' }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {isExpanded ? '收起详情' : '查看详情'}
          </button>
          
          {isExpanded && (
            <div className="mt-3 space-y-3 p-3 bg-white rounded border border-slate-200">
              {/* 能力详情 */}
              <div>
                <h5 className="text-xs font-medium text-slate-700 mb-1">支持能力</h5>
                <div className="flex flex-wrap gap-1">
                  {tool.capabilities.map((cap, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* 限制 */}
              {tool.limitations.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-slate-700 mb-1">已知限制</h5>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {tool.limitations.map((lim, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        {lim}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 性能指标 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-sm font-medium text-slate-800">
                    {tool.usageCount ?? '-'}
                  </div>
                  <div className="text-xs text-slate-500">调用次数</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-slate-800">
                    {tool.successRate !== undefined ? `${tool.successRate}%` : '-'}
                  </div>
                  <div className="text-xs text-slate-500">成功率</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-slate-800">
                    {tool.avgExecutionTime !== undefined ? `${tool.avgExecutionTime}ms` : '-'}
                  </div>
                  <div className="text-xs text-slate-500">平均耗时</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 选择按钮 */}
        {tool.status === 'candidate' && onSelect && (
          <Button
            size="sm"
            onClick={onSelect}
            variant="outline"
            className="flex-shrink-0"
          >
            选择
          </Button>
        )}
      </div>
    </div>
  )
}

// ==================== Main Component ====================

interface ToolSelectionProps {
  result?: SelectionResult
  onToolSelect?: (toolId: string) => void
  className?: string
}

export function ToolSelection({
  result: externalResult,
  onToolSelect,
  className,
}: ToolSelectionProps) {
  const [activeTab, setActiveTab] = useState('ranking')
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<SelectionToolCategory | 'all'>('all')
  
  // 示例选择结果数据
  const defaultResult: SelectionResult = useMemo(() => ({
    id: 'sel-001',
    timestamp: '2026-03-24 10:30:00',
    context: {
      intentId: 'intent-001',
      intentText: '从数据库获取销售数据并生成报告',
      requiredCapabilities: ['database_query', 'data_processing', 'file_generation'],
      constraints: ['read_only', 'timeout_60s'],
      userPreferences: ['prefer_cached', 'fast_execution'],
    },
    selectionReason: '工具综合得分最高，支持所有必需能力，历史成功率95%',
    confidence: 0.92,
    selectedTool: undefined,
    alternateTools: ['tool-002', 'tool-003'],
    candidates: [
      {
        id: 'tool-001',
        name: 'DatabaseQueryTool',
        description: '高性能数据库查询工具，支持多种数据库类型和复杂查询',
        category: 'core',
        score: 92,
        rank: 1,
        status: 'selected',
        capabilities: ['database_query', 'sql_injection_protection', 'connection_pooling', 'result_caching'],
        limitations: ['单次查询最大10000行', '不支持事务操作'],
        selectionReason: '综合得分最高，完全匹配需求，性能优秀',
        usageCount: 1520,
        successRate: 95,
        avgExecutionTime: 120,
      },
      {
        id: 'tool-002',
        name: 'CachedDataAccessor',
        description: '基于缓存的快速数据访问工具，适合重复查询场景',
        category: 'plugin',
        score: 78,
        rank: 2,
        status: 'candidate',
        capabilities: ['database_query', 'result_caching', 'auto_refresh'],
        limitations: ['依赖缓存预热', '数据可能延迟'],
        usageCount: 856,
        successRate: 98,
        avgExecutionTime: 15,
      },
      {
        id: 'tool-003',
        name: 'RawSQLExecutor',
        description: '原始SQL执行器，提供最大灵活性但无保护机制',
        category: 'mcp',
        score: 65,
        rank: 3,
        status: 'rejected',
        capabilities: ['database_query', 'transaction_support'],
        limitations: ['无SQL注入保护', '需要手动管理连接', '风险较高'],
        rejectionReason: '安全风险，缺少注入保护机制',
        usageCount: 234,
        successRate: 87,
        avgExecutionTime: 95,
      },
      {
        id: 'tool-004',
        name: 'ReadonlyDBClient',
        description: '只读数据库客户端，自动强制只读模式',
        category: 'builtin',
        score: 55,
        rank: 4,
        status: 'fallback',
        capabilities: ['database_query', 'read_only'],
        limitations: ['只支持简单查询', '性能较低'],
        usageCount: 120,
        successRate: 100,
        avgExecutionTime: 250,
      },
    ],
  }), [])
  
  const result = externalResult || defaultResult
  
  // 计算统计信息
  const stats: SelectionStats = useMemo(() => {
    const totalCandidates = result.candidates.length
    const selectedCount = result.candidates.filter(t => t.status === 'selected').length
    const rejectedCount = result.candidates.filter(t => t.status === 'rejected').length
    const avgScore = result.candidates.reduce((sum, t) => sum + t.score, 0) / totalCandidates
    
    // 找出最常见的类别
    const categoryCounts = result.candidates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1
      return acc
    }, {} as Record<SelectionToolCategory, number>)
    
    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as SelectionToolCategory | undefined
    
    return {
      totalCandidates,
      selectedCount,
      rejectedCount,
      avgScore: Math.round(avgScore),
      topCategory: topCategory || null,
    }
  }, [result.candidates])
  
  // 过滤后的候选工具
  const filteredCandidates = useMemo(() => {
    if (categoryFilter === 'all') return result.candidates
    return result.candidates.filter(t => t.category === categoryFilter)
  }, [result.candidates, categoryFilter])
  
  const toggleToolExpand = (toolId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev)
      if (next.has(toolId)) {
        next.delete(toolId)
      } else {
        next.add(toolId)
      }
      return next
    })
  }
  
  return (
    <div className={cn('bg-white rounded-lg', className)}>
      {/* 标签页 */}
      <div className="border-b border-slate-200">
        <div className="flex">
          {['ranking', 'context', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
              style={activeTab === tab ? { borderColor: 'var(--ao-button.background)', color: 'var(--ao-button.background)' } : undefined}
            >
              {tab === 'ranking' && '工具排名'}
              {tab === 'context' && '选择上下文'}
              {tab === 'audit' && '选择审计'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 头部信息 */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">工具选择决策</h3>
            <p className="text-sm text-slate-600 mt-1">
              意图: {result.context.intentText}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              置信度: {(result.confidence * 100).toFixed(0)}%
            </Badge>
            <Badge variant="outline" className="text-xs bg-slate-50">
              {result.timestamp}
            </Badge>
          </div>
        </div>
        
        {/* 统计信息 */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-slate-800">{stats.totalCandidates}</div>
            <div className="text-xs text-slate-500">候选工具</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.selectedCount}</div>
            <div className="text-xs text-slate-500">已选择</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejectedCount}</div>
            <div className="text-xs text-slate-500">已拒绝</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.avgScore}</div>
            <div className="text-xs text-slate-500">平均得分</div>
          </div>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'ranking' && (
          <div className="space-y-4">
            {/* 类别过滤 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">类别筛选:</span>
              {(['all', 'core', 'plugin', 'mcp', 'builtin'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full transition-colors',
                    categoryFilter === cat
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                  style={categoryFilter === cat ? { backgroundColor: 'var(--ao-button.background)' } : undefined}
                >
                  {cat === 'all' ? '全部' : cat}
                </button>
              ))}
            </div>
            
            {/* 工具列表 */}
            <div className="space-y-3">
              {filteredCandidates.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  isSelected={tool.status === 'selected'}
                  isExpanded={expandedTools.has(tool.id)}
                  onToggleExpand={() => toggleToolExpand(tool.id)}
                  onSelect={() => onToolSelect?.(tool.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'context' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-800 mb-3">选择上下文</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500">意图ID</label>
                  <p className="text-sm text-slate-800 font-mono">{result.context.intentId}</p>
                </div>
                
                <div>
                  <label className="text-xs text-slate-500">意图描述</label>
                  <p className="text-sm text-slate-800">{result.context.intentText}</p>
                </div>
                
                <div>
                  <label className="text-xs text-slate-500">必需能力</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.context.requiredCapabilities.map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-slate-500">约束条件</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.context.constraints.map((c, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {result.context.userPreferences && (
                  <div>
                    <label className="text-xs text-slate-500">用户偏好</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.context.userPreferences.map((p, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-blue-50">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">选择理由</h4>
              <p className="text-sm text-green-700">{result.selectionReason}</p>
            </div>
            
            {result.alternateTools.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">备选工具</h4>
                <div className="flex flex-wrap gap-1">
                  {result.alternateTools.map((id, idx) => {
                    const tool = result.candidates.find(t => t.id === id)
                    return (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tool?.name || id}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-slate-600" />
                <h4 className="text-sm font-medium text-slate-800">选择审计日志</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600">选择ID</span>
                  <span className="text-sm font-mono text-slate-800">{result.id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600">时间戳</span>
                  <span className="text-sm text-slate-800">{result.timestamp}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600">置信度</span>
                  <span className="text-sm text-slate-800">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600">候选数量</span>
                  <span className="text-sm text-slate-800">{result.candidates.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600">最终选择</span>
                  <span className="text-sm text-slate-800">
                    {result.candidates.find(t => t.status === 'selected')?.name || '未选择'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 得分分布 */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-800 mb-3">得分分布</h4>
              <div className="space-y-2">
                {[90, 80, 70, 60, 50].map((threshold) => {
                  const count = result.candidates.filter(t => t.score >= threshold && t.score < threshold + 10).length
                  const percentage = result.candidates.length > 0 
                    ? (count / result.candidates.length) * 100 
                    : 0
                  
                  return (
                    <div key={threshold} className="flex items-center gap-2">
                      <span className="w-16 text-xs text-slate-500">{threshold}-{threshold + 9}</span>
                      <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: 'var(--ao-button.background)',
                          }}
                        />
                      </div>
                      <span className="w-8 text-xs text-slate-500">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ToolSelection
