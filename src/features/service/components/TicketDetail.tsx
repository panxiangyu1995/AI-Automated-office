//! TicketDetail 组件 - 工单详情面板 (包含时间线和回访)

import { useEffect, useState } from 'react'
import { useServiceStore } from '../stores/serviceStore'
import { StatusBadge } from './StatusBadge'
import { PriorityTag } from './PriorityTag'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Clock, User, Phone, Mail, X, Plus, Star, BookOpen } from 'lucide-react'
import { TicketTimeline } from './TicketTimeline'
import { FollowUpForm } from './FollowUpForm'
import { KnowledgeContribution, type KnowledgeContributionData } from './KnowledgeContribution'
import { ChatSkeleton } from '@/components/ui/loading-skeleton'
import type { TicketStatus, ProcessingRecord, CreateFollowUpRequest } from '../types/service'

interface TicketDetailProps {
  ticketId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeLabels: Record<string, string> = {
  repair: '维修',
  consultation: '咨询',
  complaint: '投诉',
}

const statusTransitions: Record<TicketStatus, TicketStatus[]> = {
  new: ['processing', 'cancelled'],
  processing: ['pending_confirm', 'cancelled'],
  pending_confirm: ['processing', 'completed'],
  completed: [],
  cancelled: [],
}

const statusLabels: Record<string, string> = {
  new: '新建',
  processing: '处理中',
  pending_confirm: '待确认',
  completed: '已完成',
  cancelled: '已取消',
}

export function TicketDetail({ ticketId, open, onOpenChange }: TicketDetailProps) {
  const { currentTicket, fetchTicket, updateTicketStatus } = useServiceStore()
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('')
  const [newRecordContent, setNewRecordContent] = useState('')
  const [processingRecords] = useState<ProcessingRecord[]>([])
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [knowledgeOpen, setKnowledgeOpen] = useState(false)

  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId)
    }
  }, [ticketId, fetchTicket])

  useEffect(() => {
    if (currentTicket) {
      setNewStatus(currentTicket.status)
    }
  }, [currentTicket])

  const handleStatusChange = async () => {
    if (ticketId && newStatus && newStatus !== currentTicket?.status) {
      await updateTicketStatus(ticketId, newStatus as TicketStatus)
    }
  }

  const handleAddRecord = async () => {
    // TODO: 实现添加处理记录
    if (newRecordContent.trim()) {
      setNewRecordContent('')
    }
  }

  const handleFollowUpSubmit = async (_data: CreateFollowUpRequest) => {
    // TODO: 实现创建回访记录
    // Follow-up submitted
  }

  const handleKnowledgeSubmit = async (_data: KnowledgeContributionData) => {
    // TODO: 实现提交知识贡献到知识库
    // Knowledge contribution submitted
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const availableStatuses = currentTicket ? statusTransitions[currentTicket.status] : []

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between pr-8">
              <SheetTitle className="text-xl">工单详情</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {currentTicket && (
              <SheetDescription className="flex items-center gap-2 mt-2">
                <span className="font-mono text-xs">#{currentTicket.id.slice(0, 8)}</span>
                <span className="px-2 py-0.5 bg-muted rounded text-xs">
                  {typeLabels[currentTicket.ticketType] || currentTicket.ticketType}
                </span>
              </SheetDescription>
            )}
          </SheetHeader>

          {currentTicket ? (
            <div className="space-y-6 mt-6">
              {/* 标题和状态 */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">{currentTicket.title}</h2>
                <div className="flex items-center gap-3">
                  <StatusBadge status={currentTicket.status} size="lg" />
                  <PriorityTag priority={currentTicket.priority} size="lg" />
                </div>
              </div>

              <Separator />

              {/* 状态操作 */}
              {availableStatuses.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">状态操作</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={newStatus}
                      onValueChange={(value) => setNewStatus(value as TicketStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择新状态" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full"
                      onClick={handleStatusChange}
                      disabled={!newStatus || newStatus === currentTicket.status}
                    >
                      更新状态
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 客户信息 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">客户信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{currentTicket.customerName}</span>
                  </div>
                  {currentTicket.customerContact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{currentTicket.customerContact}</span>
                    </div>
                  )}
                  {currentTicket.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{currentTicket.customerEmail}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 处理人信息 */}
              {currentTicket.assignedName && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">处理人</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{currentTicket.assignedName}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 描述 */}
              {currentTicket.description && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">工单描述</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{currentTicket.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* 处理时间线 */}
              <TicketTimeline records={processingRecords} />

              {/* 添加处理记录 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">添加处理记录</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="输入处理内容..."
                    value={newRecordContent}
                    onChange={(e) => setNewRecordContent(e.target.value)}
                    rows={3}
                  />
                  <Button
                    className="w-full"
                    onClick={handleAddRecord}
                    disabled={!newRecordContent.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加记录
                  </Button>
                </CardContent>
              </Card>

              {/* 回访按钮 */}
              {currentTicket.status === 'completed' && (
                <Button className="w-full" variant="outline" onClick={() => setFollowUpOpen(true)}>
                  <Star className="h-4 w-4 mr-1" />
                  创建回访记录
                </Button>
              )}

              {/* 知识贡献按钮 - 工单完成后显示 */}
              {currentTicket.status === 'completed' && (
                <Button className="w-full" variant="outline" onClick={() => setKnowledgeOpen(true)}>
                  <BookOpen className="h-4 w-4 mr-1" />
                  保存到知识库
                </Button>
              )}

              {/* 时间信息 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">时间信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>创建于: {new Date(currentTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>更新于: {new Date(currentTicket.updatedAt).toLocaleString()}</span>
                  </div>
                  {currentTicket.completedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>完成于: {new Date(currentTicket.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-8">
              <ChatSkeleton />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 回访表单 */}
      {currentTicket && (
        <FollowUpForm
          open={followUpOpen}
          onOpenChange={setFollowUpOpen}
          onSubmit={handleFollowUpSubmit}
          ticketId={currentTicket.id}
          customerName={currentTicket.customerName}
          customerContact={currentTicket.customerContact || ''}
        />
      )}

      {/* 知识贡献对话框 */}
      {currentTicket && (
        <KnowledgeContribution
          open={knowledgeOpen}
          onOpenChange={setKnowledgeOpen}
          ticketId={currentTicket.id}
          ticketTitle={currentTicket.title}
          processingSummary={currentTicket.description || ''}
          customerName={currentTicket.customerName}
          onSubmit={handleKnowledgeSubmit}
        />
      )}
    </>
  )
}
