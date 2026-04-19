package message

import (
	"context"
	"fmt"

	"cloud-server/internal/module/notification"
)

// MessageService 消息服务
type MessageService struct {
	store       *MessageStore
	audit       *MessageAuditStore
	notifDisp   *notification.Dispatcher
}

// NewMessageService 创建消息服务
func NewMessageService(store *MessageStore, audit *MessageAuditStore, notifDisp *notification.Dispatcher) *MessageService {
	return &MessageService{store: store, audit: audit, notifDisp: notifDisp}
}

// SendMessage 发送消息
func (s *MessageService) SendMessage(ctx context.Context, tenantID, senderID, senderName string, req *CreateMessageRequest) (*Message, error) {
	priority := PriorityNormal
	if req.Priority != nil {
		priority = *req.Priority
	}

	msg := &Message{
		ID:            GenerateID(),
		TenantID:      tenantID,
		MsgType:       req.MsgType,
		Title:         req.Title,
		Content:       req.Content,
		SenderID:      senderID,
		SenderName:    senderName,
		RecipientID:    req.RecipientID,
		RecipientType: req.RecipientType,
		Priority:      priority,
		Status:        StatusUnread,
		ActionURL:     req.ActionURL,
		CreatedAt:     Now(),
		Pinned:        false,
		Edited:        false,
		Recalled:      false,
		Version:       1,
		SyncStatus:    "synced",
	}

	if err := s.store.Create(ctx, msg); err != nil {
		return nil, err
	}

	// 创建消息状态追踪
	statusEntry := &MessageStatusEntry{
		ID:          GenerateID(),
		MessageID:   msg.ID,
		TenantID:    tenantID,
		SenderID:    senderID,
		RecipientID: req.RecipientID,
		Status:      DeliverySent,
		CreatedAt:   Now(),
		UpdatedAt:   Now(),
	}
	statusEntry.SentAt = &statusEntry.CreatedAt
	if err := s.store.CreateMessageStatus(ctx, statusEntry); err != nil {
		// 非关键错误，不影响主流程
	}

	// 记录审计日志
	s.recordAudit(ctx, tenantID, "send", msg.ID, &senderID, &req.RecipientID, &msg.Content, senderID, senderName)

	// 发送通知（异步）
	if s.notifDisp != nil {
		go func() {
			notif := &notification.Notification{
				UserID:    req.RecipientID,
				TenantID:  tenantID,
				Title:     req.Title,
				Content:   req.Content,
				Channels:  []notification.Channel{notification.ChannelInApp},
				Priority:  string(priority),
				ActionURL: "",
			}
			notification.DefaultDispatcher.Dispatch(context.Background(), notif)
		}()
	}

	return msg, nil
}

// GetMessage 获取消息详情
func (s *MessageService) GetMessage(ctx context.Context, tenantID, id string) (*Message, error) {
	return s.store.GetByID(ctx, tenantID, id)
}

// ListMessages 获取消息列表
func (s *MessageService) ListMessages(ctx context.Context, tenantID, recipientID string, status *MessageStatus, limit, offset int) ([]MessageListItem, error) {
	messages, err := s.store.ListByRecipient(ctx, tenantID, recipientID, limit, offset)
	if err != nil {
		return nil, err
	}

	items := make([]MessageListItem, len(messages))
	for i, msg := range messages {
		items[i] = MessageListItem{
			ID:        msg.ID,
			MsgType:   msg.MsgType,
			Title:     msg.Title,
			SenderName: msg.SenderName,
			Status:    msg.Status,
			Priority:  msg.Priority,
			CreatedAt: msg.CreatedAt,
		}
	}

	return items, nil
}

// MarkAsRead 标记已读
func (s *MessageService) MarkAsRead(ctx context.Context, tenantID, id, userID string) error {
	if err := s.store.UpdateStatus(ctx, tenantID, id, StatusRead); err != nil {
		return err
	}

	msg, _ := s.store.GetByID(ctx, tenantID, id)
	if msg != nil {
		s.recordAudit(ctx, tenantID, "read", id, &msg.SenderID, &userID, nil, userID, userID)
	}

	return nil
}

// MarkAllAsRead 全部已读
func (s *MessageService) MarkAllAsRead(ctx context.Context, tenantID, recipientID, userID string) error {
	messages, err := s.store.ListByRecipient(ctx, tenantID, recipientID, 1000, 0)
	if err != nil {
		return err
	}

	for _, msg := range messages {
		if msg.Status == StatusUnread {
			if err := s.store.UpdateStatus(ctx, tenantID, msg.ID, StatusRead); err != nil {
				continue
			}
			s.recordAudit(ctx, tenantID, "read", msg.ID, &msg.SenderID, &recipientID, nil, userID, userID)
		}
	}

	return nil
}

// DeleteMessage 删除消息
func (s *MessageService) DeleteMessage(ctx context.Context, tenantID, id, userID string) error {
	msg, err := s.store.GetByID(ctx, tenantID, id)
	if err != nil {
		return err
	}
	if msg == nil {
		return fmt.Errorf("message not found")
	}

	if err := s.store.SoftDelete(ctx, tenantID, id); err != nil {
		return err
	}

	s.recordAudit(ctx, tenantID, "delete", id, &msg.SenderID, &msg.RecipientID, nil, userID, userID)
	return nil
}

// GetUnreadCount 获取未读数
func (s *MessageService) GetUnreadCount(ctx context.Context, tenantID, recipientID string) (*UnreadCount, error) {
	return s.store.CountUnreadByRecipient(ctx, tenantID, recipientID)
}

// SearchMessages 搜索消息
func (s *MessageService) SearchMessages(ctx context.Context, tenantID, recipientID string, req *SearchMessageRequest) (*SearchMessageResponse, error) {
	return s.store.Search(ctx, tenantID, recipientID, req)
}

