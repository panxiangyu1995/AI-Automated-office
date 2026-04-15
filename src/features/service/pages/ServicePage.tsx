//! ServicePage - 售后模块主页

import { useState, useEffect } from 'react'
import { useServiceStore } from '../stores/serviceStore'
import { TicketList } from '../components/TicketList'
import { TicketForm } from '../components/TicketForm'
import { TicketDetail } from '../components/TicketDetail'
import { ServiceDashboard } from '../components/ServiceDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import type { CreateTicketRequest, TicketListItem } from '../types/service'

export function ServicePage() {
  const { fetchTickets, createTicket } = useServiceStore()
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleTicketClick = (ticket: TicketListItem) => {
    setSelectedTicketId(ticket.id)
    setDetailOpen(true)
  }

  const handleCreateClick = () => {
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: CreateTicketRequest) => {
    await createTicket(data)
    setFormOpen(false)
  }

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open)
    if (!open) {
      setSelectedTicketId(null)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">售后服务</h1>
          <p className="text-sm text-muted-foreground mt-1">管理售后工单和服务人员</p>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 仪表板 */}
        <div className="mb-6">
          <ServiceDashboard />
        </div>

        {/* 标签页 */}
        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">工单列表</TabsTrigger>
            <TabsTrigger value="personnel">服务人员</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <TicketList onTicketClick={handleTicketClick} onCreateClick={handleCreateClick} />
          </TabsContent>

          <TabsContent value="personnel">
            <EmptyState
              title="服务人员管理"
              description="服务人员功能将在后续版本中实现"
              icon={Users}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 创建工单表单 */}
      <TicketForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        mode="create"
      />

      {/* 工单详情 (包含时间线和回访) */}
      <TicketDetail
        ticketId={selectedTicketId}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
      />
    </div>
  )
}
