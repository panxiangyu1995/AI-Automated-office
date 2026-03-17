// WebSocket 消息类型定义
// 对应 spec.md 中的数据规格定义

export interface WebSocketMessage {
  type: 'ping' | 'pong' | 'subscribe' | 'unsubscribe' | 'action'
  payload: unknown
  timestamp: number
}

export interface WebSocketNotification {
  type: 'notification' | 'task_update' | 'message' | 'sync'
  payload: unknown
  timestamp: number
}

export interface NetworkStatus {
  isOnline: boolean
  connectionType: 'wifi' | 'ethernet' | 'cellular' | 'unknown'
  lastChecked: number
}
