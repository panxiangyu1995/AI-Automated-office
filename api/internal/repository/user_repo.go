package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uuid.UUID) (*model.User, error)
	FindByEmail(email string, enterpriseID string) (*model.User, error)
	Update(user *model.User) error
	Delete(id uuid.UUID) error
	List(enterpriseID string, offset, limit int) ([]model.User, int64, error)
	UpdateLastLogin(id uuid.UUID) error
}
