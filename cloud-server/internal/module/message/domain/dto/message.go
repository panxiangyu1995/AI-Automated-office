package message

// CreateMessageRequest 创建消息请求
type CreateMessageRequest struct {
	MsgType       MessageType    `json:"msg_type" binding:"required"`
	Title         string         `json:"title" binding:"required,min=1,max=200"`
	Content       string         `json:"content" binding:"required,min=1,max=5000"`
	RecipientID   string         `json:"recipient_id" binding:"required"`
	RecipientType RecipientType  `json:"recipient_type" binding:"required"`
	Priority      *MessagePriority `json:"priority,omitempty"`
	ActionURL     *string        `json:"action_url,omitempty"`
}

// UpdateMessageRequest 更新消息请求
type UpdateMessageRequest struct {
	Title     *string `json:"title,omitempty"`
	Content   *string `json:"content,omitempty"`
	Priority  *MessagePriority `json:"priority,omitempty"`
}

// SearchMessageRequest 搜索消息请求
type SearchMessageRequest struct {
	Keyword    *string         `json:"keyword,omitempty"`
	MsgType    *MessageType    `json:"msg_type,omitempty"`
	Priority   *MessagePriority `json:"priority,omitempty"`
	Status     *MessageStatus  `json:"status,omitempty"`
	SenderID   *string         `json:"sender_id,omitempty"`
	StartDate  *int64          `json:"start_date,omitempty"`
	EndDate    *int64          `json:"end_date,omitempty"`
	PinnedOnly *bool           `json:"pinned_only,omitempty"`
	Page       int             `json:"page,omitempty"`
	PageSize   int             `json:"page_size,omitempty"`
}

// FilterMessageRequest 筛选消息请求
type FilterMessageRequest struct {
	MsgType       *MessageType    `json:"msg_type,omitempty"`
	Priority      *MessagePriority `json:"priority,omitempty"`
	Status        *MessageStatus  `json:"status,omitempty"`
	SenderID      *string         `json:"sender_id,omitempty"`
	StartDate     *int64          `json:"start_date,omitempty"`
	EndDate       *int64          `json:"end_date,omitempty"`
	PinnedOnly    bool            `json:"pinned_only"`
	SearchKeyword *string         `json:"search_keyword,omitempty"`
}

// PinMessageRequest 置顶消息请求
type PinMessageRequest struct {
	Reason *string `json:"reason,omitempty"`
}

// CreateAnnouncementRequest 创建公告请求
type CreateAnnouncementRequest struct {
	Title       string          `json:"title" binding:"required,min=1,max=200"`
	Content     string          `json:"content" binding:"required,min=1,max=10000"`
	Priority    MessagePriority `json:"priority,omitempty"`
	TargetType  string          `json:"target_type" binding:"required"`
	TargetValue *string         `json:"target_value,omitempty"`
	ExpiresAt   *int64          `json:"expires_at,omitempty"`
}

// UpdateAnnouncementRequest 更新公告请求
type UpdateAnnouncementRequest struct {
	Title      *string          `json:"title,omitempty"`
	Content    *string          `json:"content,omitempty"`
	Priority   *MessagePriority `json:"priority,omitempty"`
	Pinned     *bool            `json:"pinned,omitempty"`
	ExpiresAt  *int64           `json:"expires_at,omitempty"`
}

// SendGroupMessageRequest 发送群消息请求
type SendGroupMessageRequest struct {
	GroupID  string   `json:"group_id" binding:"required"`
	Content  string   `json:"content" binding:"required,min=1,max=5000"`
	Mentions []string `json:"mentions,omitempty"`
	ReplyTo  *string  `json:"reply_to,omitempty"`
}

// UpdatePreferencesRequest 更新通知偏好请求
type UpdatePreferencesRequest struct {
	DoNotDisturbEnabled *bool    `json:"do_not_disturb_enabled,omitempty"`
	DNDStartTime        *string  `json:"dnd_start_time,omitempty"`
	DNDEndTime          *string  `json:"dnd_end_time,omitempty"`
	DNDDays             []int    `json:"dnd_days,omitempty"`
	ChannelInApp        *bool    `json:"channel_in_app,omitempty"`
	ChannelEmail        *bool    `json:"channel_email,omitempty"`
	ChannelPush         *bool    `json:"channel_push,omitempty"`
	TypeSystem          *bool    `json:"type_system,omitempty"`
	TypeApproval        *bool    `json:"type_approval,omitempty"`
	TypeTask            *bool    `json:"type_task,omitempty"`
	TypeMention        *bool    `json:"type_mention,omitempty"`
	TypeChat            *bool    `json:"type_chat,omitempty"`
}

// SearchMessageResponse 搜索消息响应
type SearchMessageResponse struct {
	Messages   []MessageListItem `json:"messages"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"page_size"`
	TotalPages int               `json:"total_pages"`
}

// PinnedMessage 置顶消息
type PinnedMessage struct {
	MessageID string `json:"message_id"`
	PinnedAt  int64  `json:"pinned_at"`
	Reason    string `json:"reason,omitempty"`
}

// ExportFormat 导出格式
type ExportFormat string

const (
	ExportFormatCSV  ExportFormat = "csv"
	ExportFormatJSON ExportFormat = "json"
	ExportFormatTxt  ExportFormat = "txt"
)

// ExportRequest 导出请求
type ExportRequest struct {
	Filter          FilterMessageRequest `json:"filter"`
	Format          ExportFormat         `json:"format" binding:"required"`
	IncludeContent  bool                 `json:"include_content"`
}

// ExportResult 导出结果
type ExportResult struct {
	Format       ExportFormat `json:"format"`
	Filename     string       `json:"filename"`
	Data         string       `json:"data"`
	MessageCount int64        `json:"message_count"`
}

// RecallResult 撤回结果
type RecallResult struct {
	Success    bool    `json:"success"`
	MessageID  string  `json:"message_id"`
	RecalledAt int64   `json:"recalled_at"`
	Reason     *string `json:"reason,omitempty"`
}

// EditResult 编辑结果
type EditResult struct {
	Success    bool   `json:"success"`
	MessageID  string `json:"message_id"`
	EditedAt   int64  `json:"edited_at"`
	OldContent string `json:"old_content"`
	NewContent string `json:"new_content"`
}

// EditHistoryEntry 编辑历史条目
type EditHistoryEntry struct {
	EditedAt   int64  `json:"edited_at"`
	OldContent string `json:"old_content"`
	NewContent string `json:"new_content"`
	EditedBy   string `json:"edited_by"`
}

// StatusChangeEvent 状态变更事件
type StatusChangeEvent struct {
	MessageID  string         `json:"message_id"`
	FromStatus DeliveryStatus `json:"from_status"`
	ToStatus   DeliveryStatus `json:"to_status"`
	ChangedAt  int64          `json:"changed_at"`
	ChangedBy  *string        `json:"changed_by,omitempty"`
}