// PinMessage 置顶消息
func (s *MessageService) PinMessage(ctx context.Context, tenantID, id, userID string, reason *string) error {
	msg, err := s.store.GetByID(ctx, tenantID, id)
	if err != nil {
		return err
	}
	if msg == nil {
		return fmt.Errorf("message not found")
	}

	msg.Pinned = true
	pinnedAt := Now()
	msg.PinnedAt = &pinnedAt
	if err := s.store.Update(ctx, msg); err != nil {
		return err
	}

	s.recordAudit(ctx, tenantID, "pin", id, nil, nil, nil, userID, userID)
	return nil
}

// UnpinMessage 取消置顶
func (s *MessageService) UnpinMessage(ctx context.Context, tenantID, id, userID string) error {
	msg, err := s.store.GetByID(ctx, tenantID, id)
	if err != nil {
		return err
	}
	if msg == nil {
		return fmt.Errorf("message not found")
	}

	msg.Pinned = false
	msg.PinnedAt = nil
	if err := s.store.Update(ctx, msg); err != nil {
		return err
	}

	s.recordAudit(ctx, tenantID, "unpin", id, nil, nil, nil, userID, userID)
	return nil
}

// GetPinnedMessages 获取置顶消息
func (s *MessageService) GetPinnedMessages(ctx context.Context, tenantID, recipientID string) ([]PinnedMessage, error) {
	return s.store.GetPinned(ctx, tenantID, recipientID)
}

// RecallMessage 撤回消息 (FR628)
func (s *MessageService) RecallMessage(ctx context.Context, tenantID, id, userID string) (*RecallResult, error) {
	msg, err := s.store.GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if msg == nil {
		return nil, fmt.Errorf("message not found")
	}

	now := Now()
	elapsed := now - msg.CreatedAt
	deadlineMs := int64(2 * 60 * 1000) // 2 minutes

	if elapsed > deadlineMs {
		return &RecallResult{
			Success:    false,
			MessageID:  id,
			RecalledAt: now,
			Reason:     strPtr("超过2分钟撤回时限"),
		}, nil
	}

	if msg.SenderID != userID {
		return nil, fmt.Errorf("只能撤回自己发送的消息")
	}

	if msg.Recalled {
		return nil, fmt.Errorf("消息已被撤回")
	}

	msg.Recalled = true
	msg.RecalledAt = &now
	if err := s.store.Update(ctx, msg); err != nil {
		return nil, err
	}

	s.recordAudit(ctx, tenantID, "recall", id, &msg.SenderID, &msg.RecipientID, nil, userID, userID)

	return &RecallResult{
		Success:    true,
		MessageID:  id,
		RecalledAt: now,
	}, nil
}

// EditMessage 编辑消息 (FR629)
func (s *MessageService) EditMessage(ctx context.Context, tenantID, id, userID, newContent string) (*EditResult, error) {
	msg, err := s.store.GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if msg == nil {
		return nil, fmt.Errorf("message not found")
	}

	if msg.Recalled {
		return nil, fmt.Errorf("消息已被撤回，无法编辑")
	}

	if msg.SenderID != userID {
		return nil, fmt.Errorf("只能编辑自己发送的消息")
	}

	now := Now()
	elapsed := now - msg.CreatedAt
	deadlineMs := int64(2 * 60 * 1000) // 2 minutes

	if elapsed > deadlineMs {
		return nil, fmt.Errorf("超过2分钟编辑时限")
	}

	if msg.MsgType != MessageTypeChat {
		return nil, fmt.Errorf("仅聊天消息可编辑")
	}

	// Store original content
	if msg.OriginalContent == nil {
		msg.OriginalContent = &msg.Content
	}

	oldContent := msg.Content

	// Add to edit history
	editEntry := EditHistoryEntry{
		EditedAt:   now,
		OldContent: oldContent,
		NewContent: newContent,
		EditedBy:   userID,
	}
	editHistoryStr := fmt.Sprintf("[{\"edited_at\":%d,\"old_content\":\"%s\",\"new_content\":\"%s\",\"edited_by\":\"%s\"}]",
		editEntry.EditedAt, oldContent, newContent, userID)

	msg.Content = newContent
	msg.Edited = true
	msg.EditedAt = &now
	msg.EditHistory = &editHistoryStr

	if err := s.store.Update(ctx, msg); err != nil {
		return nil, err
	}

	s.recordAudit(ctx, tenantID, "edit", id, &msg.SenderID, &msg.RecipientID, &oldContent, userID, userID)

	return &EditResult{
		Success:    true,
		MessageID:  id,
		EditedAt:   now,
		OldContent: oldContent,
		NewContent: newContent,
	}, nil
}

// GetDeliveryStatus 获取投递状态 (FR622-FR623)
func (s *MessageService) GetDeliveryStatus(ctx context.Context, messageID string) (*MessageStatusEntry, error) {
	return s.store.GetMessageStatus(ctx, messageID)
}

// recordAudit 记录审计日志
func (s *MessageService) recordAudit(ctx context.Context, tenantID, action, messageID string, senderID, recipientID *string, content *string, operatorID, operatorName string) {
	if s.audit == nil {
		return
	}

	expiresAt := Now() + int64(180*24*60*60*1000) // 180 days

	auditLog := &MessageAuditLog{
		ID:           GenerateID(),
		TenantID:     tenantID,
		Action:       action,
		MessageID:    messageID,
		SenderID:     senderID,
		RecipientID:  recipientID,
		Content:      content,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		CreatedAt:    Now(),
		ExpiresAt:    expiresAt,
	}

	s.audit.Create(ctx, auditLog)
}

// Helper function to convert string to *string
func strPtr(s string) *string {
	return &s
}
