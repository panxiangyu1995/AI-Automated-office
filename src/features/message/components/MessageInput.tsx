/**
 * 消息输入组件
 */

import { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  placeholder?: string;
  onSend: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  placeholder = '输入消息...',
  onSend,
  disabled = false,
  className,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        'border-t bg-white p-3 transition-all',
        isFocused && 'shadow-md',
        className
      )}
    >
      <div className="flex items-end gap-2">
        {/* 附件按钮 */}
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="shrink-0"
          title="添加附件"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* 输入框 */}
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none"
            style={{
              height: 'auto',
              overflow: 'hidden',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* 表情按钮 */}
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="shrink-0"
          title="添加表情"
        >
          <Smile className="w-5 h-5" />
        </Button>

        {/* 发送按钮 */}
        <Button
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          className="shrink-0"
          size="icon"
          title="发送消息"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
