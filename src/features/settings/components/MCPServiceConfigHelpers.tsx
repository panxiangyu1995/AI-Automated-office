/**
 * MCP Service Config - Helper Components
 * Story 21.3
 */

import {
  Trash2, Edit, Play, Pause,
  AlertCircle, CheckCircle2, Clock,
  CheckCircle, XCircle, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  MCPServiceStatus,
  MCPServiceType,
  ApprovalPolicyType,
  MCPServiceConfig,
} from './MCPServiceConfigTypes'

export function StatusBadge({ status }: { status: MCPServiceStatus }) {
  const config: Record<MCPServiceStatus, { color: string; icon: typeof CheckCircle2; label: string }> = {
    running: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2, label: '运行中' },
    stopped: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300', icon: Pause, label: '已停止' },
    error: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: AlertCircle, label: '错误' },
    pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock, label: '启动中' },
  }
  const { color, icon: Icon, label } = config[status]
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// Policy Badge Component for Approval Policy
export function PolicyBadge({ policy }: { policy: ApprovalPolicyType }) {
  const config: Record<ApprovalPolicyType, { color: string; icon: typeof CheckCircle; label: string }> = {
    auto_approve: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: '自动审批' },
    manual: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: Eye, label: '手动审批' },
    denied: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle, label: '拒绝' },
  }
  const { color, icon: Icon, label } = config[policy]
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// Service Card Component
export function ServiceCard({ 
  service, 
  onEdit, 
  onStart, 
  onStop, 
  onDelete 
}: { 
  service: MCPServiceConfig
  onEdit: () => void
  onStart: () => void
  onStop: () => void
  onDelete: () => void
}) {
  const typeIcons: Record<MCPServiceType, string> = {
    stdio: '💻',
    http: '🌐',
    websocket: '🔌',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{typeIcons[service.type]}</span>
              {service.name}
            </CardTitle>
            <StatusBadge status={service.status} />
          </div>
          <div className="flex gap-1">
            {service.status === 'running' ? (
              <Button variant="outline" size="sm" onClick={onStop}>
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onStart}>
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Service Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">类型:</span> {service.type.toUpperCase()}
            </div>
            <div>
              <span className="text-muted-foreground">策略:</span> {service.runtimePolicy}
            </div>
            <div>
              <span className="text-muted-foreground">版本:</span> v{service.version}
            </div>
            {service.pid && (
              <div>
                <span className="text-muted-foreground">PID:</span> {service.pid}
              </div>
            )}
          </div>

          {/* Capabilities */}
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">能力:</div>
            <div className="flex flex-wrap gap-1">
              {service.capabilities.map((cap) => (
                <Badge key={cap.name} variant="outline" className="text-xs">
                  {cap.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Error Info */}
          {service.lastError && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
              <div className="font-medium">错误:</div>
              <div>{service.lastError}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
