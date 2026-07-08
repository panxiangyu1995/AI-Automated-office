package service

import (
	"context"
	"strconv"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/redis"
)

type MessageService struct {
	msgRepo  repository.MessageRepository
	annRepo  repository.AnnouncementRepository
	counter  *redis.UnreadCounter
}

func NewMessageService(msgRepo repository.MessageRepository, annRepo repository.AnnouncementRepository, counter *redis.UnreadCounter) *MessageService {
	return &MessageService{
		msgRepo: msgRepo,
		annRepo: annRepo,
		counter: counter,
	}
}

type SendMessageRequest struct {
	ReceiverID string `json:"receiver_id"`
	Title      string `json:"title"`
	Content    string `json:"content"`
	MsgType    string `json:"msg_type"`
	Priority   string `json:"priority"`
	RefID      string `json:"ref_id,omitempty"`
	RefType    string `json:"ref_type,omitempty"`
}

func (s *MessageService) Send(enterpriseID string, senderID string, req SendMessageRequest) (*model.Message, *apperrors.AppError) {
	if req.ReceiverID == "" {
		return nil, apperrors.NewValidationError("receiver_id", "接收者不能为空")
	}
	if req.Content == "" {
		return nil, apperrors.NewValidationError("content", "消息内容不能为空")
	}

	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	msgType := req.MsgType
	if msgType == "" {
		msgType = "notification"
	}
	priority := req.Priority
	if priority == "" {
		priority = "normal"
	}

	msg := &model.Message{
		SenderID:   senderID,
		ReceiverID: req.ReceiverID,
		Title:      req.Title,
		Content:    req.Content,
		MsgType:    msgType,
		Priority:   priority,
		RefID:      req.RefID,
		RefType:    req.RefType,
	}
	msg.EnterpriseID = entID

	if err := s.msgRepo.Create(msg); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("发送消息失败")
	}

	if s.counter != nil {
		s.counter.Incr(context.Background(), enterpriseID, req.ReceiverID)
	}

	return msg, nil
}

func (s *MessageService) List(enterpriseID string, receiverID string, page, pageSize int) ([]model.Message, int64, *apperrors.AppError) {
	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	msgs, total, err := s.msgRepo.ListByReceiver(entID, receiverID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询消息列表失败")
	}
	return msgs, total, nil
}

func (s *MessageService) UnreadCount(enterpriseID string, receiverID string) (int64, *apperrors.AppError) {
	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return 0, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	count, err := s.msgRepo.CountUnread(entID, receiverID)
	if err != nil {
		return 0, apperrors.ErrInternal.WithDetail("查询未读消息数失败")
	}
	return count, nil
}

func (s *MessageService) MarkRead(messageID string) *apperrors.AppError {
	id, err := uuid.Parse(messageID)
	if err != nil {
		return apperrors.NewValidationError("id", "消息ID无效")
	}
	if err := s.msgRepo.MarkRead(id); err != nil {
		return apperrors.ErrInternal.WithDetail("标记已读失败")
	}

	if s.counter != nil {
		s.counter.Decr(context.Background(), "", "")
	}

	return nil
}

func (s *MessageService) Poll(enterpriseID string, receiverID string, timeout int) ([]model.Message, *apperrors.AppError) {
	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	if timeout <= 0 {
		timeout = 5
	}
	if timeout > 30 {
		timeout = 30
	}

	msgs, _, err := s.msgRepo.ListByReceiver(entID, receiverID, 1, 50)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("轮询消息失败")
	}
	return msgs, nil
}

func (s *MessageService) CreateAnnouncement(enterpriseID string, senderID string, title, content, priority, targetType, targetID string) (*model.Announcement, *apperrors.AppError) {
	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if title == "" {
		return nil, apperrors.NewValidationError("title", "公告标题不能为空")
	}
	if content == "" {
		return nil, apperrors.NewValidationError("content", "公告内容不能为空")
	}

	if priority == "" {
		priority = "normal"
	}
	if targetType == "" {
		targetType = "all"
	}

	ann := &model.Announcement{
		Title:      title,
		Content:    content,
		SenderID:   senderID,
		Priority:   priority,
		TargetType: targetType,
		TargetID:   targetID,
	}
	ann.EnterpriseID = entID

	if err := s.annRepo.Create(ann); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建公告失败")
	}

	return ann, nil
}

func (s *MessageService) ListAnnouncements(enterpriseID string, page, pageSize int) ([]model.Announcement, int64, *apperrors.AppError) {
	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	anns, total, err := s.annRepo.ListByEnterprise(entID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询公告列表失败")
	}
	return anns, total, nil
}

func (s *MessageService) MarkAnnouncementRead(announcementID, employeeID string) *apperrors.AppError {
	annID, err := uuid.Parse(announcementID)
	if err != nil {
		return apperrors.NewValidationError("announcement_id", "公告ID无效")
	}
	empID, err := uuid.Parse(employeeID)
	if err != nil {
		return apperrors.NewValidationError("employee_id", "员工ID无效")
	}
	if err := s.annRepo.MarkRead(annID, empID); err != nil {
		return apperrors.ErrInternal.WithDetail("标记公告已读失败")
	}
	return nil
}

func atoi(s string, def int) int {
	v, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return v
}
