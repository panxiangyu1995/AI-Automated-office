/**
 * TaskBoundaryControl.tsx
 * Story 7.7 - 任务边界控制
 * 
 * 功能：
 * - 迭代边界：最大迭代次数限制
 * - 超时边界：任务执行超时限制
 * - 用户中断：支持用户手动中断入口点
 * - 边界终止原因：显示终止原因
 */

import { useState, useMemo } from 'react'
import { 
  AlertTriangle, 
  Clock, 
  StopCircle, 
  Shield, 
  Settings, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
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

export type BoundaryType = 
  | 'iteration'     // 迭代边界
  | 'timeout'       // 超时边界
  | 'user_abort'    // 用户中断
  | 'resource'      // 资源边界
  | 'policy'        // 策略边界

export type BoundaryStatus = 
  | 'active'        // 活跃
  | 'warning'       // 警告
  | 'exceeded'      // 超出
  | 'terminated'    // 已终止

export type TerminationReason = 
  | 'max_iterations_reached'
  | 'timeout_exceeded'
  | 'user_interruption'
  | 'resource_limit'
  | 'policy_violation'
  | 'error_threshold'

export interface IterationBoundary {
  maxIterations: number
  currentIteration: number
  warningThreshold: number // 警告阈值百分比
}

export interface TimeoutBoundary {
  maxDuration: number // 最大持续时间（秒）
  elapsedDuration: number // 已持续时间（秒）
  warningThreshold: number
}

export interface ResourceBoundary {
  maxMemoryMB: number
  currentMemoryMB: number
  maxApiCalls: number
  currentApiCalls: number
}

export interface BoundaryViolation {
  id: string
  type: BoundaryType
  timestamp: Date
  severity: 'warning' | 'error' | 'critical'
  message: string
  action: string
  resolution?: string
}

export interface TerminationRecord {
  id: string
  reason: TerminationReason
  timestamp: Date
  boundaryType: BoundaryType
  executionTime: number
  iterationsCompleted: number
  userMessage: string
  recoveryOptions: string[]
}

export interface TaskBoundaryConfig {
  // 迭代边界
  iteration: {
    enabled: boolean
    maxIterations: number
    warningThreshold: number
  }
  // 超时边界
  timeout: {
    enabled: boolean
    maxDuration: number
    warningThreshold: number
  }
  // 资源边界
  resource: {
    enabled: boolean
    maxMemoryMB: number
    maxApiCalls: number
  }
  // 用户中断
  userInterruption: {
    enabled: boolean
    requireConfirmation: boolean
    allowRollback: boolean
  }
}

export interface TaskBoundaryState {
  status: BoundaryStatus
  iteration: IterationBoundary
  timeout: TimeoutBoundary
  resource: ResourceBoundary
  config: TaskBoundaryConfig
  violations: BoundaryViolation[]
  terminationHistory: TerminationRecord[]
  canInterrupt: boolean
  isPaused: boolean
}

// ============================================================================
// 组件定义
// ============================================================================

export function TaskBoundaryControl() {
  const [state, setState] = useState<TaskBoundaryState>({
    status: 'active',
    iteration: {
      maxIterations: 100,
      currentIteration: 45,
      warningThreshold: 80
    },
    timeout: {
      maxDuration: 300, // 5分钟
      elapsedDuration: 135,
      warningThreshold: 80
    },
    resource: {
      maxMemoryMB: 512,
      currentMemoryMB: 256,
      maxApiCalls: 1000,
      currentApiCalls: 423
    },
    config: {
      iteration: {
        enabled: true,
        maxIterations: 100,
        warningThreshold: 80
      },
      timeout: {
        enabled: true,
        maxDuration: 300,
        warningThreshold: 80
      },
      resource: {
        enabled: true,
        maxMemoryMB: 512,
        maxApiCalls: 1000
      },
      userInterruption: {
        enabled: true,
        requireConfirmation: true,
        allowRollback: true
      }
    },
    violations: [
      {
        id: 'v-1',
        type: 'iteration',
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        severity: 'warning',
        message: '迭代次数接近上限阈值',
        action: '已发送警告通知',
        resolution: '任务继续执行'
      }
    ],
    terminationHistory: [
      {
        id: 't-1',
        reason: 'timeout_exceeded',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        boundaryType: 'timeout',
        executionTime: 300,
        iterationsCompleted: 87,
        userMessage: '任务执行时间超过最大限制',
        recoveryOptions: ['重新执行', '调整超时限制', '保存进度']
      }
    ],
    canInterrupt: true,
    isPaused: false
  })

  const [selectedTab, setSelectedTab] = useState<'boundaries' | 'violations' | 'history' | 'config'>('boundaries')

  // 计算进度百分比
  const iterationProgress = useMemo(() => 
    (state.iteration.currentIteration / state.iteration.maxIterations) * 100,
    [state.iteration]
  )

  const timeoutProgress = useMemo(() => 
    (state.timeout.elapsedDuration / state.timeout.maxDuration) * 100,
    [state.timeout]
  )

  const memoryProgress = useMemo(() => 
    (state.resource.currentMemoryMB / state.resource.maxMemoryMB) * 100,
    [state.resource]
  )

  const apiProgress = useMemo(() => 
    (state.resource.currentApiCalls / state.resource.maxApiCalls) * 100,
    [state.resource]
  )

  // 获取状态颜色
  const getStatusColor = (status: BoundaryStatus) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'exceeded': return 'text-orange-500'
      case 'terminated': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  // 获取严重程度颜色
  const getSeverityColor = (severity: BoundaryViolation['severity']) => {
    switch (severity) {
      case 'warning': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-orange-500 bg-orange-50 border-orange-200'
      case 'critical': return 'text-red-500 bg-red-50 border-red-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  // 获取终止原因名称
  const getTerminationReasonName = (reason: TerminationReason) => {
    const names: Record<TerminationReason, string> = {
      max_iterations_reached: '达到最大迭代次数',
      timeout_exceeded: '超过超时限制',
      user_interruption: '用户中断',
      resource_limit: '资源限制',
      policy_violation: '策略违规',
      error_threshold: '错误阈值'
    }
    return names[reason]
  }

  // 获取边界类型名称
  const getBoundaryTypeName = (type: BoundaryType) => {
    const names: Record<BoundaryType, string> = {
      iteration: '迭代边界',
      timeout: '超时边界',
      user_abort: '用户中断',
      resource: '资源边界',
      policy: '策略边界'
    }
    return names[type]
  }

  // 格式化时间
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  // 渲染边界状态
  const renderBoundaries = () => (
    <div className="space-y-4">
      {/* 整体状态 */}
      <Card className={cn(
        "border-2",
        state.status === 'active' ? 'bg-green-50 border-green-200' :
        state.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
        state.status === 'exceeded' ? 'bg-orange-50 border-orange-200' :
        'bg-red-50 border-red-200'
      )}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={cn("h-8 w-8", getStatusColor(state.status))} />
              <div>
                <h3 className="font-semibold text-lg">任务边界状态</h3>
                <p className="text-sm text-muted-foreground">
                  {state.status === 'active' ? '所有边界正常' :
                   state.status === 'warning' ? '接近边界限制' :
                   state.status === 'exceeded' ? '已超出边界' : '任务已终止'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {state.canInterrupt && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
                  >
                    {state.isPaused ? (
                      <><Play className="h-4 w-4 mr-1" /> 继续</>
                    ) : (
                      <><Pause className="h-4 w-4 mr-1" /> 暂停</>
                    )}
                  </Button>
                  <Button variant="destructive" size="sm">
                    <StopCircle className="h-4 w-4 mr-1" /> 中断
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 迭代边界 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            迭代边界
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>当前迭代</span>
            <span className="font-medium">
              {state.iteration.currentIteration} / {state.iteration.maxIterations}
            </span>
          </div>
          <Progress 
            value={iterationProgress} 
            className={cn(
              "h-2",
              iterationProgress >= state.iteration.warningThreshold && "bg-yellow-200"
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>警告阈值: {state.iteration.warningThreshold}%</span>
            <span>剩余: {state.iteration.maxIterations - state.iteration.currentIteration} 次</span>
          </div>
        </CardContent>
      </Card>

      {/* 超时边界 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            超时边界
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>已执行时间</span>
            <span className="font-medium">
              {formatDuration(state.timeout.elapsedDuration)} / {formatDuration(state.timeout.maxDuration)}
            </span>
          </div>
          <Progress 
            value={timeoutProgress} 
            className={cn(
              "h-2",
              timeoutProgress >= state.timeout.warningThreshold && "bg-yellow-200"
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>警告阈值: {state.timeout.warningThreshold}%</span>
            <span>剩余: {formatDuration(state.timeout.maxDuration - state.timeout.elapsedDuration)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 资源边界 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            资源边界
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 内存使用 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>内存使用</span>
              <span className="font-medium">
                {state.resource.currentMemoryMB} / {state.resource.maxMemoryMB} MB
              </span>
            </div>
            <Progress value={memoryProgress} className="h-2" />
          </div>
          
          {/* API调用 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>API 调用</span>
              <span className="font-medium">
                {state.resource.currentApiCalls} / {state.resource.maxApiCalls}
              </span>
            </div>
            <Progress value={apiProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 渲染违规记录
  const renderViolations = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            边界违规记录
          </CardTitle>
          <CardDescription>记录所有边界违规事件及处理方式</CardDescription>
        </CardHeader>
        <CardContent>
          {state.violations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>暂无违规记录</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {state.violations.map((violation) => (
                  <div
                    key={violation.id}
                    className={cn("p-3 rounded-lg border", getSeverityColor(violation.severity))}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {getBoundaryTypeName(violation.type)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {violation.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{violation.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <Badge variant="outline">操作: {violation.action}</Badge>
                      {violation.resolution && (
                        <Badge variant="secondary">解决: {violation.resolution}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // 渲染终止历史
  const renderHistory = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            终止历史
          </CardTitle>
          <CardDescription>记录所有任务终止事件及原因</CardDescription>
        </CardHeader>
        <CardContent>
          {state.terminationHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>暂无终止记录</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {state.terminationHistory.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 rounded-lg border bg-red-50 border-red-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StopCircle className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-sm">
                          {getTerminationReasonName(record.reason)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {record.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {record.userMessage}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-muted-foreground">执行时间:</span>
                        <span className="ml-1">{formatDuration(record.executionTime)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">完成迭代:</span>
                        <span className="ml-1">{record.iterationsCompleted}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">边界类型:</span>
                        <span className="ml-1">{getBoundaryTypeName(record.boundaryType)}</span>
                      </div>
                    </div>
                    {record.recoveryOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {record.recoveryOptions.map((option, idx) => (
                          <Button key={idx} size="sm" variant="outline" className="h-6 text-xs">
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // 渲染配置
  const renderConfig = () => (
    <div className="space-y-4">
      {/* 迭代配置 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">迭代边界配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">启用迭代边界</span>
            <Button
              variant={state.config.iteration.enabled ? "default" : "outline"}
              size="sm"
              onClick={() => setState(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  iteration: { ...prev.config.iteration, enabled: !prev.config.iteration.enabled }
                }
              }))}
            >
              {state.config.iteration.enabled ? '已启用' : '已禁用'}
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>最大迭代次数</span>
              <span className="font-medium">{state.config.iteration.maxIterations}</span>
            </div>
            <Select
              value={state.config.iteration.maxIterations.toString()}
              onValueChange={(val) => setState(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  iteration: { ...prev.config.iteration, maxIterations: parseInt(val) }
                }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 次</SelectItem>
                <SelectItem value="100">100 次</SelectItem>
                <SelectItem value="200">200 次</SelectItem>
                <SelectItem value="500">500 次</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 超时配置 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">超时边界配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">启用超时边界</span>
            <Button
              variant={state.config.timeout.enabled ? "default" : "outline"}
              size="sm"
              onClick={() => setState(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  timeout: { ...prev.config.timeout, enabled: !prev.config.timeout.enabled }
                }
              }))}
            >
              {state.config.timeout.enabled ? '已启用' : '已禁用'}
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>最大持续时间</span>
              <span className="font-medium">{state.config.timeout.maxDuration} 秒</span>
            </div>
            <Select
              value={state.config.timeout.maxDuration.toString()}
              onValueChange={(val) => setState(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  timeout: { ...prev.config.timeout, maxDuration: parseInt(val) }
                }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 分钟</SelectItem>
                <SelectItem value="300">5 分钟</SelectItem>
                <SelectItem value="600">10 分钟</SelectItem>
                <SelectItem value="1800">30 分钟</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 用户中断配置 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">用户中断配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">允许用户中断</span>
            <Button
              variant={state.config.userInterruption.enabled ? "default" : "outline"}
              size="sm"
              onClick={() => setState(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  userInterruption: { ...prev.config.userInterruption, enabled: !prev.config.userInterruption.enabled }
                }
              }))}
            >
              {state.config.userInterruption.enabled ? '已启用' : '已禁用'}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm">需要确认</span>
            <Button
              variant={state.config.userInterruption.requireConfirmation ? "default" : "outline"}
              size="sm"
              onClick={() => setState(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  userInterruption: { ...prev.config.userInterruption, requireConfirmation: !prev.config.userInterruption.requireConfirmation }
                }
              }))}
            >
              {state.config.userInterruption.requireConfirmation ? '是' : '否'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">允许回滚</span>
            <Button
              variant={state.config.userInterruption.allowRollback ? "default" : "outline"}
              size="sm"
              onClick={() => setState(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  userInterruption: { ...prev.config.userInterruption, allowRollback: !prev.config.userInterruption.allowRollback }
                }
              }))}
            >
              {state.config.userInterruption.allowRollback ? '是' : '否'}
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
          variant={selectedTab === 'boundaries' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTab('boundaries')}
        >
          边界状态
        </Button>
        <Button
          variant={selectedTab === 'violations' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTab('violations')}
        >
          违规记录
        </Button>
        <Button
          variant={selectedTab === 'history' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTab('history')}
        >
          终止历史
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
      {selectedTab === 'boundaries' && renderBoundaries()}
      {selectedTab === 'violations' && renderViolations()}
      {selectedTab === 'history' && renderHistory()}
      {selectedTab === 'config' && renderConfig()}
    </div>
  )
}

export default TaskBoundaryControl
