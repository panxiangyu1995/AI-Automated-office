/**
 * ToolFailureHandling - 工具调用失败处理组件
 * Story 5.4 - 工具调用失败处理
 *
 * 支持手动重试和失败工具执行的后备处理
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构，复用 message model 和 tool executor
 * - Brand Color: #1E3A5F
 * - FR71, FR72: 重试控制、后备结果输入
 * - NFR22: 错误处理可观测性
 */

import { useState, useCallback, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Edit3,
  HelpCircle,
  Info,
  Lightbulb,
  ListRestart,
  Save,
  SkipForward,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type {
  ToolCallPart,
  ToolResultPart,
} from '../../message/runtime/messageModel'
import type { ToolDescriptor } from '../tools/toolDescriptor'

// ==================== Constants ====================

const BRAND_COLOR = '#1E3A5F'

/**
 * 错误类型分类
 */
export enum ErrorType {
  /** 验证错误 - 输入参数不符合要求 */
  VALIDATION = 'validation',
  /** 权限错误 - 缺少执行权限 */
  PERMISSION = 'permission',
  /** 运行时错误 - 工具执行过程中的错误 */
  RUNTIME = 'runtime',
  /** 超时错误 - 执行超时 */
  TIMEOUT = 'timeout',
  /** 网络错误 - 网络连接问题 */
  NETWORK = 'network',
  /** 资源错误 - 资源不可用 */
  RESOURCE = 'resource',
  /** 未知错误 */
  UNKNOWN = 'unknown',
}

/**
 * 错误类型配置
 */
const ERROR_TYPE_CONFIG: Record<ErrorType, {
  icon: React.ElementType
  label: string
  color: string
  bgColor: string
  borderColor: string
  retryable: boolean
  fallbackAllowed: boolean
}> = {
  [ErrorType.VALIDATION]: {
    icon: AlertTriangle,
    label: '参数验证失败',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    retryable: true,
    fallbackAllowed: false,
  },
  [ErrorType.PERMISSION]: {
    icon: XCircle,
    label: '权限不足',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    retryable: false,
    fallbackAllowed: false,
  },
  [ErrorType.RUNTIME]: {
    icon: AlertCircle,
    label: '运行时错误',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    retryable: true,
    fallbackAllowed: true,
  },
  [ErrorType.TIMEOUT]: {
    icon: Clock,
    label: '执行超时',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    retryable: true,
    fallbackAllowed: true,
  },
  [ErrorType.NETWORK]: {
    icon: AlertCircle,
    label: '网络错误',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    retryable: true,
    fallbackAllowed: true,
  },
  [ErrorType.RESOURCE]: {
    icon: AlertCircle,
    label: '资源不可用',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    retryable: true,
    fallbackAllowed: true,
  },
  [ErrorType.UNKNOWN]: {
    icon: HelpCircle,
    label: '未知错误',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    retryable: true,
    fallbackAllowed: true,
  },
}

/**
 * 下一步建议类型
 */
interface GuidanceStep {
  icon: React.ElementType
  label: string
  action?: string
}

// ==================== Types ====================

export interface ToolFailureHandlingProps {
  /** 失败的工具调用 */
  toolCall: ToolCallPart
  /** 失败结果 */
  result: ToolResultPart
  /** 工具描述符 */
  descriptor?: ToolDescriptor
  /** 错误类型（自动检测或手动指定） */
  errorType?: ErrorType
  /** 重试次数 */
  retryCount?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 是否允许后备结果 */
  allowFallback?: boolean
  /** 重试回调 */
  onRetry?: (toolCall: ToolCallPart, attempt: number) => void
  /** 提供后备结果回调 */
  onProvideFallback?: (toolCall: ToolCallPart, fallbackResult: unknown) => void
  /** 跳过回调 */
  onSkip?: (toolCall: ToolCallPart) => void
  /** 查看错误详情回调 */
  onViewErrorDetails?: (toolCall: ToolCallPart, result: ToolResultPart) => void
}

export interface FailureGuidanceProps {
  errorType: ErrorType
  retryCount: number
  maxRetries: number
  retryable: boolean
  fallbackAllowed: boolean
}

export interface FallbackResultInputProps {
  onSubmit: (result: unknown) => void
  onCancel: () => void
  expectedType?: string
  placeholder?: string
}

// ==================== Helper Functions ====================

/**
 * 根据错误消息自动检测错误类型
 */
function detectErrorType(errorMessage: string, errorCode?: string): ErrorType {
  const lowerMessage = errorMessage.toLowerCase()
  
  // 权限错误
  if (
    lowerMessage.includes('permission') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('access denied') ||
    lowerMessage.includes('权限') ||
    errorCode === 'PERMISSION_DENIED'
  ) {
    return ErrorType.PERMISSION
  }
  
  // 验证错误
  if (
    lowerMessage.includes('validation') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('required') ||
    lowerMessage.includes('格式') ||
    lowerMessage.includes('参数') ||
    errorCode === 'VALIDATION_ERROR'
  ) {
    return ErrorType.VALIDATION
  }
  
  // 超时错误
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('超时') ||
    errorCode === 'TIMEOUT'
  ) {
    return ErrorType.TIMEOUT
  }
  
  // 网络错误
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('网络') ||
    lowerMessage.includes('连接') ||
    errorCode === 'NETWORK_ERROR'
  ) {
    return ErrorType.NETWORK
  }
  
  // 资源错误
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('resource') ||
    lowerMessage.includes('unavailable') ||
    lowerMessage.includes('资源') ||
    lowerMessage.includes('不存在') ||
    errorCode === 'RESOURCE_NOT_FOUND'
  ) {
    return ErrorType.RESOURCE
  }
  
  return ErrorType.RUNTIME
}

