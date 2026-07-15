package service

import (
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type AIService struct {
	repo                repository.AIRepository
	contextInjectionSvc *ContextInjectionService
}

func NewAIService(repo repository.AIRepository) *AIService { return &AIService{repo: repo} }

func NewAIServiceWithContext(repo repository.AIRepository, contextInjectionSvc *ContextInjectionService) *AIService {
	return &AIService{repo: repo, contextInjectionSvc: contextInjectionSvc}
}

func (s *AIService) CreateSession(eid, userID, title, aiModel string) (*model.ChatSession, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sess := &model.ChatSession{UserID: userID, Title: title, Model: aiModel, Context: "{}"}
	sess.EnterpriseID = id
	if err := s.repo.CreateSession(sess); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建会话失败: " + err.Error()) }
	return sess, nil
}

func (s *AIService) ListSessions(eid, userID string) ([]model.ChatSession, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sessions, dbErr := s.repo.ListSessions(id, userID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询会话失败")
	}
	return sessions, nil
}

func (s *AIService) SendMessage(sessionID, role, content string) (*model.ChatMessage, *apperrors.AppError) {
	sid, err := uuid.Parse(sessionID)
	if err != nil { return nil, apperrors.NewValidationError("session_id", "无效") }
	sess, dbErr := s.repo.FindSessionByID(sid, uuid.Nil)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询会话失败")
	}
	if sess == nil {
		return nil, apperrors.ErrNotFound.WithDetail("会话不存在")
	}

	enrichedContent := content
	if s.contextInjectionSvc != nil && role == "user" {
		chunks, _ := s.contextInjectionSvc.InjectContext("general", "", sess.EnterpriseID.String())
		if len(chunks) > 0 {
			var contextParts []string
			for _, chunk := range chunks {
				contextParts = append(contextParts, chunk.Content)
			}
			enrichedContent = fmt.Sprintf("[知识库上下文]\n%s\n\n[用户消息]\n%s", strings.Join(contextParts, "\n---\n"), content)
		}
	}

	msg := &model.ChatMessage{SessionID: sessionID, Role: role, Content: enrichedContent}
	if err := s.repo.CreateMessage(msg); err != nil { return nil, apperrors.ErrInternal.WithDetail("发送消息失败") }

	if role == "user" {
		aiResponse := &model.ChatMessage{SessionID: sessionID, Role: "assistant", Content: simulateAIResponse(enrichedContent)}
		s.repo.CreateMessage(aiResponse)
		return aiResponse, nil
	}
	return msg, nil
}

func (s *AIService) GetMessages(sessionID string) ([]model.ChatMessage, *apperrors.AppError) {
	_, err := uuid.Parse(sessionID)
	if err != nil { return nil, apperrors.NewValidationError("session_id", "无效") }
	msgs, dbErr := s.repo.ListMessagesBySession(sessionID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询消息失败")
	}
	return msgs, nil
}

func (s *AIService) UpdatePreference(eid, userID, key, value string) (*model.ChatSession, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sess, dbErr := s.repo.FindFirstSessionByUser(id, userID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询会话失败")
	}
	if sess == nil {
		return nil, apperrors.ErrNotFound.WithDetail("无会话可更新偏好")
	}
	sess.Context = `{"` + key + `":"` + value + `"}`
	s.repo.SaveSession(sess)
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
