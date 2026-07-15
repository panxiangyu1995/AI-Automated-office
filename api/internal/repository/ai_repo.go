package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type AIRepository interface {
	CreateSession(sess *model.ChatSession) error
	ListSessions(enterpriseID uuid.UUID, userID string) ([]model.ChatSession, error)
	FindSessionByID(id, enterpriseID uuid.UUID) (*model.ChatSession, error)
	CreateMessage(msg *model.ChatMessage) error
	ListMessagesBySession(sessionID string) ([]model.ChatMessage, error)
	FindFirstSessionByUser(enterpriseID uuid.UUID, userID string) (*model.ChatSession, error)
	SaveSession(sess *model.ChatSession) error
}
