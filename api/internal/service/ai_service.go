package service

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type AIService struct{ db *gorm.DB }

func NewAIService(db *gorm.DB) *AIService { return &AIService{db} }

func (s *AIService) CreateSession(eid, userID, title, aiModel string) (*model.ChatSession, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sess := &model.ChatSession{UserID: userID, Title: title, Model: aiModel, Context: "{}"}
	sess.EnterpriseID = id
	if err := s.db.Create(sess).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建会话失败: " + err.Error()) }
	return sess, nil
}

func (s *AIService) ListSessions(eid, userID string) ([]model.ChatSession, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var sessions []model.ChatSession
	q := s.db.Where("enterprise_id=?", id)
	if userID != "" { q = q.Where("user_id=?", userID) }
	if err := q.Order("created_at DESC").Find(&sessions).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询会话失败")
	}
	return sessions, nil
}

func (s *AIService) SendMessage(sessionID, role, content string) (*model.ChatMessage, *apperrors.AppError) {
	sid, err := uuid.Parse(sessionID)
	if err != nil { return nil, apperrors.NewValidationError("session_id", "无效") }
	var sess model.ChatSession
	if err := s.db.Where("id=?", sid).First(&sess).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("会话不存在")
	}

	msg := &model.ChatMessage{SessionID: sessionID, Role: role, Content: content}
	if err := s.db.Create(msg).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("发送消息失败") }

	if role == "user" {
		aiResponse := &model.ChatMessage{SessionID: sessionID, Role: "assistant", Content: simulateAIResponse(content)}
		s.db.Create(aiResponse)
		return aiResponse, nil
	}
	return msg, nil
}

func (s *AIService) GetMessages(sessionID string) ([]model.ChatMessage, *apperrors.AppError) {
	_, err := uuid.Parse(sessionID)
	if err != nil { return nil, apperrors.NewValidationError("session_id", "无效") }
	var msgs []model.ChatMessage
	if err := s.db.Where("session_id=?", sessionID).Order("created_at ASC").Find(&msgs).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询消息失败")
	}
	return msgs, nil
}

func (s *AIService) UpdatePreference(eid, userID, key, value string) (*model.ChatSession, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var sessions []model.ChatSession
	s.db.Where("enterprise_id=? AND user_id=?", id, userID).Limit(1).Find(&sessions)
	if len(sessions) == 0 {
		return nil, apperrors.ErrNotFound.WithDetail("无会话可更新偏好")
	}
	sess := &sessions[0]
	sess.Context = `{"` + key + `":"` + value + `"}`
	s.db.Save(sess)
	return sess, nil
}

func simulateAIResponse(userMsg string) string {
	return "这是一个AI助手模拟回复。您提到了: \"" + truncate(userMsg, 50) + "\"。实际部署时请配置LLM API密钥。"
}

func truncate(s string, n int) string {
	runes := []rune(s)
	if len(runes) > n {
		return string(runes[:n]) + "..."
	}
	return s
}
