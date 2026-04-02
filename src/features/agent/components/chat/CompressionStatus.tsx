/**
 * CompressionStatus Component
 * 压缩状态指示器组件
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface CompressionStatusProps {
  status: 'idle' | 'compressing' | 'success' | 'error' | 'warning'
  tokenCount?: number
  warningThreshold?: number
  errorThreshold?: number
  compressionCount?: number
  compactingLayer?: string
  className?: string
}

export function CompressionStatus({
  status,
  tokenCount = 0,
  warningThreshold = 100000,
  errorThreshold = 150000,
  compressionCount = 0,
  compactingLayer,
  className,
}: CompressionStatusProps) {
  
  // 计算阈值百分比
  const thresholdPercentage = Math.min((tokenCount / errorThreshold) * 100, 100)
  
  // 获取状态颜色
  const getStatusColor = () => {
    switch (status) {
      case 'compressing':
        return 'text-blue-500'
      case 'success':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      default:
        return 'text-muted-foreground'
    }
  }
  
  // 获取状态图标
  const getStatusIcon = () => {
    const iconClass = 'h-4 w-4'
    switch (status) {
      case 'compressing':
        return <Loader2 className={cn(iconClass, 'animate-spin', getStatusColor())} />
      case 'success':
        return <CheckCircle className={cn(iconClass, getStatusColor())} />
      case 'error':
        return <XCircle className={cn(iconClass, getStatusColor())} />
      case 'warning':
        return <AlertTriangle className={cn(iconClass, getStatusColor())} />
      default:
        return null
    }
  }
  
  // 获取状态文本
  const getStatusText = () => {
    switch (status) {
      case 'compressing':
        return compactingLayer ? `压缩中 (${compactingLayer})` : '压缩中...'
      case 'success':
        return `已压缩 (共${compressionCount}次)`
      case 'error':
        return '压缩失败'
      case 'warning':
        return '上下文即将达到限制'
      default:
        return compressionCount > 0 ? `已压缩 ${compressionCount} 次` : '就绪'
    }
  }
  
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {/* 状态图标 */}
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      
      {/* 状态信息 */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={cn('font-medium', getStatusColor())}>
          {getStatusText()}
        </span>
        
        {/* Token 进度条（仅在非 idle 状态且有 token 数时显示） */}
        {status !== 'idle' && tokenCount > 0 && (
          <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                status === 'error' || thresholdPercentage > 100 ? 'bg-red-500' :
                status === 'warning' || thresholdPercentage > 66 ? 'bg-yellow-500' :
                status === 'compressing' ? 'bg-blue-500' :
                'bg-green-500'
              )}
              style={{ width: `${Math.min(thresholdPercentage, 100)}%` }}
            />
          </div>
        )}
        
        {/* Token 数量 */}
        {tokenCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {tokenCount.toLocaleString()} / {errorThreshold.toLocaleString()} tokens
          </span>
        )}
      </div>
    </div>
  )
}

export default CompressionStatus
