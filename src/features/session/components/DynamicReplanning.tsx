/**
 * DynamicReplanning - 动态重规划组件
 * Story 7.5 - 动态重规划
 * 
 * 支持功能：
 * - 计划偏离检测
 * - 有界重规划策略
 * - 变更原因解释
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - FR413: 检测计划偏离
 * - FR415: 有界重规划
 */

import { useState, useMemo } from 'react'
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  History,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ==================== Types ====================

export type DriftType = 'output_mismatch' | 'step_failure' | 'timeout' | 'resource_unavailable' | 'dependency_change' | 'user_request'

export type ReplanChangeType = 'add_step' | 'remove_step' | 'modify_step' | 'reorder_steps' | 'replace_step'

export type ReplanStatus = 'pending' | 'analyzing' | 'approved' | 'rejected' | 'executing' | 'completed'

export interface PlanChange {
  id: string
  type: ReplanChangeType
  description: string
  reason: string
  impact: 'low' | 'medium' | 'high'
  affectedSteps: string[]
  before?: string
  after?: string
  timestamp: string
}

export interface DriftIndicator {
  id: string
  stepId: string
  type: DriftType
  description: string
  detectedAt: string
  severity: 'info' | 'warning' | 'error'
  suggestedActions: string[]
}

export interface ReplanEvent {
  id: string
  timestamp: string
  trigger: string
  status: ReplanStatus
  changes: PlanChange[]
  driftIndicators: DriftIndicator[]
  policyLimits: {
    maxReplans: number
    currentCount: number
    remaining: number
  }
  userApproved?: boolean
  executionTime?: number
}

export interface ReplanHistory {
  events: ReplanEvent[]
  totalCount: number
  successRate: number
  avgExecutionTime: number
}

// ==================== Helper Functions ====================