/**
 * 格式化错误消息
 */
function formatErrorMessage(message: string): string {
  // 移除过多的堆栈信息
  const lines = message.split('\n')
  if (lines.length > 5) {
    return lines.slice(0, 5).join('\n') + '\n...'
  }
  return message
}

/**
 * 生成下一步建议
 */
function generateGuidanceSteps(
  errorType: ErrorType,
  retryCount: number,
  maxRetries: number,
  retryable: boolean,
  fallbackAllowed: boolean
): GuidanceStep[] {
  const steps: GuidanceStep[] = []
  
  switch (errorType) {
    case ErrorType.VALIDATION:
      steps.push({
        icon: Edit3,
        label: '检查并修正输入参数',
        action: '修改参数后重试',
      })
      break
      
    case ErrorType.PERMISSION:
      steps.push({
        icon: Info,
        label: '联系管理员获取执行权限',
      })
      steps.push({
        icon: Lightbulb,
        label: '检查当前角色是否有足够权限',
      })
      break
      
    case ErrorType.TIMEOUT:
      if (retryCount < maxRetries && retryable) {
        steps.push({
          icon: RotateCcw,
          label: '等待后重试',
          action: '重试执行',
        })
      }
      steps.push({
        icon: Zap,
        label: '考虑优化工具性能或增加超时时间',
      })
      break
      
    case ErrorType.NETWORK:
      steps.push({
        icon: Info,
        label: '检查网络连接',
      })
      if (retryCount < maxRetries && retryable) {
        steps.push({
          icon: RotateCcw,
          label: '网络恢复后重试',
          action: '重试执行',
        })
      }
      break
      
    case ErrorType.RESOURCE:
      steps.push({
        icon: Info,
        label: '确认资源是否存在',
      })
      steps.push({
        icon: Lightbulb,
        label: '检查资源路径或标识符是否正确',
      })
      break
      
    default:
      if (retryCount < maxRetries && retryable) {
        steps.push({
          icon: RotateCcw,
          label: '尝试重新执行',
          action: '重试执行',
        })
      }
      if (fallbackAllowed) {
        steps.push({
          icon: Edit3,
          label: '提供替代结果',
          action: '输入后备结果',
        })
      }
  }
  
  return steps
}

