/**
 * TaskPlanning - 任务规划组件
 * Story 7.3 - 任务规划
 * 
 * 支持功能：
 * - 多步骤计划生成
 * - 步骤依赖和排序
 * - 计划可视化展示
 * - 执行前预览
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - FR410: 生成多步骤计划
 * - FR411: 捕获依赖和排序
 * - FR414: 呈现计划输出
 */

import { useState, useMemo } from 'react'
import {
  GitBranch,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Layers,
  Target,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ==================== Types ====================

export type PlanStepStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped'

export type PlanStepType = 'analysis' | 'action' | 'verification' | 'decision' | 'subtask' | 'output'

export interface PlanStep {
  id: string
  name: string
  description: string
  type: PlanStepType
  status: PlanStepStatus
  dependencies: string[] // step IDs this step depends on
  expectedOutput?: string
  actualOutput?: string
  estimatedDuration?: number // in seconds
  startedAt?: string
  completedAt?: string
  error?: string
  subSteps?: PlanStep[]
}

export interface TaskPlan {
  id: string
  title: string
  description: string
  intent: string
  confidence: number // 0-1
  steps: PlanStep[]
  createdAt: string
  status: 'draft' | 'ready' | 'executing' | 'completed' | 'failed'
  currentStepId?: string
}

export interface PlanStats {
  totalSteps: number
  completedSteps: number
  failedSteps: number
  pendingSteps: number
  estimatedTotalDuration: number
  progress: number // 0-100
}

// ==================== Helper Functions ====================

const getStepIcon = (type: PlanStepType) => {
  switch (type) {
    case 'analysis':
      return Target
    case 'action':
      return Zap
    case 'verification':
      return CheckCircle2
    case 'decision':
      return GitBranch
    case 'subtask':
      return Layers
    case 'output':
      return ArrowRight
    default:
      return ChevronRight
  }
}

const getStatusColor = (status: PlanStepStatus) => {
  switch (status) {
    case 'pending':
      return 'text-slate-400'
    case 'ready':
      return 'text-blue-500'
    case 'running':
      return 'text-amber-500'
    case 'completed':
      return 'text-green-500'
    case 'failed':
      return 'text-red-500'
    case 'skipped':
      return 'text-slate-300'
    default:
      return 'text-slate-400'
  }
}

const getStatusBg = (status: PlanStepStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-slate-50 border-slate-200'
    case 'ready':
      return 'bg-blue-50 border-blue-200'
    case 'running':
      return 'bg-amber-50 border-amber-200'
    case 'completed':
      return 'bg-green-50 border-green-200'
    case 'failed':
      return 'bg-red-50 border-red-200'
    case 'skipped':
      return 'bg-slate-100 border-slate-200'
    default:
      return 'bg-slate-50 border-slate-200'
  }
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
}

// ==================== Sub Components ====================

interface StepCardProps {
  step: PlanStep
  allSteps: PlanStep[]
  isExpanded: boolean
  onToggleExpand: () => void
}