const getDriftTypeColor = (type: DriftType) => {
  switch (type) {
    case 'output_mismatch':
      return 'bg-amber-100 text-amber-700'
    case 'step_failure':
      return 'bg-red-100 text-red-700'
    case 'timeout':
      return 'bg-orange-100 text-orange-700'
    case 'resource_unavailable':
      return 'bg-purple-100 text-purple-700'
    case 'dependency_change':
      return 'bg-blue-100 text-blue-700'
    case 'user_request':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getSeverityColor = (severity: 'info' | 'warning' | 'error') => {
  switch (severity) {
    case 'info':
      return 'text-blue-500'
    case 'warning':
      return 'text-amber-500'
    case 'error':
      return 'text-red-500'
  }
}

const getChangeTypeColor = (type: ReplanChangeType) => {
  switch (type) {
    case 'add_step':
      return 'bg-green-100 text-green-700'
    case 'remove_step':
      return 'bg-red-100 text-red-700'
    case 'modify_step':
      return 'bg-blue-100 text-blue-700'
    case 'reorder_steps':
      return 'bg-purple-100 text-purple-700'
    case 'replace_step':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getStatusColor = (status: ReplanStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-slate-100 text-slate-700'
    case 'analyzing':
      return 'bg-blue-100 text-blue-700'
    case 'approved':
      return 'bg-green-100 text-green-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    case 'executing':
      return 'bg-amber-100 text-amber-700'
    case 'completed':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getChangeTypeIcon = (type: ReplanChangeType) => {
  switch (type) {
    case 'add_step':
      return TrendingUp
    case 'remove_step':
      return TrendingDown
    case 'modify_step':
      return RefreshCw
    case 'reorder_steps':
      return ArrowRight
    case 'replace_step':
      return Zap
    default:
      return ArrowRight
  }
}

const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
  switch (impact) {
    case 'low':
      return 'text-green-600 bg-green-50'
    case 'medium':
      return 'text-amber-600 bg-amber-50'
    case 'high':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-slate-600 bg-slate-50'
  }
}

// ==================== Sub Components ====================

interface ChangeCardProps {
  change: PlanChange
  isExpanded: boolean
  onToggleExpand: () => void
}

function ChangeCard({ change, isExpanded, onToggleExpand }: ChangeCardProps) {
  const ChangeIcon = getChangeTypeIcon(change.type)
  
  return (
    <div className={cn(
      'border rounded-lg p-3 transition-all',
      getChangeTypeColor(change.type).replace('text-', 'border-')
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <ChangeIcon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-800">{change.description}</span>
            <Badge variant="outline" className={cn('text-xs', getChangeTypeColor(change.type))}>
              {change.type}
            </Badge>
            <Badge variant="outline" className={cn('text-xs', getImpactColor(change.impact))}>
              {change.impact}
            </Badge>
          </div>
          
          <p className="text-xs text-slate-500 mt-1">{change.reason}</p>
          
          {isExpanded && (
            <div className="mt-3 space-y-2">
              {change.before && (
                <div>
                  <span className="text-xs text-slate-500">修改前:</span>
                  <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 overflow-x-auto">
                    {change.before}
                  </pre>
                </div>
              )}
              {change.after && (
                <div>
                  <span className="text-xs text-slate-500">修改后:</span>
                  <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 overflow-x-auto">
                    {change.after}
                  </pre>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-slate-500">影响步骤:</span>
                {change.affectedSteps.map((stepId, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {stepId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            style={{ color: '#1E3A5F' }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            {isExpanded ? '收起' : '展开详情'}
          </button>
        </div>
        
        <div className="text-xs text-slate-400">
          {change.timestamp}
        </div>
      </div>
    </div>
  )
}

interface DriftCardProps {
  drift: DriftIndicator
}

function DriftCard({ drift }: DriftCardProps) {
  return (
    <div className={cn(
      'border rounded-lg p-3',
      drift.severity === 'error' ? 'border-red-200 bg-red-50' :
      drift.severity === 'warning' ? 'border-amber-200 bg-amber-50' :
      'border-blue-200 bg-blue-50'
    )}>
      <div className="flex items-start gap-3">
        <div className={getSeverityColor(drift.severity)}>
          {drift.severity === 'error' ? (
            <XCircle className="w-4 h-4" />
          ) : drift.severity === 'warning' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', getDriftTypeColor(drift.type))}>
              {drift.type}
            </Badge>
            <span className="text-xs text-slate-500">步骤: {drift.stepId}</span>
          </div>
          <p className="text-sm text-slate-700 mt-1">{drift.description}</p>
          
          {drift.suggestedActions.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-slate-500">建议操作:</span>
              <ul className="text-xs text-slate-600 mt-1 space-y-1">
                {drift.suggestedActions.map((action, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <span className="text-xs text-slate-400">{drift.detectedAt}</span>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

interface DynamicReplanningProps {
  currentEvent?: ReplanEvent
  history?: ReplanHistory
  onApprove?: () => void
  onReject?: () => void
  className?: string
}

export function DynamicReplanning({
  currentEvent: externalCurrentEvent,
  history: externalHistory,
  onApprove,
  onReject,
  className,
}: DynamicReplanningProps) {
  const [activeTab, setActiveTab] = useState('current')
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set())
  
  // 示例数据
  const defaultCurrentEvent: ReplanEvent = useMemo(() => ({
    id: 'replan-001',
    timestamp: '2026-03-24 10:45:00',
    trigger: '步骤执行失败',
    status: 'pending',
    changes: [
      {
        id: 'change-1',
        type: 'modify_step',
        description: '修改数据分析步骤',
        reason: '原步骤超时，需增加超时处理逻辑',
        impact: 'medium',
        affectedSteps: ['step-3'],
        before: '执行数据分析 (timeout: 30s)',
        after: '执行数据分析 (timeout: 60s, retry: 2)',
        timestamp: '10:45:00',
      },
      {
        id: 'change-2',
        type: 'add_step',
        description: '添加错误处理步骤',
        reason: '增加重试机制，提高容错性',
        impact: 'low',
        affectedSteps: ['step-3', 'step-3-1'],
        after: 'IF 分析失败 THEN 执行备用方案',
        timestamp: '10:45:30',
      },
    ],
    driftIndicators: [
      {
        id: 'drift-1',
        stepId: 'step-3',
        type: 'timeout',
        description: '数据分析步骤执行超时 (30s)，可能数据量过大',
        detectedAt: '10:44:30',
        severity: 'warning',
        suggestedActions: [
          '增加超时时间',
          '分批处理数据',
          '使用备用简化方案',
        ],
      },
    ],
    policyLimits: {
      maxReplans: 3,
      currentCount: 2,
      remaining: 1,
    },
    userApproved: undefined,
  }), [])
  
  const defaultHistory: ReplanHistory = useMemo(() => ({
    events: [
      {
        id: 'replan-history-1',
        timestamp: '2026-03-24 09:30:00',
        trigger: '输出不匹配',
        status: 'completed',
        changes: [
          {
            id: 'hc-1',
            type: 'modify_step',
            description: '调整输出格式',
            reason: '实际输出缺少必要字段',
            impact: 'low',
            affectedSteps: ['step-5'],
            timestamp: '09:30:00',
          },
        ],
        driftIndicators: [],
        policyLimits: { maxReplans: 3, currentCount: 1, remaining: 2 },
        userApproved: true,
        executionTime: 150,
      },
    ],
    totalCount: 5,
    successRate: 80,
    avgExecutionTime: 180,
  }), [])
  
  const currentEvent = externalCurrentEvent || defaultCurrentEvent
  const history = externalHistory || defaultHistory
  
  const toggleChangeExpand = (changeId: string) => {
    setExpandedChanges(prev => {
      const next = new Set(prev)
      if (next.has(changeId)) {
        next.delete(changeId)
      } else {
        next.add(changeId)
      }
      return next
    })
  }
  
  return (
    <div className={cn('bg-white rounded-lg', className)}>
      {/* 标签页 */}
      <div className="border-b border-slate-200">
        <div className="flex">
          {['current', 'history', 'drift'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
              style={activeTab === tab ? { borderColor: '#1E3A5F', color: '#1E3A5F' } : undefined}
            >
              {tab === 'current' && '当前重规划'}
              {tab === 'history' && '历史记录'}
              {tab === 'drift' && '偏离检测'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 头部信息 */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">动态重规划</h3>
            <p className="text-sm text-slate-600 mt-1">
              当执行偏离预期时，自动或手动触发计划调整
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', getStatusColor(currentEvent.status))}>
              {currentEvent.status}
            </Badge>
            <Badge variant="outline" className="text-xs bg-slate-50">
              {currentEvent.timestamp}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'current' && currentEvent && (
          <div className="space-y-4">
            {/* 触发原因 */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-sm text-slate-800">触发原因</span>
              </div>
              <p className="text-sm text-slate-600">{currentEvent.trigger}</p>
            </div>
            
            {/* 计划变更 */}
            <div>
              <h4 className="text-sm font-medium text-slate-800 mb-3">
                计划变更 ({currentEvent.changes.length})
              </h4>
              <div className="space-y-3">
                {currentEvent.changes.map((change) => (
                  <ChangeCard
                    key={change.id}
                    change={change}
                    isExpanded={expandedChanges.has(change.id)}
                    onToggleExpand={() => toggleChangeExpand(change.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* 策略限制 */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-sm text-amber-800">策略限制</span>
              </div>
              <div className="text-sm text-amber-700">
                已使用 {currentEvent.policyLimits.currentCount}/{currentEvent.policyLimits.maxReplans} 次重规划机会，
                剩余 {currentEvent.policyLimits.remaining} 次。
              </div>
            </div>
            
            {/* 操作按钮 */}
            {(currentEvent.status === 'pending' || currentEvent.status === 'analyzing') && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={onApprove}
                  className="gap-2"
                  style={{ backgroundColor: '#1E3A5F' }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  批准重规划
                </Button>
                <Button
                  onClick={onReject}
                  variant="outline"
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  拒绝
                </Button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-800">{history.totalCount}</div>
                <div className="text-xs text-slate-500">总重规划次数</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{history.successRate}%</div>
                <div className="text-xs text-slate-500">成功率</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{history.avgExecutionTime}ms</div>
                <div className="text-xs text-slate-500">平均执行时间</div>
              </div>
            </div>
            
            {/* 历史列表 */}
            {history.events.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>暂无重规划历史记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.events.map((event) => (
                  <div key={event.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', getStatusColor(event.status))}>
                          {event.status}
                        </Badge>
                        <span className="text-sm text-slate-600">{event.trigger}</span>
                      </div>
                      <span className="text-xs text-slate-400">{event.timestamp}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>变更数: {event.changes.length}</span>
                      <span>执行时间: {event.executionTime}ms</span>
                      {event.userApproved !== undefined && (
                        <span className={event.userApproved ? 'text-green-600' : 'text-red-600'}>
                          {event.userApproved ? '已批准' : '已拒绝'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'drift' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              检测计划执行中的偏离情况，提供重规划建议
            </div>
            
            {currentEvent.driftIndicators.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p>未检测到计划偏离</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentEvent.driftIndicators.map((drift) => (
                  <DriftCard key={drift.id} drift={drift} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DynamicReplanning