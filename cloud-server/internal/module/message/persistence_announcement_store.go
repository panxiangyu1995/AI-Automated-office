package message

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

// AnnouncementStore 公告存储库
type AnnouncementStore struct {
	db *sql.DB
}

// NewAnnouncementStore 创建公告存储库
func NewAnnouncementStore(db *sql.DB) *AnnouncementStore {
	return &AnnouncementStore{db: db}
}

// Create 创建公告
func (s *AnnouncementStore) Create(ctx context.Context, ann *Announcement) error {
	query := `
		INSERT INTO announcements (
			id, tenant_id, title, content, author_id, author_name, priority,
			target_type, target_value, pinned, published_at, expires_at, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		ann.ID, ann.TenantID, ann.Title, ann.Content, ann.AuthorID, ann.AuthorName,
		ann.Priority, ann.TargetType, ann.TargetValue, ann.Pinned, ann.PublishedAt,
		ann.ExpiresAt, ann.CreatedAt, ann.UpdatedAt,
	)
	return err
}

// GetByID 根据ID获取公告
func (s *AnnouncementStore) GetByID(ctx context.Context, tenantID, id string) (*Announcement, error) {
	query := `
		SELECT id, tenant_id, title, content, author_id, author_name, priority,
			target_type, target_value, pinned, published_at, expires_at, created_at, updated_at, deleted_at
		FROM announcements
		WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`

	ann := &Announcement{}
	err := s.db.QueryRowContext(ctx, query, id, tenantID).Scan(
		&ann.ID, &ann.TenantID, &ann.Title, &ann.Content, &ann.AuthorID, &ann.AuthorName,
		&ann.Priority, &ann.TargetType, &ann.TargetValue, &ann.Pinned, &ann.PublishedAt,
		&ann.ExpiresAt, &ann.CreatedAt, &ann.UpdatedAt, &ann.DeletedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return ann, nil
}

// List 获取公告列表
func (s *AnnouncementStore) List(ctx context.Context, tenantID string, userID string, limit, offset int) ([]Announcement, error) {
	query := `
		SELECT a.id, a.tenant_id, a.title, a.content, a.author_id, a.author_name, a.priority,
			a.target_type, a.target_value, a.pinned, a.published_at, a.expires_at,
			a.created_at, a.updated_at, a.deleted_at,
			CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as is_read
		FROM announcements a
		LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
		WHERE a.tenant_id = ? AND a.deleted_at IS NULL AND a.published_at IS NOT NULL
			AND (a.expires_at IS NULL OR a.expires_at > ?)
			AND (
				a.target_type = 'all' 
				OR (a.target_type = 'user' AND a.target_value = ?)
			)
		ORDER BY a.pinned DESC, a.published_at DESC
		LIMIT ? OFFSET ?`

	rows, err := s.db.QueryContext(ctx, query, userID, tenantID, Now(), userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var announcements []Announcement
	for rows.Next() {
		var ann Announcement
		var isRead int
		if err := rows.Scan(
			&ann.ID, &ann.TenantID, &ann.Title, &ann.Content, &ann.AuthorID, &ann.AuthorName,
			&ann.Priority, &ann.TargetType, &ann.TargetValue, &ann.Pinned, &ann.PublishedAt,
			&ann.ExpiresAt, &ann.CreatedAt, &ann.UpdatedAt, &ann.DeletedAt, &isRead,
		); err != nil {
			return nil, err
		}
		announcements = append(announcements, ann)
	}
	return announcements, rows.Err()
}

// Update 更新公告
func (s *AnnouncementStore) Update(ctx context.Context, ann *Announcement) error {
	query := `
		UPDATE announcements SET
			title = ?, content = ?, priority = ?, target_type = ?, target_value = ?,
			pinned = ?, expires_at = ?, updated_at = ?
		WHERE id = ? AND tenant_id = ?`

	result, err := s.db.ExecContext(ctx, query,
		ann.Title, ann.Content, ann.Priority, ann.TargetType, ann.TargetValue,
		ann.Pinned, ann.ExpiresAt, ann.UpdatedAt, ann.ID, ann.TenantID,
	)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("announcement not found")
	}
	return nil
}

// SoftDelete 软删除公告
func (s *AnnouncementStore) SoftDelete(ctx context.Context, tenantID, id string) error {
	query := `UPDATE announcements SET deleted_at = ? WHERE id = ? AND tenant_id = ?`
	result, err := s.db.ExecContext(ctx, query, Now(), id, tenantID)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("announcement not found")
	}
	return nil
}

// MarkRead 标记已读
func (s *AnnouncementStore) MarkRead(ctx context.Context, annID, tenantID, userID string) error {
	query := `
		INSERT INTO announcement_reads (id, announcement_id, tenant_id, user_id, read_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(announcement_id, user_id) DO NOTHING`

	_, err := s.db.ExecContext(ctx, query, GenerateID(), annID, tenantID, userID, Now())
	return err
}

// CountUnreadByUser 统计用户未读公告数
func (s *AnnouncementStore) CountUnreadByUser(ctx context.Context, tenantID, userID string) (int64, error) {
	query := `
		SELECT COUNT(*) FROM announcements a
		LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
		WHERE a.tenant_id = ? AND a.deleted_at IS NULL
			AND a.published_at IS NOT NULL
			AND (a.expires_at IS NULL OR a.expires_at > ?)
			AND (a.target_type = 'all' OR (a.target_type = 'user' AND a.target_value = ?))
			AND ar.id IS NULL`

	var count int64
	err := s.db.QueryRowContext(ctx, query, userID, tenantID, Now(), userID).Scan(&count)
	return count, err
}

// NotificationPreferencesStore 通知偏好存储库
type NotificationPreferencesStore struct {
	db *sql.DB
}

// NewNotificationPreferencesStore 创建通知偏好存储库
func NewNotificationPreferencesStore(db *sql.DB) *NotificationPreferencesStore {
	return &NotificationPreferencesStore{db: db}
}

// GetByUserID 获取用户的通知偏好
func (s *NotificationPreferencesStore) GetByUserID(ctx context.Context, tenantID, userID string) (*NotificationPreferences, error) {
	query := `
		SELECT id, tenant_id, user_id, do_not_disturb_enabled, dnd_start_time, dnd_end_time, dnd_days,
			channel_in_app, channel_email, channel_push,
			type_system, type_approval, type_task, type_mention, type_chat,
			created_at, updated_at
		FROM notification_preferences
		WHERE tenant_id = ? AND user_id = ?`

	pref := &NotificationPreferences{}
	err := s.db.QueryRowContext(ctx, query, tenantID, userID).Scan(
		&pref.ID, &pref.TenantID, &pref.UserID,
		&pref.DoNotDisturbEnabled, &pref.DNDStartTime, &pref.DNDEndTime, &pref.DNDDays,
		&pref.ChannelInApp, &pref.ChannelEmail, &pref.ChannelPush,
		&pref.TypeSystem, &pref.TypeApproval, &pref.TypeTask, &pref.TypeMention, &pref.TypeChat,
		&pref.CreatedAt, &pref.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return pref, nil
}

// Create 创建通知偏好
func (s *NotificationPreferencesStore) Create(ctx context.Context, pref *NotificationPreferences) error {
	query := `
		INSERT INTO notification_preferences (
			id, tenant_id, user_id, do_not_disturb_enabled, dnd_start_time, dnd_end_time, dnd_days,
			channel_in_app, channel_email, channel_push,
			type_system, type_approval, type_task, type_mention, type_chat,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		pref.ID, pref.TenantID, pref.UserID,
		pref.DoNotDisturbEnabled, pref.DNDStartTime, pref.DNDEndTime, pref.DNDDays,
		pref.ChannelInApp, pref.ChannelEmail, pref.ChannelPush,
		pref.TypeSystem, pref.TypeApproval, pref.TypeTask, pref.TypeMention, pref.TypeChat,
		pref.CreatedAt, pref.UpdatedAt,
	)
	return err
}

// Update 更新通知偏好
func (s *NotificationPreferencesStore) Update(ctx context.Context, pref *NotificationPreferences) error {
	query := `
		UPDATE notification_preferences SET
			do_not_disturb_enabled = ?, dnd_start_time = ?, dnd_end_time = ?, dnd_days = ?,
			channel_in_app = ?, channel_email = ?, channel_push = ?,
			type_system = ?, type_approval = ?, type_task = ?, type_mention = ?, type_chat = ?,
			updated_at = ?
		WHERE tenant_id = ? AND user_id = ?`

	result, err := s.db.ExecContext(ctx, query,
		pref.DoNotDisturbEnabled, pref.DNDStartTime, pref.DNDEndTime, pref.DNDDays,
		pref.ChannelInApp, pref.ChannelEmail, pref.ChannelPush,
		pref.TypeSystem, pref.TypeApproval, pref.TypeTask, pref.TypeMention, pref.TypeChat,
		pref.UpdatedAt, pref.TenantID, pref.UserID,
	)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("preferences not found")
	}
	return nil
}

