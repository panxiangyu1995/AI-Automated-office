/**
 * LoopDetection.tsx
 * Story 7.6 - 循环检测
 * 
 * 功能：
 * - 实时循环检测：在Agent执行过程中检测重复模式
 * - 阈值配置：可配置的循环检测阈值
 * - 用户干预建议：当检测到循环时提供建议
 */

import React, { useState, useMemo } from 'react'
import { AlertTriangle, RefreshCw, AlertCircle, CheckCircle2, Clock, Settings, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义
// ============================================================================

export type LoopType = 
  | 'exact_repeat'      // 完全重复
  | 'similar_pattern'   // 相似模式
  | 'state_oscillation' // 状态震荡
  | 'step_cycle'        // 步骤循环
  | 'tool_retry'        // 工具重试

export type LoopSeverity = 'low' | 'medium' | 'high' | 'critical'

export type LoopStatus = 'detecting' | 'detected' | 'intervening' | 'resolved' | 'ignored'

export interface LoopPattern {
  id: string
  type: LoopType
  severity: LoopSeverity
  detectedAt: Date
  occurrences: number
  patternSequence: string[]
  firstOccurrence: Date
  lastOccurrence: Date
  affectedSteps: string[]
  estimatedWaste: number // 秒
}

export interface LoopDetectionConfig {
  enabled: boolean
  maxRepeats: number // 最大重复次数阈值
  similarityThreshold: number // 相似度阈值 (0-1)
  timeWindow: number // 检测时间窗口 (秒)
  autoIntervene: boolean // 自动干预
  interventionThreshold: number // 干预阈值
}

export interface InterventionSuggestion {
  id: string
  type: 'skip_step' | 'use_alternative' | 'request_input' | 'terminate' | 'reset_state'
  description: string
  impact: 'low' | 'medium' | 'high'
  recommended: boolean
}

export interface LoopDetectionState {
  status: LoopStatus
  currentPattern: LoopPattern | null
  config: LoopDetectionConfig
  history: LoopPattern[]
  suggestions: InterventionSuggestion[]
  detectionStats: {
    totalDetections: number
    resolvedLoops: number
    averageResolutionTime: number
    falsePositives: number
  }
}

// ============================================================================
// 组件定义
// ============================================================================

export function LoopDetection() {
  const [state, setState] = useState<LoopDetectionState>({
    status: 'detecting',
    currentPattern: null,
    config: {
      enabled: true,
      maxRepeats: 3,
      similarityThreshold: 0.8,
      timeWindow: 60,
      autoIntervene: true,
      interventionThreshold: 5
    },
    history: [
      {
        id: 'loop-1',
        type: 'tool_retry',
        severity: 'medium',
        detectedAt: new Date(Date.now() - 1000 * 60 * 5),
        occurrences: 4,
        patternSequence: ['fetch_data', 'parse_response', 'handle_error', 'fetch_data'],
        firstOccurrence: new Date(Date.now() - 1000 * 60 * 10),
        lastOccurrence: new Date(Date.now() - 1000 * 60 * 5),
        affectedSteps: ['step-3', 'step-4', 'step-5'],
        estimatedWaste: 45
      },
      {
        id: 'loop-2',
        type: 'state_oscillation',
        severity: 'high',
        detectedAt: new Date(Date.now() - 1000 * 60 * 30),
        occurrences: 6,
        patternSequence: ['validate', 'correct', 'validate', 'correct'],
        firstOccurrence: new Date(Date.now() - 1000 * 60 * 35),
        lastOccurrence: new Date(Date.now() - 1000 * 60 * 30),
        affectedSteps: ['step-7', 'step-8'],
        estimatedWaste: 120
      }
    ],
    suggestions: [
      {
        id: 'sug-1',
        type: 'use_alternative',
        description: '使用备用数据源替代当前API调用',
        impact: 'low',
        recommended: true
      },
      {
        id: 'sug-2',
        type: 'request_input',
        description: '请求用户提供额外参数以避免重复验证',
        impact: 'medium',
        recommended: false
      },
      {
        id: 'sug-3',
        type: 'terminate',
        description: '终止当前任务并报告失败原因',
        impact: 'high',
        recommended: false
      }
    ],
    detectionStats: {
      totalDetections: 12,
      resolvedLoops: 10,
      averageResolutionTime: 8.5,
      falsePositives: 1
    }
  })

  const [selectedTab, setSelectedTab] = useState<'current' | 'history' | 'config'>('current')

  // 获取严重程度颜色
  const getSeverityColor = (severity: LoopSeverity) => {
    switch (severity) {
      case 'low': return 'text-yellow-500'
      case 'medium': return 'text-orange-500'
      case 'high': return 'text-red-500'
      case 'critical': return 'text-red-600 bg-red-50'
      default: return 'text-gray-500'
    }
  }

  // 获取严重程度背景
  const getSeverityBg = (severity: LoopSeverity) => {
    switch (severity) {
      case 'low': return 'bg-yellow-50 border-yellow-200'
      case 'medium': return 'bg-orange-50 border-orange-200'
      case 'high': return 'bg-red-50 border-red-200'
      case 'critical': return 'bg-red-100 border-red-300'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  // 获取循环类型名称
  const getLoopTypeName = (type: LoopType) => {
    const names: Record<LoopType, string> = {
      exact_repeat: '完全重复',
      similar_pattern: '相似模式',
      state_oscillation: '状态震荡',
      step_cycle: '步骤循环',
      tool_retry: '工具重试'
    }
    return names[type]
  }

  // 获取干预建议类型名称
  const getSuggestionTypeName = (type: InterventionSuggestion['type']) => {
    const names: Record<InterventionSuggestion['type'], string> = {
      skip_step: '跳过步骤',
      use_alternative: '使用替代方案',
      request_input: '请求用户输入',
      terminate: '终止任务',
      reset_state: '重置状态'
    }
    return names[type]
  }

  // 计算检测进度
  const detectionProgress = useMemo(() => {
    if (!state.currentPattern) return 0
    return Math.min((state.currentPattern.occurrences / state.config.maxRepeats) * 100, 100)
  }, [state.currentPattern, state.config.maxRepeats])

  // 渲染当前检测状态
  const renderCurrentDetection = () => (
    <div className="space-y-4">
      {/* 检测状态指示器 */}
      <Card className={cn(
        "border-2",
        state.currentPattern ? getSeverityBg(state.currentPattern.severity) : 'bg-green-50 border-green-200'
      )}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            {state.currentPattern ? (
              <>
                <AlertTriangle className={cn("h-8 w-8", getSeverityColor(state.currentPattern.severity))} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">检测到循环模式</h3>
                  <p className="text-sm text-muted-foreground">
                    {getLoopTypeName(state.currentPattern.type)} - 已重复 {state.currentPattern.occurrences} 次
                  </p>
                </div>
                <Badge variant={state.currentPattern.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {state.currentPattern.severity.toUpperCase()}
                </Badge>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">无循环检测</h3>
                  <p className="text-sm text-muted-foreground">Agent 执行状态正常</p>
                </div>
                <Badge variant="outline" className="bg-green-100">正常</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 检测进度条 */}
      {state.currentPattern && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              循环检测进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>重复次数</span>
                <span className="font-medium">
                  {state.currentPattern.occurrences} / {state.config.maxRepeats}
                </span>
              </div>
              <Progress 
                value={detectionProgress} 
                className={cn(
                  "h-2",
                  detectionProgress >= 100 && "bg-red-200"
                )}
              />
              <p className="text-xs text-muted-foreground">
                当重复次数达到阈值时将触发自动干预
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 循环模式详情 */}
      {state.currentPattern && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">循环模式详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">类型：</span>
                <span className="font-medium ml-2">{getLoopTypeName(state.currentPattern.type)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">估计浪费：</span>
                <span className="font-medium ml-2">{state.currentPattern.estimatedWaste}秒</span>
              </div>
              <div>
                <span className="text-muted-foreground">首次出现：</span>
                <span className="font-medium ml-2">
                  {state.currentPattern.firstOccurrence.toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">最近出现：</span>
                <span className="font-medium ml-2">
                  {state.currentPattern.lastOccurrence.toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">循环序列：</p>
              <div className="flex flex-wrap gap-1">
                {state.currentPattern.patternSequence.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <Badge variant="outline" className="text-xs">
                      {step}
                    </Badge>
                    {idx < state.currentPattern!.patternSequence.length - 1 && (
                      <ChevronRight className="h-3 w-3 self-center text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 干预建议 */}
      {state.currentPattern && state.suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              干预建议
            </CardTitle>
            <CardDescription>选择适当的干预方式打破循环</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {state.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    suggestion.recommended 
                      ? "border-blue-300 bg-blue-50 hover:bg-blue-100" 
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getSuggestionTypeName(suggestion.type)}
                        </span>
                        {suggestion.recommended && (
                          <Badge variant="secondary" className="text-xs">推荐</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      执行
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // 渲染历史记录
  const renderHistory = () => (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold">{state.detectionStats.totalDetections}</div>
            <div className="text-xs text-muted-foreground">总检测次数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-green-500">{state.detectionStats.resolvedLoops}</div>
            <div className="text-xs text-muted-foreground">已解决</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold">{state.detectionStats.averageResolutionTime}s</div>
            <div className="text-xs text-muted-foreground">平均解决时间</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">{state.detectionStats.falsePositives}</div>
            <div className="text-xs text-muted-foreground">误报</div>
          </CardContent>
        </Card>
      </div>

      {/* 历史列表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">检测历史</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {state.history.map((pattern) => (
                <div
                  key={pattern.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    getSeverityBg(pattern.severity)
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-4 w-4", getSeverityColor(pattern.severity))} />
                      <span className="font-medium text-sm">
                        {getLoopTypeName(pattern.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {pattern.occurrences}次
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {pattern.detectedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pattern.patternSequence.slice(0, 4).map((step, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {step}
                      </Badge>
                    ))}
                    {pattern.patternSequence.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{pattern.patternSequence.length - 4}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>浪费 {pattern.estimatedWaste} 秒</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  // 渲染配置
  const renderConfig = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            检测配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 最大重复次数 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>最大重复次数阈值</span>
              <span className="font-medium">{state.config.maxRepeats}</span>
            </div>
            <Select
              value={state.config.maxRepeats.toString()}
              onValueChange={(val) => setState(prev => ({
                ...prev,
                config: { ...prev.config, maxRepeats: parseInt(val) }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 次</SelectItem>
                <SelectItem value="3">3 次</SelectItem>
                <SelectItem value="5">5 次</SelectItem>
                <SelectItem value="10">10 次</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              当同一模式重复出现超过此阈值时触发检测
            </p>
          </div>

          <Separator />

          {/* 相似度阈值 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>相似度阈值</span>
              <span className="font-medium">{(state.config.similarityThreshold * 100).toFixed(0)}%</span>
            </div>
            <Select
              value={(state.config.similarityThreshold * 100).toString()}
              onValueChange={(val) => setState(prev => ({
                ...prev,
                config: { ...prev.config, similarityThreshold: parseInt(val) / 100 }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              判断两个模式是否相似的最小相似度
            </p>
          </div>

          <Separator />

          {/* 检测时间窗口 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>检测时间窗口</span>
              <span className="font-medium">{state.config.timeWindow} 秒</span>
            </div>
            <Select
              value={state.config.timeWindow.toString()}
              onValueChange={(val) => setState(prev => ({
                ...prev,
                config: { ...prev.config, timeWindow: parseInt(val) }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 秒</SelectItem>
                <SelectItem value="60">60 秒</SelectItem>
                <SelectItem value="120">120 秒</SelectItem>
                <SelectItem value="300">300 秒</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              在此时间范围内检测循环模式
            </p>
          </div>

          <Separator />

          {/* 自动干预开关 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">自动干预</div>
              <div className="text-xs text-muted-foreground">
                当检测到循环时自动执行推荐干预
              </div>
            </div>
            <Button
              variant={state.config.autoIntervene ? "default" : "outline"}
              size="sm"
              onClick={() => setState(prev => ({
                ...prev,
                config: { ...prev.config, autoIntervene: !prev.config.autoIntervene }
              }))}
            >
              {state.config.autoIntervene ? '已启用' : '已禁用'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-4 p-4">
      {/* 标签页选择 */}
      <div className="flex gap-2">
        <Button
          variant={selectedTab === 'current' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTab('current')}
        >
          当前状态
        </Button>
        <Button
          variant={selectedTab === 'history' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTab('history')}
        >
          历史记录
        </Button>
        <Button
          variant={selectedTab === 'config' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTab('config')}
        >
          配置
        </Button>
      </div>

      {/* 内容区域 */}
      {selectedTab === 'current' && renderCurrentDetection()}
      {selectedTab === 'history' && renderHistory()}
      {selectedTab === 'config' && renderConfig()}
    </div>
  )
}

export default LoopDetection
