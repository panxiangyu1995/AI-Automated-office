# 设计文档 - 消息系统UI组件

## 涉及文件

### 新增
- `src/features/message/components/MessageList.tsx` - 消息列表
- `src/features/message/components/MessageItem.tsx` - 单条消息
- `src/features/message/components/MessageInput.tsx` - 消息输入

## 修改方案

### 1. MessageList组件

```typescript
// 消息列表组件
export function MessageList() {
  // 使用 message 模块获取消息
  // 支持分页加载
  // 支持搜索过滤
}
```

### 2. MessageItem组件

```typescript
// 单条消息展示
export function MessageItem({ message }: { message: Message }) {
  // 展示消息内容
  // 支持多种消息类型（文本、图片、文件）
  // 支持时间显示
}
```

### 3. MessageInput组件

```typescript
// 消息输入组件
export function MessageInput({ onSend }: { onSend: (content: string) => void }) {
  // 支持文本输入
  // 支持文件上传
  // 支持@提及
}
```