// Upsert 创建或更新通知偏好
func (s *NotificationPreferencesStore) Upsert(ctx context.Context, pref *NotificationPreferences) error {
	existing, err := s.GetByUserID(ctx, pref.TenantID, pref.UserID)
	if err != nil {
		return err
	}

	if existing == nil {
		pref.ID = GenerateID()
		pref.CreatedAt = Now()
		pref.UpdatedAt = Now()
		return s.Create(ctx, pref)
	}

	pref.ID = existing.ID
	pref.CreatedAt = existing.CreatedAt
	pref.UpdatedAt = Now()
	return s.Update(ctx, pref)
}

// GroupMessageStore 群消息存储库
type GroupMessageStore struct {
	db *sql.DB
}

// NewGroupMessageStore 创建群消息存储库
func NewGroupMessageStore(db *sql.DB) *GroupMessageStore {
	return &GroupMessageStore{db: db}
}

// Create 创建群消息
func (s *GroupMessageStore) Create(ctx context.Context, msg *GroupMessage) error {
	query := `
		INSERT INTO group_messages (
			id, tenant_id, group_id, sender_id, sender_type, sender_name, content,
			mentions, reply_to, agent_response_id, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		msg.ID, msg.TenantID, msg.GroupID, msg.SenderID, msg.SenderType, msg.SenderName,
		msg.Content, msg.Mentions, msg.ReplyTo, msg.AgentResponseID, msg.CreatedAt, msg.UpdatedAt,
	)
	return err
}

// ListByGroup 获取群消息列表
func (s *GroupMessageStore) ListByGroup(ctx context.Context, tenantID, groupID string, limit, offset int) ([]GroupMessage, error) {
	query := `
		SELECT id, tenant_id, group_id, sender_id, sender_type, sender_name, content,
			mentions, reply_to, agent_response_id, created_at, updated_at, deleted_at
		FROM group_messages
		WHERE tenant_id = ? AND group_id = ? AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?`

	rows, err := s.db.QueryContext(ctx, query, tenantID, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []GroupMessage
	for rows.Next() {
		var msg GroupMessage
		if err := rows.Scan(
			&msg.ID, &msg.TenantID, &msg.GroupID, &msg.SenderID, &msg.SenderType, &msg.SenderName,
			&msg.Content, &msg.Mentions, &msg.ReplyTo, &msg.AgentResponseID,
			&msg.CreatedAt, &msg.UpdatedAt, &msg.DeletedAt,
		); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, rows.Err()
}

// MessageAuditStore 消息审计存储库
type MessageAuditStore struct {
	db *sql.DB
}

// NewMessageAuditStore 创建消息审计存储库
func NewMessageAuditStore(db *sql.DB) *MessageAuditStore {
	return &MessageAuditStore{db: db}
}

// Create 创建审计日志
func (s *MessageAuditStore) Create(ctx context.Context, log *MessageAuditLog) error {
	query := `
		INSERT INTO message_audit_logs (
			id, tenant_id, action, message_id, sender_id, recipient_id,
			content, metadata, operator_id, operator_name, created_at, expires_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		log.ID, log.TenantID, log.Action, log.MessageID, log.SenderID, log.RecipientID,
		log.Content, log.Metadata, log.OperatorID, log.OperatorName, log.CreatedAt, log.ExpiresAt,
	)
	return err
}