function StepCard({ step, allSteps, isExpanded, onToggleExpand }: StepCardProps) {
  const StepIcon = getStepIcon(step.type)
  const dependencySteps = allSteps.filter(s => step.dependencies.includes(s.id))
  const hasSubSteps = step.subSteps && step.subSteps.length > 0
  
  return (
    <div className={cn(
      'border rounded-lg p-4 transition-all',
      getStatusBg(step.status)
    )}>
      <div className="flex items-start gap-3">
        {/* 状态图标 */}
        <div className={cn('mt-0.5', getStatusColor(step.status))}>
          {step.status === 'running' ? (
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : step.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : step.status === 'failed' ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <StepIcon className="w-5 h-5" />
          )}
        </div>
        
        {/* 步骤内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-800">{step.name}</h4>
            <Badge variant="outline" className="text-xs">
              {step.type}
            </Badge>
          </div>
          
          <p className="text-sm text-slate-600 mt-1">{step.description}</p>
          
          {/* 依赖关系 */}
          {dependencySteps.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <span>依赖:</span>
              {dependencySteps.map((dep, idx) => (
                <span key={dep.id}>
                  {dep.name}
                  {idx < dependencySteps.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
          
          {/* 预期输出 */}
          {step.expectedOutput && (
            <div className="mt-2 text-xs text-slate-500">
              <span className="font-medium">预期输出: </span>
              {step.expectedOutput}
            </div>
          )}
          
          {/* 错误信息 */}
          {step.error && (
            <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
              {step.error}
            </div>
          )}
          
          {/* 子步骤 */}
          {hasSubSteps && (
            <div className="mt-3">
              <button
                onClick={onToggleExpand}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {step.subSteps!.length} 个子步骤
              </button>
              
              {isExpanded && (
                <div className="mt-2 space-y-2 pl-4 border-l-2 border-slate-200">
                  {step.subSteps!.map((subStep) => (
                    <div
                      key={subStep.id}
                      className={cn(
                        'p-2 rounded border text-sm',
                        getStatusBg(subStep.status)
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={getStatusColor(subStep.status)}>
                          {subStep.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <StepIcon className="w-4 h-4" />
                          )}
                        </span>
                        <span className="font-medium">{subStep.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 时间信息 */}
          {(step.startedAt || step.estimatedDuration) && (
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {step.status === 'running' && step.startedAt && (
                <span>开始于 {step.startedAt}</span>
              )}
              {step.status === 'completed' && step.completedAt && (
                <span>完成于 {step.completedAt}</span>
              )}
              {step.estimatedDuration && step.status === 'pending' && (
                <span>预计 {formatDuration(step.estimatedDuration)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

interface TaskPlanningProps {
  plan?: TaskPlan
  onExecute?: () => void
  onPause?: () => void
  onEdit?: () => void
  className?: string
}

export function TaskPlanning({
  plan: externalPlan,
  onExecute,
  onPause,
  onEdit,
  className,
}: TaskPlanningProps) {
  const [activeTab, setActiveTab] = useState('plan')
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  
  // 示例计划数据
  const defaultPlan: TaskPlan = useMemo(() => ({
    id: 'plan-001',
    title: '生成销售报告',
    description: '从销售数据生成月度销售报告，包含图表和分析',
    intent: '生成2026年3月销售报告',
    confidence: 0.92,
    status: 'draft',
    createdAt: '2026-03-24 10:30:00',
    steps: [
      {
        id: 'step-1',
        name: '数据收集',
        description: '从数据库获取2026年3月销售数据',
        type: 'action',
        status: 'pending',
        dependencies: [],
        expectedOutput: '销售数据集 (JSON格式)',
        estimatedDuration: 30,
      },
      {
        id: 'step-2',
        name: '数据清洗',
        description: '清洗和验证销售数据',
        type: 'action',
        status: 'pending',
        dependencies: ['step-1'],
        expectedOutput: '清洗后的数据集',
        estimatedDuration: 20,
      },
      {
        id: 'step-3',
        name: '数据分析',
        description: '计算关键指标和趋势',
        type: 'analysis',
        status: 'pending',
        dependencies: ['step-2'],
        expectedOutput: '分析结果和统计数据',
        estimatedDuration: 45,
        subSteps: [
          {
            id: 'step-3-1',
            name: '计算总销售额',
            description: '汇总所有销售记录',
            type: 'action',
            status: 'pending',
            dependencies: [],
          },
          {
            id: 'step-3-2',
            name: '计算增长率',
            description: '与上月对比计算增长',
            type: 'action',
            status: 'pending',
            dependencies: ['step-3-1'],
          },
        ],
      },
      {
        id: 'step-4',
        name: '图表生成',
        description: '生成可视化图表',
        type: 'output',
        status: 'pending',
        dependencies: ['step-3'],
        expectedOutput: '销售趋势图、产品分布图',
        estimatedDuration: 30,
      },
      {
        id: 'step-5',
        name: '报告生成',
        description: '整合数据和图表生成PDF报告',
        type: 'output',
        status: 'pending',
        dependencies: ['step-4'],
        expectedOutput: '完整的PDF报告文件',
        estimatedDuration: 15,
      },
      {
        id: 'step-6',
        name: '质量验证',
        description: '验证报告完整性和准确性',
        type: 'verification',
        status: 'pending',
        dependencies: ['step-5'],
        expectedOutput: '验证通过标记',
        estimatedDuration: 10,
      },
    ],
  }), [])
  
  const plan = externalPlan || defaultPlan
  
  // 计算统计信息
  const stats: PlanStats = useMemo(() => {
    const totalSteps = plan.steps.length
    const completedSteps = plan.steps.filter(s => s.status === 'completed').length
    const failedSteps = plan.steps.filter(s => s.status === 'failed').length
    const pendingSteps = plan.steps.filter(s => s.status === 'pending').length
    const estimatedTotalDuration = plan.steps.reduce((sum, s) => sum + (s.estimatedDuration || 0), 0)
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    
    return {
      totalSteps,
      completedSteps,
      failedSteps,
      pendingSteps,
      estimatedTotalDuration,
      progress,
    }
  }, [plan.steps])
  
  const toggleStepExpand = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }
  
  return (
    <div className={cn('bg-white rounded-lg', className)}>
      {/* 标签页 */}
      <div className="border-b border-slate-200">
        <div className="flex">
          {['plan', 'dependencies', 'timeline'].map((tab) => (
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
              {tab === 'plan' && '计划视图'}
              {tab === 'dependencies' && '依赖关系'}
              {tab === 'timeline' && '时间线'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 计划头部 */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{plan.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              置信度: {(plan.confidence * 100).toFixed(0)}%
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                plan.status === 'completed' && 'bg-green-50 text-green-700 border-green-200',
                plan.status === 'failed' && 'bg-red-50 text-red-700 border-red-200',
                plan.status === 'executing' && 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              {plan.status}
            </Badge>
          </div>
        </div>
        
        {/* 进度条 */}
        {plan.status === 'executing' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>执行进度</span>
              <span>{stats.completedSteps}/{stats.totalSteps} 步骤</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${stats.progress}%`,
                  backgroundColor: '#1E3A5F',
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'plan' && (
          <div className="space-y-4">
            {/* 统计信息 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-800">{stats.totalSteps}</div>
                <div className="text-xs text-slate-500">总步骤</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedSteps}</div>
                <div className="text-xs text-slate-500">已完成</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.pendingSteps}</div>
                <div className="text-xs text-slate-500">待执行</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(stats.estimatedTotalDuration)}
                </div>
                <div className="text-xs text-slate-500">预计时间</div>
              </div>
            </div>
            
            {/* 步骤列表 */}
            <div className="space-y-3">
              {plan.steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      {index + 1}
                    </div>
                    {index < plan.steps.length - 1 && (
                      <div className="w-px h-full bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <StepCard
                      step={step}
                      allSteps={plan.steps}
                      isExpanded={expandedSteps.has(step.id)}
                      onToggleExpand={() => toggleStepExpand(step.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
              {plan.status === 'draft' && (
                <Button
                  onClick={onExecute}
                  className="gap-2"
                  style={{ backgroundColor: '#1E3A5F' }}
                >
                  <Play className="w-4 h-4" />
                  开始执行
                </Button>
              )}
              {plan.status === 'executing' && (
                <Button
                  onClick={onPause}
                  variant="outline"
                  className="gap-2"
                >
                  <Pause className="w-4 h-4" />
                  暂停执行
                </Button>
              )}
              <Button
                onClick={onEdit}
                variant="outline"
                className="gap-2"
              >
                编辑计划
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === 'dependencies' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              步骤之间的依赖关系图，显示执行顺序和前置条件
            </div>
            
            {/* 依赖关系可视化 */}
            <div className="space-y-3">
              {plan.steps.map((step) => {
                const dependentSteps = plan.steps.filter(s => s.dependencies.includes(step.id))
                
                return (
                  <div key={step.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-slate-800">{step.name}</span>
                      <Badge variant="outline" className="text-xs">{step.type}</Badge>
                    </div>
                    
                    {step.dependencies.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ArrowRight className="w-3 h-3" />
                        <span>依赖: </span>
                        {step.dependencies.map((depId) => {
                          const depStep = plan.steps.find(s => s.id === depId)
                          return (
                            <Badge key={depId} variant="secondary" className="text-xs">
                              {depStep?.name || depId}
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    
                    {dependentSteps.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>被依赖: </span>
                        {dependentSteps.map((ds) => (
                          <Badge key={ds.id} variant="secondary" className="text-xs">
                            {ds.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {step.dependencies.length === 0 && dependentSteps.length === 0 && (
                      <span className="text-xs text-slate-400">无依赖关系</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              计划执行的时间线和预估时间
            </div>
            
            {/* 时间线视图 */}
            <div className="relative">
              {plan.steps.map((step, index) => {
                const StepIcon = getStepIcon(step.type)
                const startTime = plan.steps
                  .slice(0, index)
                  .reduce((sum, s) => sum + (s.estimatedDuration || 0), 0)
                
                return (
                  <div key={step.id} className="flex items-start gap-4 pb-4">
                    {/* 时间点 */}
                    <div className="w-16 text-right">
                      <span className="text-xs text-slate-500">
                        {formatDuration(startTime)}
                      </span>
                    </div>
                    
                    {/* 节点 */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                        step.status === 'running' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-400'
                      )}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      {index < plan.steps.length - 1 && (
                        <div className="w-px h-8 bg-slate-200 mt-1" />
                      )}
                    </div>
                    
                    {/* 步骤信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{step.name}</span>
                        <span className="text-xs text-slate-400">
                          ~{step.estimatedDuration}s
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                )
              })}
              
              {/* 总时间 */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <div className="w-16 text-right">
                  <span className="text-xs text-slate-500">总计</span>
                </div>
                <div className="w-8" />
                <div className="flex-1">
                  <span className="font-medium text-slate-800">
                    预计总时间: {formatDuration(stats.estimatedTotalDuration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskPlanning
