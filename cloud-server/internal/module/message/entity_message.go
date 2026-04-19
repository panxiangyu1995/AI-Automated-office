package message

import (
	"time"
)

// MessageType 消息类型
type MessageType string

const (
	MessageTypeSystem   MessageType = "system"
	MessageTypeApproval MessageType = "approval"
	MessageTypeTask     MessageType = "task"
	MessageTypeMention  MessageType = "mention"
	MessageTypeChat     MessageType = "chat"
)

// MessagePriority 消息优先级
type MessagePriority string

const (
	PriorityLow    MessagePriority = "low"
	PriorityNormal MessagePriority = "normal"
	PriorityHigh   MessagePriority = "high"
	PriorityUrgent MessagePriority = "urgent"
)

// MessageStatus 消息状态
type MessageStatus string

const (
	StatusUnread    MessageStatus = "unread"
	StatusRead     MessageStatus = "read"
	StatusArchived  MessageStatus = "archived"
)

// RecipientType 接收者类型
type RecipientType string

const (
	RecipientUser      RecipientType = "user"
	RecipientDepartment RecipientType = "department"
	RecipientAll       RecipientType = "all"
)

// Message 消息实体
type Message struct {
	ID             string           `json:"id" db:"id"`
	TenantID       string           `json:"tenant_id" db:"tenant_id"`
	MsgType        MessageType      `json:"msg_type" db:"msg_type"`
	Title          string           `json:"title" db:"title"`
	Content        string           `json:"content" db:"content"`
	SenderID       string           `json:"sender_id" db:"sender_id"`
	SenderName     string           `json:"sender_name" db:"sender_name"`
	SenderAvatar   *string          `json:"sender_avatar,omitempty" db:"sender_avatar"`
	RecipientID    string           `json:"recipient_id" db:"recipient_id"`
	RecipientType  RecipientType     `json:"recipient_type" db:"recipient_type"`
	Priority       MessagePriority   `json:"priority" db:"priority"`
	Status         MessageStatus     `json:"status" db:"status"`
	ActionURL      *string          `json:"action_url,omitempty" db:"action_url"`
	Metadata       *string          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt      int64            `json:"created_at" db:"created_at"`
	ReadAt         *int64           `json:"read_at,omitempty" db:"read_at"`
	Pinned         bool             `json:"pinned" db:"pinned"`
	PinnedAt       *int64           `json:"pinned_at,omitempty" db:"pinned_at"`
	Edited         bool             `json:"edited" db:"edited"`
	EditedAt       *int64           `json:"edited_at,omitempty" db:"edited_at"`
	EditHistory    *string          `json:"edit_history,omitempty" db:"edit_history"`
	Recalled       bool             `json:"recalled" db:"recalled"`
	RecalledAt     *int64           `json:"recalled_at,omitempty" db:"recalled_at"`
	OriginalContent *string          `json:"original_content,omitempty" db:"original_content"`
	DeletedAt      *int64           `json:"deleted_at,omitempty" db:"deleted_at"`
	Version        int              `json:"version" db:"version"`
	SyncStatus     string           `json:"sync_status" db:"sync_status"`
	SyncedAt       *int64           `json:"synced_at,omitempty" db:"synced_at"`
}

// MessageListItem 消息列表项
type MessageListItem struct {
	TenantID    string         `json:"tenant_id"`
	SenderID    string         `json:"sender_id"`
	ID          string         `json:"id"`
	MsgType     MessageType    `json:"msg_type"`
	Title       string         `json:"title"`
	SenderName  string         `json:"sender_name"`
	Status      MessageStatus  `json:"status"`
	Priority    MessagePriority `json:"priority"`
	CreatedAt   int64          `json:"created_at"`
}

// UnreadCount 未读计数
type UnreadCount struct {
	Total     int64 `json:"total"`
	System    int64 `json:"system"`
	Approval  int64 `json:"approval"`
	Task      int64 `json:"task"`
	Mention   int64 `json:"mention"`
	Chat      int64 `json:"chat"`
}

// DeliveryStatus 投递状态
type DeliveryStatus string

const (
	DeliveryPending   DeliveryStatus = "pending"
	DeliverySent     DeliveryStatus = "sent"
	DeliveryDelivered DeliveryStatus = "delivered"
	DeliveryRead     DeliveryStatus = "read"
)

// MessageStatusEntry 消息状态追踪
type MessageStatusEntry struct {
	ID           string         `json:"id" db:"id"`
	MessageID    string         `json:"message_id" db:"message_id"`
	TenantID     string         `json:"tenant_id" db:"tenant_id"`
	SenderID     string         `json:"sender_id" db:"sender_id"`
	RecipientID  string         `json:"recipient_id" db:"recipient_id"`
	Status       DeliveryStatus `json:"status" db:"status"`
	SentAt       *int64         `json:"sent_at,omitempty" db:"sent_at"`
	DeliveredAt  *int64         `json:"delivered_at,omitempty" db:"delivered_at"`
	ReadAt       *int64         `json:"read_at,omitempty" db:"read_at"`
	CreatedAt    int64          `json:"created_at" db:"created_at"`
	UpdatedAt    int64          `json:"updated_at" db:"updated_at"`
}

// NotificationPreferences 通知偏好
type NotificationPreferences struct {
	ID                 string `json:"id" db:"id"`
	TenantID           string `json:"tenant_id" db:"tenant_id"`
	UserID             string `json:"user_id" db:"user_id"`
	DoNotDisturbEnabled bool   `json:"do_not_disturb_enabled" db:"do_not_disturb_enabled"`
	DNDStartTime       *string `json:"dnd_start_time,omitempty" db:"dnd_start_time"`
	DNDEndTime         *string `json:"dnd_end_time,omitempty" db:"dnd_end_time"`
	DNDDays            *string `json:"dnd_days,omitempty" db:"dnd_days"`
	ChannelInApp       bool    `json:"channel_in_app" db:"channel_in_app"`
	ChannelEmail       bool    `json:"channel_email" db:"channel_email"`
	ChannelPush        bool    `json:"channel_push" db:"channel_push"`
	TypeSystem         bool    `json:"type_system" db:"type_system"`
	TypeApproval       bool    `json:"type_approval" db:"type_approval"`
	TypeTask           bool    `json:"type_task" db:"type_task"`
	TypeMention       bool    `json:"type_mention" db:"type_mention"`
	TypeChat           bool    `json:"type_chat" db:"type_chat"`
	CreatedAt          int64   `json:"created_at" db:"created_at"`
	UpdatedAt          int64   `json:"updated_at" db:"updated_at"`
}

// Announcement 公告
type Announcement struct {
	ID          string    `json:"id" db:"id"`
	TenantID    string    `json:"tenant_id" db:"tenant_id"`
	Title       string    `json:"title" db:"title"`
	Content     string    `json:"content" db:"content"`
	AuthorID    string    `json:"author_id" db:"author_id"`
	AuthorName  string    `json:"author_name" db:"author_name"`
	Priority    MessagePriority `json:"priority" db:"priority"`
	TargetType  string    `json:"target_type" db:"target_type"`
	TargetValue *string   `json:"target_value,omitempty" db:"target_value"`
	Pinned      bool      `json:"pinned" db:"pinned"`
	PublishedAt *int64    `json:"published_at,omitempty" db:"published_at"`
	ExpiresAt   *int64    `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt   int64     `json:"created_at" db:"created_at"`
	UpdatedAt   int64     `json:"updated_at" db:"updated_at"`
	DeletedAt   *int64    `json:"deleted_at,omitempty" db:"deleted_at"`
}

// AnnouncementRead 公告已读记录
type AnnouncementRead struct {
	ID             string `json:"id" db:"id"`
	AnnouncementID string `json:"announcement_id" db:"announcement_id"`
	TenantID       string `json:"tenant_id" db:"tenant_id"`
	UserID         string `json:"user_id" db:"user_id"`
	ReadAt         int64  `json:"read_at" db:"read_at"`
}

// GroupMessage 群消息
type GroupMessage struct {
	ID              string   `json:"id" db:"id"`
	TenantID        string   `json:"tenant_id" db:"tenant_id"`
	GroupID         string   `json:"group_id" db:"group_id"`
	SenderID        string   `json:"sender_id" db:"sender_id"`
	SenderType      string   `json:"sender_type" db:"sender_type"`
	SenderName      string   `json:"sender_name" db:"sender_name"`
	Content         string   `json:"content" db:"content"`
	Mentions        *string  `json:"mentions,omitempty" db:"mentions"`
	ReplyTo         *string  `json:"reply_to,omitempty" db:"reply_to"`
	AgentResponseID *string  `json:"agent_response_id,omitempty" db:"agent_response_id"`
	CreatedAt       int64    `json:"created_at" db:"created_at"`
	UpdatedAt       int64    `json:"updated_at" db:"updated_at"`
	DeletedAt       *int64   `json:"deleted_at,omitempty" db:"deleted_at"`
}

// MessageAuditLog 消息审计日志
type MessageAuditLog struct {
	ID           string    `json:"id" db:"id"`
	TenantID     string    `json:"tenant_id" db:"tenant_id"`
	Action       string    `json:"action" db:"action"`
	MessageID    string    `json:"message_id" db:"message_id"`
	SenderID     *string   `json:"sender_id,omitempty" db:"sender_id"`
	RecipientID   *string   `json:"recipient_id,omitempty" db:"recipient_id"`
	Content      *string   `json:"content,omitempty" db:"content"`
	Metadata     *string   `json:"metadata,omitempty" db:"metadata"`
	OperatorID   string    `json:"operator_id" db:"operator_id"`
	OperatorName string    `json:"operator_name" db:"operator_name"`
	CreatedAt    int64     `json:"created_at" db:"created_at"`
	ExpiresAt    int64     `json:"expires_at" db:"expires_at"`
}

// Now returns current timestamp in milliseconds
func Now() int64 {
	return time.Now().UnixMilli()
}
