/**
 * Message Detail Component
 * 消息详情组件
 */

import { useMarkAsRead, useDeleteMessage, usePinMessage } from '../hooks/useMessage'

interface MessageDetailProps {
  messageId: string
  onBack?: () => void
  className?: string
}

export function MessageDetail({ messageId, onBack, className }: MessageDetailProps) {
  const { message, isLoading } = useMessage(messageId)
  const { markRead } = useMarkAsRead()
  const { deleteMessage } = useDeleteMessage()
  const { pinMessage, unpinMessage } = usePinMessage()

  useEffect(() => {
    if (message && message.status === 'unread') {
      markRead(messageId)
    }
  }, [messageId, message, markRead])

  const formatTime = (ts: number) => {
    const date = new Date(ts * 1000)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">紧急</Badge>
      case 'high':
        return <Badge variant="default" className="bg-yellow-500">高</Badge>
      case 'low':
        return <Badge variant="secondary">低</Badge>
      default:
        return <Badge variant="outline">普通</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      system: '系统',
      approval: '审批',
      task: '任务',
      mention: '提及',
      chat: '聊天',
    }
    return labels[type] || type
  }

  const handleDelete = async () => {
    if (window.confirm('确定要删除这条消息吗？')) {
      await deleteMessage(messageId)
      onBack?.()
    }
  }

  const handlePin = async () => {
    if (message?.pinned) {
      await unpinMessage(messageId)
    } else {
      await pinMessage(messageId)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full gap-4', className)}>
        <div className="text-muted-foreground">消息不存在</div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            返回
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <span className="font-medium">消息详情</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePin}>
            <Pin className={cn('h-4 w-4', message.pinned && 'fill-current')} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{getTypeLabel(message.msgType)}</Badge>
              {getPriorityBadge(message.priority)}
              {message.status === 'unread' && (
                <Badge variant="default" className="bg-blue-500">未读</Badge>
              )}
              {message.pinned && (
                <Badge variant="secondary">
                  <Pin className="h-3 w-3 mr-1" />
                  置顶
                </Badge>
              )}
            </div>

            <Separator />

            {/* Title */}
            <div>
              <h2 className="text-lg font-semibold">{message.title}</h2>
            </div>

            {/* Sender Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {message.sender?.name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="font-medium text-foreground">{message.sender?.name || '未知'}</div>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {formatTime(message.createdAt)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>

            {/* Edit History */}
            {message.edited && (
              <>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <Edit2 className="h-3 w-3 inline mr-1" />
                  此消息已被编辑
                </div>
              </>
            )}

            {/* Recalled */}
            {message.recalled && (
              <>
                <Separator />
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <RotateCcw className="h-3 w-3 inline mr-1" />
                  此消息已被撤回
                </div>
              </>
            )}

            {/* Action URL */}
            {message.actionUrl && (
              <>
                <Separator />
                <div>
                  <Button variant="outline" asChild>
                    <a href={message.actionUrl} target="_blank" rel="noopener noreferrer">
                      查看详情
                    </a>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
