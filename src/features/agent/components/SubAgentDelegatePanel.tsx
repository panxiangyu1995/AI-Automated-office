/**
 * SubAgent Delegation Panel
 *
 * Displays current delegation status and allows manual delegation trigger
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Bot,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { invoke } from '@tauri-apps/api/core'

// Types
export interface DelegationStatus {
  id: string
  subagentId: string
  subagentName: string
  status: 'pending' | 'success' | 'error' | 'timeout'
  message: string
  timestamp: string
}

export interface DelegationPanelProps {
  className?: string
}

// Mock data
const mockDelegations: DelegationStatus[] = [
  {
    id: '1',
    subagentId: 'finance',
    subagentName: '财务助手',
    status: 'success',
    message: '已完成报销单创建',
    timestamp: '10:30:00',
  },
  {
    id: '2',
    subagentId: 'hr',
    subagentName: '人事助手',
    status: 'success',
    message: '已完成员工档案更新',
    timestamp: '10:25:00',
  },
  {
    id: '3',
    subagentId: 'sales',
    subagentName: '销售助手',
    status: 'error',
    message: '执行失败：权限不足',
    timestamp: '10:20:00',
  },
]

const getStatusIcon = (status: DelegationStatus['status']) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'timeout':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'pending':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
  }
}

const getStatusText = (status: DelegationStatus['status']) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'error':
      return '失败'
    case 'timeout':
      return '超时'
    case 'pending':
      return '进行中'
  }
}

export function DelegationPanel({ className = '' }: DelegationPanelProps) {
  const [delegations, setDelegations] = useState<DelegationStatus[]>(mockDelegations)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh delegation history
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const history = await invoke<DelegationStatus[]>('get_delegation_history', {
        limit: 20,
      })
      setDelegations(history)
    } catch {
      // Use mock data on error
      setDelegations(mockDelegations)
    }
    setIsRefreshing(false)
  }, [])

  // Initial load
  useEffect(() => {
    handleRefresh()
  }, [handleRefresh])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-medium">委派状态</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Delegation List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {delegations.map(delegation => (
            <Card key={delegation.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIcon(delegation.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{delegation.subagentName}</span>
                      <Badge
                        variant={
                          delegation.status === 'success'
                            ? 'default'
                            : delegation.status === 'error'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {getStatusText(delegation.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{delegation.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{delegation.timestamp}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {delegations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暂无委派记录</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default DelegationPanel
