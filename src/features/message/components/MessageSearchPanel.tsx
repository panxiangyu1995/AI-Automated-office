/**
 * Message Search Panel Component
 * 消息搜索面板
 */

import { useCallback, useState } from 'react'
import { Search, Filter, X, Calendar, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useMessageSearch, useMessageFilter } from '../hooks/useMessage'
import type { MessageType, MessagePriority, MessageStatus } from '../types/message.types'

interface SearchPanelProps {
  className?: string
  onSelect?: (messageId: string) => void
}

export function MessageSearchPanel({ className, onSelect }: SearchPanelProps) {
  const [keyword, setKeyword] = useState('')
  const [msgType, setMsgType] = useState<MessageType | undefined>()
  const [priority, setPriority] = useState<MessagePriority | undefined>()
  const [status, setStatus] = useState<MessageStatus | undefined>()
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [pinnedOnly, setPinnedOnly] = useState(false)

  const { search, result, isLoading } = useMessageSearch()
  const { filter: _filter, messages: filteredMessages } = useMessageFilter()

  const handleSearch = useCallback(async () => {
    await search({
      keyword: keyword || undefined,
      msgType,
      priority,
      status,
      startDate: startDate?.getTime(),
      endDate: endDate?.getTime(),
      pinnedOnly: pinnedOnly || undefined,
      page: 1,
      pageSize: 20,
    })
  }, [keyword, msgType, priority, status, startDate, endDate, pinnedOnly, search])

  const clearFilters = useCallback(() => {
    setKeyword('')
    setMsgType(undefined)
    setPriority(undefined)
    setStatus(undefined)
    setStartDate(undefined)
    setEndDate(undefined)
    setPinnedOnly(false)
  }, [])

  const hasFilters = keyword || msgType || priority || status || startDate || endDate || pinnedOnly

  const displayMessages = result?.messages || filteredMessages || []

  const msgTypeOptions: { value: MessageType; label: string }[] = [
    { value: 'system', label: '系统' },
    { value: 'approval', label: '审批' },
    { value: 'task', label: '任务' },
    { value: 'mention', label: '提及' },
    { value: 'chat', label: '聊天' },
  ]

  const priorityOptions: { value: MessagePriority; label: string }[] = [
    { value: 'low', label: '低' },
    { value: 'normal', label: '普通' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
  ]

  const statusOptions: { value: MessageStatus; label: string }[] = [
    { value: 'unread', label: '未读' },
    { value: 'read', label: '已读' },
    { value: 'archived', label: '归档' },
  ]

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search Header */}
      <Card className="border-0 rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            消息搜索
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keyword Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索消息标题或内容..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              搜索
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Type Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3 w-3 mr-1" />
                  {msgType ? `类型: ${msgTypeOptions.find((o) => o.value === msgType)?.label}` : '消息类型'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                <div className="flex flex-col gap-1">
                  <Button
                    variant={!msgType ? 'secondary' : 'ghost'}
                    size="sm"
                    className="justify-start h-8"
                    onClick={() => setMsgType(undefined)}
                  >
                    全部
                  </Button>
                  {msgTypeOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={msgType === opt.value ? 'secondary' : 'ghost'}
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => setMsgType(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Priority Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  {priority ? `优先级: ${priorityOptions.find((o) => o.value === priority)?.label}` : '优先级'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                <div className="flex flex-col gap-1">
                  <Button
                    variant={!priority ? 'secondary' : 'ghost'}
                    size="sm"
                    className="justify-start h-8"
                    onClick={() => setPriority(undefined)}
                  >
                    全部
                  </Button>
                  {priorityOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={priority === opt.value ? 'secondary' : 'ghost'}
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => setPriority(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3 w-3 mr-1" />
                  {status ? `状态: ${statusOptions.find((o) => o.value === status)?.label}` : '状态'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                <div className="flex flex-col gap-1">
                  <Button
                    variant={!status ? 'secondary' : 'ghost'}
                    size="sm"
                    className="justify-start h-8"
                    onClick={() => setStatus(undefined)}
                  >
                    全部
                  </Button>
                  {statusOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={status === opt.value ? 'secondary' : 'ghost'}
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => setStatus(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Calendar className="h-3 w-3 mr-1" />
                  {startDate || endDate ? '日期范围' : '日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">开始日期</div>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    className="rounded-md border"
                  />
                  <Separator />
                  <div className="text-sm font-medium">结束日期</div>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    className="rounded-md border"
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Pinned Only */}
            <Button
              variant={pinnedOnly ? 'secondary' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => setPinnedOnly(!pinnedOnly)}
            >
              置顶消息
            </Button>

            {/* Clear Filters */}
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">搜索中...</div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {hasFilters ? '没有找到匹配的消息' : '请输入搜索条件'}
          </div>
        ) : (
          <div className="space-y-2">
            {result?.total !== undefined && (
              <div className="text-sm text-muted-foreground mb-2">
                找到 {result.total} 条消息
              </div>
            )}
            {displayMessages.map((msg) => (
              <Card
                key={msg.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onSelect?.(msg.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msgTypeOptions.find((t) => t.value === msg.msgType)?.label || msg.msgType}
                        </Badge>
                        <Badge
                          variant={msg.priority === 'urgent' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {priorityOptions.find((p) => p.value === msg.priority)?.label || msg.priority}
                        </Badge>
                        {msg.status === 'unread' && (
                          <Badge className="bg-blue-500 text-xs">未读</Badge>
                        )}
                      </div>
                      <div className="font-medium text-sm truncate">{msg.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {msg.senderName} · {new Date(msg.createdAt * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
