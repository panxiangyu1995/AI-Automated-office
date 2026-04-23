package message

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// MessageStore 消息存储库
type MessageStore struct {
	db *sql.DB
}

// NewMessageStore 创建消息存储库
func NewMessageStore(db *sql.DB) *MessageStore {
	return &MessageStore{db: db}
}

// Create 创建消息
func (s *MessageStore) Create(ctx context.Context, msg *Message) error {
	query := `
		INSERT INTO messages (
			id, tenant_id, msg_type, title, content, sender_id, sender_name, sender_avatar,
			recipient_id, recipient_type, priority, status, action_url, metadata,
			created_at, pinned, edited, recalled, version, sync_status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12, $13, $14,
			$15, $16, $17, $18, $19, $20
		)`

	_, err := s.db.ExecContext(ctx, query,
		msg.ID, msg.TenantID, msg.MsgType, msg.Title, msg.Content,
		msg.SenderID, msg.SenderName, msg.SenderAvatar,
		msg.RecipientID, msg.RecipientType, msg.Priority, msg.Status,
		msg.ActionURL, msg.Metadata, msg.CreatedAt, msg.Pinned,
		msg.Edited, msg.Recalled, msg.Version, msg.SyncStatus,
	)
	return err
}

// GetByID 根据ID获取消息
func (s *MessageStore) GetByID(ctx context.Context, tenantID, id string) (*Message, error) {
	query := `
		SELECT id, tenant_id, msg_type, title, content, sender_id, sender_name, sender_avatar,
			recipient_id, recipient_type, priority, status, action_url, metadata,
			created_at, read_at, pinned, pinned_at, edited, edited_at, edit_history,
			recalled, recalled_at, original_content, deleted_at, version, sync_status, synced_at
		FROM messages
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`

	msg := &Message{}
	err := s.db.QueryRowContext(ctx, query, id, tenantID).Scan(
		&msg.ID, &msg.TenantID, &msg.MsgType, &msg.Title, &msg.Content,
		&msg.SenderID, &msg.SenderName, &msg.SenderAvatar,
		&msg.RecipientID, &msg.RecipientType, &msg.Priority, &msg.Status,
		&msg.ActionURL, &msg.Metadata, &msg.CreatedAt, &msg.ReadAt,
		&msg.Pinned, &msg.PinnedAt, &msg.Edited, &msg.EditedAt, &msg.EditHistory,
		&msg.Recalled, &msg.RecalledAt, &msg.OriginalContent, &msg.DeletedAt,
		&msg.Version, &msg.SyncStatus, &msg.SyncedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return msg, nil
}

// ListByRecipient 获取接收者的消息列表
func (s *MessageStore) ListByRecipient(ctx context.Context, tenantID, recipientID string, limit, offset int) ([]Message, error) {
	query := `
		SELECT id, tenant_id, msg_type, title, content, sender_id, sender_name, sender_avatar,
			recipient_id, recipient_type, priority, status, action_url, metadata,
			created_at, read_at, pinned, pinned_at, edited, edited_at, edit_history,
			recalled, recalled_at, original_content, deleted_at, version, sync_status, synced_at
		FROM messages
		WHERE tenant_id = $1 AND recipient_id = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := s.db.QueryContext(ctx, query, tenantID, recipientID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		err := rows.Scan(
			&msg.ID, &msg.TenantID, &msg.MsgType, &msg.Title, &msg.Content,
			&msg.SenderID, &msg.SenderName, &msg.SenderAvatar,
			&msg.RecipientID, &msg.RecipientType, &msg.Priority, &msg.Status,
			&msg.ActionURL, &msg.Metadata, &msg.CreatedAt, &msg.ReadAt,
			&msg.Pinned, &msg.PinnedAt, &msg.Edited, &msg.EditedAt, &msg.EditHistory,
			&msg.Recalled, &msg.RecalledAt, &msg.OriginalContent, &msg.DeletedAt,
			&msg.Version, &msg.SyncStatus, &msg.SyncedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, rows.Err()
}

// UpdateStatus 更新消息状态
func (s *MessageStore) UpdateStatus(ctx context.Context, tenantID, id string, status MessageStatus) error {
	var query string
	var args []interface{}

	if status == StatusRead {
		query = `UPDATE messages SET status = $1, read_at = $2, version = version + 1 WHERE id = $3 AND tenant_id = $4`
		args = []interface{}{status, Now(), id, tenantID}
	} else {
		query = `UPDATE messages SET status = $1, version = version + 1 WHERE id = $2 AND tenant_id = $3`
		args = []interface{}{status, id, tenantID}
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("message not found")
	}
	return nil
}

// Update 更新消息
func (s *MessageStore) Update(ctx context.Context, msg *Message) error {
	query := `
		UPDATE messages SET
			title = $1, content = $2, priority = $3, status = $4,
			edited = $5, edited_at = $6, edit_history = $7,
			recalled = $8, recalled_at = $9, original_content = $10,
			pinned = $11, pinned_at = $12,
			version = version + 1
		WHERE id = $13 AND tenant_id = $14`

	_, err := s.db.ExecContext(ctx, query,
		msg.Title, msg.Content, msg.Priority, msg.Status,
		msg.Edited, msg.EditedAt, msg.EditHistory,
		msg.Recalled, msg.RecalledAt, msg.OriginalContent,
		msg.Pinned, msg.PinnedAt,
		msg.ID, msg.TenantID,
	)
	return err
}

// SoftDelete 软删除消息
func (s *MessageStore) SoftDelete(ctx context.Context, tenantID, id string) error {
	query := `UPDATE messages SET deleted_at = $1, version = version + 1 WHERE id = $2 AND tenant_id = $3`
	result, err := s.db.ExecContext(ctx, query, Now(), id, tenantID)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("message not found")
	}
	return nil
}

// CountUnreadByRecipient 统计未读消息数
func (s *MessageStore) CountUnreadByRecipient(ctx context.Context, tenantID, recipientID string) (*UnreadCount, error) {
	query := `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN msg_type = 'system' THEN 1 END) as system,
			COUNT(CASE WHEN msg_type = 'approval' THEN 1 END) as approval,
			COUNT(CASE WHEN msg_type = 'task' THEN 1 END) as task,
			COUNT(CASE WHEN msg_type = 'mention' THEN 1 END) as mention,
			COUNT(CASE WHEN msg_type = 'chat' THEN 1 END) as chat
		FROM messages
		WHERE tenant_id = $1 AND recipient_id = $2 AND status = 'unread' AND deleted_at IS NULL`

	count := &UnreadCount{}
	err := s.db.QueryRowContext(ctx, query, tenantID, recipientID).Scan(
		&count.Total, &count.System, &count.Approval,
		&count.Task, &count.Mention, &count.Chat,
	)
	if err != nil {
		return nil, err
	}
	return count, nil
}

// Search 搜索消息
func (s *MessageStore) Search(ctx context.Context, tenantID, recipientID string, req *SearchMessageRequest) (*SearchMessageResponse, error) {
	var conditions []string
	var args []interface{}

	conditions = append(conditions, "tenant_id = $1 AND recipient_id = $2 AND deleted_at IS NULL")
	args = append(args, tenantID, recipientID)
	argIndex := 3

	if req.Keyword != nil && *req.Keyword != "" {
		conditions = append(conditions, fmt.Sprintf("(title LIKE $%d OR content LIKE $%d)", argIndex, argIndex+1))
		keyword := "%" + *req.Keyword + "%"
		args = append(args, keyword, keyword)
		argIndex += 2
	}

	if req.MsgType != nil {
		conditions = append(conditions, fmt.Sprintf("msg_type = $%d", argIndex))
		args = append(args, *req.MsgType)
		argIndex++
	}

	if req.Priority != nil {
		conditions = append(conditions, fmt.Sprintf("priority = $%d", argIndex))
		args = append(args, *req.Priority)
		argIndex++
	}

	if req.Status != nil {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.SenderID != nil {
		conditions = append(conditions, fmt.Sprintf("sender_id = $%d", argIndex))
		args = append(args, *req.SenderID)
		argIndex++
	}

	if req.StartDate != nil {
		conditions = append(conditions, fmt.Sprintf("created_at >= $%d", argIndex))
		args = append(args, *req.StartDate)
		argIndex++
	}

	if req.EndDate != nil {
		conditions = append(conditions, fmt.Sprintf("created_at <= $%d", argIndex))
		args = append(args, *req.EndDate)
		argIndex++
	}

	if req.PinnedOnly != nil && *req.PinnedOnly {
		conditions = append(conditions, "pinned = TRUE")
	}

	// Count total
	countQuery := "SELECT COUNT(*) FROM messages WHERE " + strings.Join(conditions, " AND ")
	var total int64
	if err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	// Pagination
	page := req.Page
	if page < 1 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	// Query messages
	query := fmt.Sprintf(`
		SELECT id, tenant_id, msg_type, title, sender_id, sender_name, status, priority, created_at
		FROM messages
		WHERE %s
		ORDER BY pinned DESC, created_at DESC
		LIMIT $%d OFFSET $%d`, strings.Join(conditions, " AND "), argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []MessageListItem
	for rows.Next() {
		var msg MessageListItem
		if err := rows.Scan(&msg.ID, &msg.TenantID, &msg.MsgType, &msg.Title,
			&msg.SenderID, &msg.SenderName, &msg.Status, &msg.Priority, &msg.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return &SearchMessageResponse{
		Messages:   messages,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetPinned 获取置顶消息
func (s *MessageStore) GetPinned(ctx context.Context, tenantID, recipientID string) ([]PinnedMessage, error) {
	query := `
		SELECT message_id, pinned_at
		FROM messages
		WHERE tenant_id = $1 AND recipient_id = $2 AND pinned = TRUE AND deleted_at IS NULL
		ORDER BY pinned_at DESC`

	rows, err := s.db.QueryContext(ctx, query, tenantID, recipientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pinned []PinnedMessage
	for rows.Next() {
		var p PinnedMessage
		if err := rows.Scan(&p.MessageID, &p.PinnedAt); err != nil {
			return nil, err
		}
		pinned = append(pinned, p)
	}
	return pinned, rows.Err()
}

// CreateMessageStatus 创建消息状态追踪
func (s *MessageStore) CreateMessageStatus(ctx context.Context, status *MessageStatusEntry) error {
	query := `
		INSERT INTO message_status (
			id, message_id, tenant_id, sender_id, recipient_id, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := s.db.ExecContext(ctx, query,
		status.ID, status.MessageID, status.TenantID, status.SenderID,
		status.RecipientID, status.Status, status.CreatedAt, status.UpdatedAt,
	)
	return err
}

// UpdateMessageStatus 更新消息投递状态
func (s *MessageStore) UpdateMessageStatus(ctx context.Context, messageID string, status DeliveryStatus) error {
	var query string
	var args []interface{}
	now := Now()

	switch status {
	case DeliverySent:
		query = `UPDATE message_status SET status = $1, sent_at = $2, updated_at = $3 WHERE message_id = $4`
		args = []interface{}{status, now, now, messageID}
	case DeliveryDelivered:
		query = `UPDATE message_status SET status = $1, delivered_at = $2, updated_at = $3 WHERE message_id = $4`
		args = []interface{}{status, now, now, messageID}
	case DeliveryRead:
		query = `UPDATE message_status SET status = $1, read_at = $2, updated_at = $3 WHERE message_id = $4`
		args = []interface{}{status, now, now, messageID}
	default:
		return fmt.Errorf("invalid status: %s", status)
	}

	_, err := s.db.ExecContext(ctx, query, args...)
	return err
}

// GetMessageStatus 获取消息投递状态
func (s *MessageStore) GetMessageStatus(ctx context.Context, messageID string) (*MessageStatusEntry, error) {
	query := `
		SELECT id, message_id, tenant_id, sender_id, recipient_id, status,
			sent_at, delivered_at, read_at, created_at, updated_at
		FROM message_status WHERE message_id = $1`

	var entry MessageStatusEntry
	err := s.db.QueryRowContext(ctx, query, messageID).Scan(
		&entry.ID, &entry.MessageID, &entry.TenantID, &entry.SenderID, &entry.RecipientID,
		&entry.Status, &entry.SentAt, &entry.DeliveredAt, &entry.ReadAt,
		&entry.CreatedAt, &entry.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// GetRecipientStatus 获取接收者的所有投递状态
func (s *MessageStore) GetRecipientStatus(ctx context.Context, tenantID, recipientID string) ([]MessageStatusEntry, error) {
	query := `
		SELECT id, message_id, tenant_id, sender_id, recipient_id, status,
			sent_at, delivered_at, read_at, created_at, updated_at
		FROM message_status WHERE tenant_id = $1 AND recipient_id = $2`

	rows, err := s.db.QueryContext(ctx, query, tenantID, recipientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []MessageStatusEntry
	for rows.Next() {
		var entry MessageStatusEntry
		if err := rows.Scan(
			&entry.ID, &entry.MessageID, &entry.TenantID, &entry.SenderID, &entry.RecipientID,
			&entry.Status, &entry.SentAt, &entry.DeliveredAt, &entry.ReadAt,
			&entry.CreatedAt, &entry.UpdatedAt,
		); err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

// GenerateID 生成唯一ID
func GenerateID() string {
	return uuid.New().String()
}
