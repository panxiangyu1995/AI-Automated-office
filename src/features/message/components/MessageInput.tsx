/**
 * Message Input Component
 * 消息输入组件
 */

import { useState, useCallback } from 'react'
import { Send, Paperclip, Image, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useSendMessage } from '../hooks/useMessage'
import type { MessageType } from '../types/message.types'

interface MessageInputProps {
  recipientId?: string
  recipientType?: 'user' | 'department' | 'all'
  defaultMsgType?: MessageType
  placeholder?: string
  onSend?: (messageId: string) => void
  className?: string
}

export function MessageInput({
  recipientId = '',
  recipientType = 'user',
  defaultMsgType = 'chat',
  placeholder = '输入消息...',
  onSend,
  className,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [msgType, setMsgType] = useState<MessageType>(defaultMsgType)
  const [isSending, setIsSending] = useState(false)

  const { sendMessage } = useSendMessage()

  const handleSend = useCallback(async () => {
    if (!content.trim() || isSending) return

    setIsSending(true)
    try {
      const result = await sendMessage({
        msgType,
        title: content.slice(0, 50),
        content: content.trim(),
        recipientId,
        recipientType,
      })

      if (result) {
        setContent('')
        onSend?.(result.id)
      }
    } finally {
      setIsSending(false)
    }
  }, [content, msgType, recipientId, recipientType, sendMessage, onSend, isSending])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const msgTypes: { value: MessageType; label: string; color: string }[] = [
    { value: 'chat', label: '聊天', color: 'bg-blue-500' },
    { value: 'task', label: '任务', color: 'bg-green-500' },
    { value: 'approval', label: '审批', color: 'bg-yellow-500' },
    { value: 'mention', label: '提及', color: 'bg-purple-500' },
    { value: 'system', label: '系统', color: 'bg-gray-500' },
  ]

  const currentType = msgTypes.find((t) => t.value === msgType) || msgTypes[0]

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Message Type Selector */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <span
                className={cn('w-2 h-2 rounded-full mr-2', currentType.color)}
              />
              {currentType.label}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-40 p-1">
            <div className="flex flex-col gap-1">
              {msgTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={msgType === type.value ? 'secondary' : 'ghost'}
                  size="sm"
                  className="justify-start h-8"
                  onClick={() => setMsgType(type.value)}
                >
                  <span
                    className={cn('w-2 h-2 rounded-full mr-2', type.color)}
                  />
                  {type.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {recipientId && (
          <Badge variant="outline" className="text-xs">
            发送给: {recipientId}
          </Badge>
        )}
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] max-h-[200px] resize-none pr-20"
            disabled={isSending}
          />

          {/* Action Buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {}}
              disabled={isSending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {}}
              disabled={isSending}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {}}
              disabled={isSending}
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          size="icon"
          className="h-10 w-10"
          onClick={handleSend}
          disabled={isSending || !content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Hint */}
      <div className="text-xs text-muted-foreground">
        按 Enter 发送，Shift+Enter 换行
      </div>
    </div>
  )
}
