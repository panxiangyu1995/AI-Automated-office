# Design: 统一消息通知系统

## 技术方案

### 数据模型

```typescript
// 消息
interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  sender: Sender;
  recipientId: string;           // 接收者
  recipientType: 'user' | 'department' | 'all';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  actionUrl?: string;            // 点击跳转
  metadata?: Record<string, unknown>;
  createdAt: number;
  readAt?: number;
}

// 消息类型
type MessageType = 
  | 'system'           // 系统通知
  | 'approval'         // 审批通知
  | 'task'            // 任务提醒
  | 'mention'         // @提及
  | 'chat';            // 聊天消息

// 通知偏好
interface NotificationPreferences {
  userId: string;
  doNotDisturb: {
    enabled: boolean;
    startTime?: string;  // HH:mm
    endTime?: string;    // HH:mm
    days?: number[];     // 0-6
  };
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  types: Record<MessageType, boolean>;
}
```

### API 设计

```typescript
// 消息 API
POST   /api/messages                    // 发送消息
GET    /api/messages                   // 消息列表
GET    /api/messages/:id              // 消息详情
PUT    /api/messages/:id/read          // 标记已读
PUT    /api/messages/read-all         // 全部已读
DELETE /api/messages/:id               // 删除消息
GET    /api/messages/unread-count      // 未读数

// 偏好 API
GET    /api/messages/preferences       // 获取偏好
PUT    /api/messages/preferences       // 更新偏好
```

### 前端结构

```
src/features/message/
├── types/
│   └── message.types.ts
├── api/
│   └── messageApi.ts
├── stores/
│   └── messageStore.ts
├── components/
│   ├── MessageList.tsx
│   ├── MessageItem.tsx
│   ├── NotificationBell.tsx
│   └── PreferencesDialog.tsx
└── index.ts
```
