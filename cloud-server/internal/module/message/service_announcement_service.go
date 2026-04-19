package message

import (
	"context"
	"fmt"
)

// AnnouncementService 公告服务
type AnnouncementService struct {
	store    *AnnouncementStore
	prefStore *NotificationPreferencesStore
}

// NewAnnouncementService 创建公告服务
func NewAnnouncementService(store *AnnouncementStore, prefStore *NotificationPreferencesStore) *AnnouncementService {
	return &AnnouncementService{store: store, prefStore: prefStore}
}

// Create 创建公告 (FR44)
func (s *AnnouncementService) Create(ctx context.Context, tenantID, authorID, authorName string, req *CreateAnnouncementRequest) (*Announcement, error) {
	priority := PriorityNormal
	if req.Priority != "" {
		priority = req.Priority
	}

	now := Now()
	ann := &Announcement{
		ID:          GenerateID(),
		TenantID:    tenantID,
		Title:       req.Title,
		Content:     req.Content,
		AuthorID:    authorID,
		AuthorName:  authorName,
		Priority:    priority,
		TargetType:  req.TargetType,
		TargetValue: req.TargetValue,
		Pinned:      false,
		PublishedAt: &now,
		ExpiresAt:   req.ExpiresAt,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.store.Create(ctx, ann); err != nil {
		return nil, err
	}

	return ann, nil
}

// Get 获取公告详情 (FR45)
func (s *AnnouncementService) Get(ctx context.Context, tenantID, id string) (*Announcement, error) {
	return s.store.GetByID(ctx, tenantID, id)
}

// List 获取公告列表 (FR45)
func (s *AnnouncementService) List(ctx context.Context, tenantID, userID string, limit, offset int) ([]Announcement, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return s.store.List(ctx, tenantID, userID, limit, offset)
}

// Update 更新公告
func (s *AnnouncementService) Update(ctx context.Context, tenantID, id string, req *UpdateAnnouncementRequest) error {
	ann, err := s.store.GetByID(ctx, tenantID, id)
	if err != nil {
		return err
	}
	if ann == nil {
		return fmt.Errorf("announcement not found")
	}

	if req.Title != nil {
		ann.Title = *req.Title
	}
	if req.Content != nil {
		ann.Content = *req.Content
	}
	if req.Priority != nil {
		ann.Priority = *req.Priority
	}
	if req.Pinned != nil {
		ann.Pinned = *req.Pinned
	}
	if req.ExpiresAt != nil {
		ann.ExpiresAt = req.ExpiresAt
	}
	ann.UpdatedAt = Now()

	return s.store.Update(ctx, ann)
}

// Delete 删除公告
func (s *AnnouncementService) Delete(ctx context.Context, tenantID, id string) error {
	return s.store.SoftDelete(ctx, tenantID, id)
}

// MarkAsRead 标记已读 (FR45)
func (s *AnnouncementService) MarkAsRead(ctx context.Context, tenantID, annID, userID string) error {
	return s.store.MarkRead(ctx, tenantID, annID, userID)
}

// GetUnreadCount 获取未读公告数
func (s *AnnouncementService) GetUnreadCount(ctx context.Context, tenantID, userID string) (int64, error) {
	return s.store.CountUnreadByUser(ctx, tenantID, userID)
}

// NotificationService 通知偏好服务
type NotificationService struct {
	store *NotificationPreferencesStore
}

// NewNotificationService 创建通知服务
func NewNotificationService(store *NotificationPreferencesStore) *NotificationService {
	return &NotificationService{store: store}
}

// GetPreferences 获取通知偏好 (FR48)
func (s *NotificationService) GetPreferences(ctx context.Context, tenantID, userID string) (*NotificationPreferences, error) {
	pref, err := s.store.GetByUserID(ctx, tenantID, userID)
	if err != nil {
		return nil, err
	}

	if pref == nil {
		// Return default preferences
		return &NotificationPreferences{
			TenantID:             tenantID,
			UserID:               userID,
			DoNotDisturbEnabled: false,
			ChannelInApp:         true,
			ChannelEmail:         false,
			ChannelPush:          false,
			TypeSystem:           true,
			TypeApproval:         true,
			TypeTask:             true,
			TypeMention:          true,
			TypeChat:             true,
			CreatedAt:            Now(),
			UpdatedAt:            Now(),
		}, nil
	}

	return pref, nil
}

// UpdatePreferences 更新通知偏好 (FR48)
func (s *NotificationService) UpdatePreferences(ctx context.Context, tenantID, userID string, req *UpdatePreferencesRequest) error {
	pref, err := s.store.GetByUserID(ctx, tenantID, userID)
	if err != nil {
		return err
	}

	if pref == nil {
		pref = &NotificationPreferences{
			TenantID:  tenantID,
			UserID:    userID,
			CreatedAt: Now(),
		}
	}

	// Update fields
	if req.DoNotDisturbEnabled != nil {
		pref.DoNotDisturbEnabled = *req.DoNotDisturbEnabled
	}
	if req.DNDStartTime != nil {
		pref.DNDStartTime = req.DNDStartTime
	}
	if req.DNDEndTime != nil {
		pref.DNDEndTime = req.DNDEndTime
	}
	if req.DNDDays != nil {
		days := ""
		for i, d := range req.DNDDays {
			if i > 0 {
				days += ","
			}
			days += fmt.Sprintf("%d", d)
		}
		pref.DNDDays = &days
	}
	if req.ChannelInApp != nil {
		pref.ChannelInApp = *req.ChannelInApp
	}
	if req.ChannelEmail != nil {
		pref.ChannelEmail = *req.ChannelEmail
	}
	if req.ChannelPush != nil {
		pref.ChannelPush = *req.ChannelPush
	}
	if req.TypeSystem != nil {
		pref.TypeSystem = *req.TypeSystem
	}
	if req.TypeApproval != nil {
		pref.TypeApproval = *req.TypeApproval
	}
	if req.TypeTask != nil {
		pref.TypeTask = *req.TypeTask
	}
	if req.TypeMention != nil {
		pref.TypeMention = *req.TypeMention
	}
	if req.TypeChat != nil {
		pref.TypeChat = *req.TypeChat
	}
	pref.UpdatedAt = Now()

	return s.store.Upsert(ctx, pref)
}

// CheckDND 检查免打扰
func (s *NotificationService) CheckDND(pref *NotificationPreferences) bool {
	if pref == nil || !pref.DoNotDisturbEnabled {
		return false
	}

	// TODO: Implement full DND logic with time range checking
	return true
}

// GroupMessageService 群消息服务
type GroupMessageService struct {
	store *GroupMessageStore
}

// NewGroupMessageService 创建群消息服务
func NewGroupMessageService(store *GroupMessageStore) *GroupMessageService {
	return &GroupMessageService{store: store}
}

// SendMessage 发送群消息 (FR631)
func (s *GroupMessageService) SendMessage(ctx context.Context, tenantID, senderID, senderName, senderType string, req *SendGroupMessageRequest) (*GroupMessage, error) {
	mentions := ""
	if len(req.Mentions) > 0 {
		for i, m := range req.Mentions {
			if i > 0 {
				mentions += ","
			}
			mentions += m
		}
	}

	now := Now()
	msg := &GroupMessage{
		ID:         GenerateID(),
		TenantID:   tenantID,
		GroupID:    req.GroupID,
		SenderID:    senderID,
		SenderType: senderType,
		SenderName: senderName,
		Content:    req.Content,
		ReplyTo:    req.ReplyTo,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if mentions != "" {
		msg.Mentions = &mentions
	}

	if err := s.store.Create(ctx, msg); err != nil {
		return nil, err
	}

	return msg, nil
}

// ListMessages 获取群消息列表
func (s *GroupMessageService) ListMessages(ctx context.Context, tenantID, groupID string, limit, offset int) ([]GroupMessage, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	return s.store.ListByGroup(ctx, tenantID, groupID, limit, offset)
}
