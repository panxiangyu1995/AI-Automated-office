package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type aiRepo struct {
	db *gorm.DB
}

func NewAIRepository(db *gorm.DB) AIRepository {
	return &aiRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *aiRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *aiRepo) CreateSession(sess *model.ChatSession) error {
	return r.fresh().Create(sess).Error
}

func (r *aiRepo) ListSessions(enterpriseID uuid.UUID, userID string) ([]model.ChatSession, error) {
	var sessions []model.ChatSession
	q := r.fresh().Where("enterprise_id=?", enterpriseID)
	if userID != "" {
		q = q.Where("user_id=?", userID)
	}
	err := q.Order("created_at DESC").Find(&sessions).Error
	return sessions, err
}

func (r *aiRepo) FindSessionByID(id, enterpriseID uuid.UUID) (*model.ChatSession, error) {
	var sess model.ChatSession
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&sess).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &sess, nil
}

func (r *aiRepo) CreateMessage(msg *model.ChatMessage) error {
	return r.fresh().Create(msg).Error
}

func (r *aiRepo) ListMessagesBySession(sessionID string) ([]model.ChatMessage, error) {
	var msgs []model.ChatMessage
	err := r.fresh().Where("session_id=?", sessionID).Order("created_at ASC").Find(&msgs).Error
	return msgs, err
}

func (r *aiRepo) FindFirstSessionByUser(enterpriseID uuid.UUID, userID string) (*model.ChatSession, error) {
	var sessions []model.ChatSession
	if err := r.fresh().Where("enterprise_id=? AND user_id=?", enterpriseID, userID).Limit(1).Find(&sessions).Error; err != nil {
		return nil, err
	}
	if len(sessions) == 0 {
		return nil, nil
	}
	return &sessions[0], nil
}

func (r *aiRepo) SaveSession(sess *model.ChatSession) error {
	return r.fresh().Save(sess).Error
}