// ListByOperator 获取操作者的审计日志
func (s *MessageAuditStore) ListByOperator(ctx context.Context, tenantID, operatorID string, limit, offset int) ([]MessageAuditLog, error) {
	query := `
		SELECT id, tenant_id, action, message_id, sender_id, recipient_id,
			content, metadata, operator_id, operator_name, created_at, expires_at
		FROM message_audit_logs
		WHERE tenant_id = ? AND operator_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?`

	rows, err := s.db.QueryContext(ctx, query, tenantID, operatorID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []MessageAuditLog
	for rows.Next() {
		var log MessageAuditLog
		if err := rows.Scan(
			&log.ID, &log.TenantID, &log.Action, &log.MessageID, &log.SenderID, &log.RecipientID,
			&log.Content, &log.Metadata, &log.OperatorID, &log.OperatorName,
			&log.CreatedAt, &log.ExpiresAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, rows.Err()
}

// CleanupExpired 清理过期审计日志
func (s *MessageAuditStore) CleanupExpired(ctx context.Context) (int64, error) {
	query := `DELETE FROM message_audit_logs WHERE expires_at < ?`
	result, err := s.db.ExecContext(ctx, query, Now())
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// Search 搜索审计日志
func (s *MessageAuditStore) Search(ctx context.Context, tenantID string, req *AuditSearchRequest) ([]MessageAuditLog, error) {
	var conditions []string
	var args []interface{}

	conditions = append(conditions, "tenant_id = ?")
	args = append(args, tenantID)

	if req.Action != nil {
		conditions = append(conditions, "action = ?")
		args = append(args, *req.Action)
	}

	if req.MessageID != nil {
		conditions = append(conditions, "message_id = ?")
		args = append(args, *req.MessageID)
	}

	if req.OperatorID != nil {
		conditions = append(conditions, "operator_id = ?")
		args = append(args, *req.OperatorID)
	}

	if req.StartDate != nil {
		conditions = append(conditions, "created_at >= ?")
		args = append(args, *req.StartDate)
	}

	if req.EndDate != nil {
		conditions = append(conditions, "created_at <= ?")
		args = append(args, *req.EndDate)
	}

	query := `
		SELECT id, tenant_id, action, message_id, sender_id, recipient_id,
			content, metadata, operator_id, operator_name, created_at, expires_at
		FROM message_audit_logs
		WHERE ` + strings.Join(conditions, " AND ") + `
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?`

	args = append(args, req.PageSize, req.Offset)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []MessageAuditLog
	for rows.Next() {
		var log MessageAuditLog
		if err := rows.Scan(
			&log.ID, &log.TenantID, &log.Action, &log.MessageID, &log.SenderID, &log.RecipientID,
			&log.Content, &log.Metadata, &log.OperatorID, &log.OperatorName,
			&log.CreatedAt, &log.ExpiresAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, rows.Err()
}

// AuditSearchRequest 审计搜索请求
type AuditSearchRequest struct {
	Action     *string
	MessageID *string
	OperatorID *string
	StartDate *int64
	EndDate   *int64
	PageSize  int
	Offset    int
}
