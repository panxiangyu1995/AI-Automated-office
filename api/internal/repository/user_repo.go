package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id, enterpriseID uuid.UUID) (*model.User, error)
	FindByEmail(email string, enterpriseID string) (*model.User, error)
	Update(user *model.User) error
	Delete(id, enterpriseID uuid.UUID) error
	List(enterpriseID string, offset, limit int) ([]model.User, int64, error)
	UpdateLastLogin(id uuid.UUID) error
	FindByIDString(id string) (*model.User, error)
}