// ==================== Sub Components ====================

/**
 * 错误原因展示组件
 */
interface ErrorReasonDisplayProps {
  errorType: ErrorType
  errorMessage: string
  retryCount: number
  maxRetries: number
}

function ErrorReasonDisplay({
  errorType,
  errorMessage,
  retryCount,
  maxRetries,
}: ErrorReasonDisplayProps): React.ReactNode {
  const config = ERROR_TYPE_CONFIG[errorType]
  const Icon = config.icon
  
  return (
    <div className={cn('p-3 rounded-lg', config.bgColor, 'border', config.borderColor)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-medium', config.color)}>
              {config.label}
            </span>
            {retryCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                已重试 {retryCount}/{maxRetries} 次
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 break-all">
            {formatErrorMessage(errorMessage)}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * 下一步指引组件
 */
function FailureGuidance({
  errorType,
  retryCount,
  maxRetries,
  retryable,
  fallbackAllowed,
}: FailureGuidanceProps): React.ReactNode {
  const steps = generateGuidanceSteps(
    errorType,
    retryCount,
    maxRetries,
    retryable,
    fallbackAllowed
  )
  
  if (steps.length === 0) {
    return null
  }
  
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <span>建议操作</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          return (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                {index + 1}
              </div>
              <StepIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>{step.label}</span>
              {step.action && (
                <Badge variant="outline" className="text-xs">
                  {step.action}
                </Badge>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 后备结果输入组件
 */
function FallbackResultInput({
  onSubmit,
  onCancel,
  expectedType,
  placeholder,
}: FallbackResultInputProps): React.ReactNode {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const handleSubmit = useCallback(() => {
    if (!value.trim()) {
      setError('请输入后备结果')
      return
    }
    
    // 尝试解析 JSON
    try {
      const parsed = JSON.parse(value)
      onSubmit(parsed)
    } catch {
      // 如果不是 JSON，作为字符串提交
      onSubmit(value)
    }
  }, [value, onSubmit])
  
  const handleCopyTemplate = useCallback(() => {
    const template = expectedType === 'object' 
      ? '{\n  \n}'
      : expectedType === 'array'
        ? '[\n  \n]'
        : ''
    setValue(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [expectedType])
  
  return (
    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
      <div className="flex items-center gap-1.5 text-sm font-medium text-blue-700 mb-2">
        <Edit3 className="h-4 w-4" />
        <span>提供后备结果</span>
      </div>
      
      <div className="space-y-2">
        <div>
          <Label htmlFor="fallback-input" className="text-xs text-slate-500">
            输入结果值（支持 JSON 格式）
          </Label>
          <Textarea
            id="fallback-input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            placeholder={placeholder || '输入后备结果...'}
            className={cn(
              'mt-1 font-mono text-sm',
              error ? 'border-red-300' : ''
            )}
            rows={4}
          />
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expectedType && (
              <Badge variant="outline" className="text-xs">
                预期类型: {expectedType}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopyTemplate}
            >
              <Copy className="h-3 w-3 mr-1" />
              {copied ? '已复制模板' : '使用模板'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={onCancel}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="h-7"
              style={{ backgroundColor: BRAND_COLOR }}
              onClick={handleSubmit}
            >
              <Save className="h-3 w-3 mr-1" />
              提交结果
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 重试确认对话框
 */
interface RetryConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toolName: string
  attempt: number
  maxRetries: number
  onConfirm: () => void
}

function RetryConfirmDialog({
  open,
  onOpenChange,
  toolName,
  attempt,
  maxRetries,
  onConfirm,
}: RetryConfirmDialogProps): React.ReactNode {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-500" />
            确认重试执行
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-2">
              确定要重新执行工具 <strong>{toolName}</strong> 吗？
            </p>
            <p className="text-sm text-slate-500">
              当前重试次数: {attempt} / {maxRetries}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            style={{ backgroundColor: BRAND_COLOR }}
          >
            确认重试
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ==================== Main Component ====================

/**
 * 工具调用失败处理组件
 * 
 * 功能:
 * - 显示规范化错误原因
 * - 提供重试控制
 * - 支持后备结果输入
 * - 显示下一步指引
 */
export function ToolFailureHandling({
  toolCall,
  result,
  descriptor,
  errorType: providedErrorType,
  retryCount = 0,
  maxRetries = 3,
  allowFallback: providedAllowFallback,
  onRetry,
  onProvideFallback,
  onSkip,
  onViewErrorDetails,
}: ToolFailureHandlingProps): React.ReactNode {
  const [expanded, setExpanded] = useState(true)
  const [showFallbackInput, setShowFallbackInput] = useState(false)
  const [showRetryDialog, setShowRetryDialog] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  
  // 自动检测错误类型
  const errorType = useMemo(() => {
    if (providedErrorType) return providedErrorType
    return detectErrorType(result.errorMessage || '')
  }, [providedErrorType, result])
  
  const errorConfig = ERROR_TYPE_CONFIG[errorType]
  
  // 是否允许后备结果
  const allowFallback = useMemo(() => {
    if (providedAllowFallback !== undefined) return providedAllowFallback
    // 默认根据错误类型决定
    return errorConfig.fallbackAllowed
  }, [providedAllowFallback, errorConfig])
  
  // 是否可重试
  const canRetry = useMemo(() => {
    return (
      errorConfig.retryable &&
      retryCount < maxRetries &&
      onRetry !== undefined
    )
  }, [errorConfig, retryCount, maxRetries, onRetry])
  
  // 重试处理
  const handleRetry = useCallback(() => {
    if (!onRetry || isRetrying) return
    setIsRetrying(true)
    onRetry(toolCall, retryCount + 1)
    setShowRetryDialog(false)
    // 重置状态（假设父组件会更新 toolCall 状态）
    setTimeout(() => setIsRetrying(false), 1000)
  }, [onRetry, toolCall, retryCount, isRetrying])
  
  // 后备结果提交
  const handleProvideFallback = useCallback(
    (fallbackResult: unknown) => {
      onProvideFallback?.(toolCall, fallbackResult)
      setShowFallbackInput(false)
    },
    [onProvideFallback, toolCall]
  )
  
  // 跳过处理
  const handleSkip = useCallback(() => {
    onSkip?.(toolCall)
  }, [onSkip, toolCall])
  
  // 查看错误详情
  const handleViewErrorDetails = useCallback(() => {
    onViewErrorDetails?.(toolCall, result)
  }, [onViewErrorDetails, toolCall, result])
  
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderLeftWidth: '3px', borderLeftColor: BRAND_COLOR }}
    >
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* Header */}
        <div className={cn('px-3 py-2', errorConfig.bgColor)}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 text-left w-full">
              <div className="flex items-center gap-2">
                <AlertCircle className={cn('h-4 w-4', errorConfig.color)} />
                <span className={cn('font-medium', errorConfig.color)}>
                  工具执行失败
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {toolCall.toolName}
                </span>
                {retryCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    重试 {retryCount}/{maxRetries}
                  </Badge>
                )}
              </div>
            </button>
          </CollapsibleTrigger>
          
          <div className="flex items-center justify-end mt-2">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>
        
        {/* Content */}
        <CollapsibleContent>
          <div className="p-3 space-y-3 bg-white">
            {/* 错误原因 */}
            <ErrorReasonDisplay
              errorType={errorType}
              errorMessage={result.errorMessage || '未知错误'}
              retryCount={retryCount}
              maxRetries={maxRetries}
            />
            
            {/* 下一步指引 */}
            <FailureGuidance
              errorType={errorType}
              retryCount={retryCount}
              maxRetries={maxRetries}
              retryable={errorConfig.retryable}
              fallbackAllowed={allowFallback}
            />
            
            {/* 后备结果输入 */}
            {showFallbackInput ? (
              <FallbackResultInput
                onSubmit={handleProvideFallback}
                onCancel={() => setShowFallbackInput(false)}
                expectedType={descriptor?.returnType?.type}
                placeholder={descriptor?.returnType?.description}
              />
            ) : null}
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2 pt-2 border-t">
              {/* 重试按钮 */}
              {canRetry ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowRetryDialog(true)}
                  disabled={isRetrying}
                >
                  <RotateCcw className={cn('h-3.5 w-3.5 mr-1.5', isRetrying ? 'animate-spin' : '')} />
                  {isRetrying ? '重试中...' : '重试'}
                </Button>
              ) : retryCount >= maxRetries && errorConfig.retryable ? (
                <Badge variant="secondary" className="text-xs">
                  已达最大重试次数
                </Badge>
              ) : null}
              
              {/* 后备结果按钮 */}
              {allowFallback && onProvideFallback && !showFallbackInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowFallbackInput(true)}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  提供结果
                </Button>
              ) : null}
              
              {/* 跳过按钮 */}
              {onSkip ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-slate-500"
                  onClick={handleSkip}
                >
                  <SkipForward className="h-3.5 w-3.5 mr-1.5" />
                  跳过
                </Button>
              ) : null}
              
              {/* 查看详情按钮 */}
              {onViewErrorDetails ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-slate-500 ml-auto"
                  onClick={handleViewErrorDetails}
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                  详细信息
                </Button>
              ) : null}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* 重试确认对话框 */}
      <RetryConfirmDialog
        open={showRetryDialog}
        onOpenChange={setShowRetryDialog}
        toolName={toolCall.toolName}
        attempt={retryCount + 1}
        maxRetries={maxRetries}
        onConfirm={handleRetry}
      />
    </div>
  )
}

/**
 * 工具失败状态卡片（简化版）
 */
export function ToolFailureCard({
  toolCall,
  result,
  onRetry,
  onProvideFallback,
}: {
  toolCall: ToolCallPart
  result: ToolResultPart
  onRetry?: () => void
  onProvideFallback?: (result: unknown) => void
}): React.ReactNode {
  return (
    <ToolFailureHandling
      toolCall={toolCall}
      result={result}
      retryCount={0}
      maxRetries={3}
      onRetry={onRetry ? () => onRetry() : undefined}
      onProvideFallback={
        onProvideFallback
          ? (_, fallback) => onProvideFallback(fallback)
          : undefined
      }
    />
  )
}

/**
 * 批量失败工具处理组件
 */
export interface BatchFailureHandlingProps {
  failures: Array<{
    toolCall: ToolCallPart
    result: ToolResultPart
    descriptor?: ToolDescriptor
  }>
  onRetryAll?: () => void
  onSkipAll?: () => void
  onRetryOne?: (toolCall: ToolCallPart) => void
  onProvideFallback?: (toolCall: ToolCallPart, result: unknown) => void
}

export function BatchFailureHandling({
  failures,
  onRetryAll,
  onSkipAll,
  onRetryOne,
  onProvideFallback,
}: BatchFailureHandlingProps): React.ReactNode {
  if (failures.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-3">
      {/* 批量操作头部 */}
      {failures.length > 1 && (
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="font-medium text-red-700">
              {failures.length} 个工具执行失败
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onRetryAll && (
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={onRetryAll}
              >
                <ListRestart className="h-3.5 w-3.5 mr-1" />
                全部重试
              </Button>
            )}
            {onSkipAll && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={onSkipAll}
              >
                <SkipForward className="h-3.5 w-3.5 mr-1" />
                全部跳过
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* 单个失败项 */}
      {failures.map(({ toolCall, result, descriptor }) => (
        <ToolFailureHandling
          key={toolCall.id}
          toolCall={toolCall}
          result={result}
          descriptor={descriptor}
          onRetry={onRetryOne}
          onProvideFallback={onProvideFallback}
        />
      ))}
    </div>
  )
}

export default ToolFailureHandling
