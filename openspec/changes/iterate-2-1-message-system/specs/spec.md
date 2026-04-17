# 规格文档 - 消息系统UI组件

## MessageList组件

```typescript
interface MessageListProps {
  filter?: MessageFilter;
  pageSize?: number;
  onMessageClick?: (message: Message) => void;
}

function MessageList({ filter, pageSize, onMessageClick }: MessageListProps)
```

## MessageItem组件

```typescript
interface MessageItemProps {
  message: Message;
  showAvatar?: boolean;
  onReply?: (message: Message) => void;
}

function MessageItem({ message, showAvatar, onReply }: MessageItemProps)
```

## MessageInput组件

```typescript
interface MessageInputProps {
  placeholder?: string;
  onSend: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
}

function MessageInput({ placeholder, onSend, disabled }: MessageInputProps)
```
