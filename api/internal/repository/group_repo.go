package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type GroupRepository interface {
	Create(group *model.Group) error
	Update(group *model.Group) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.Group, error)
	FindByCode(code string) (*model.Group, error)
	List(page, pageSize int) ([]model.Group, int64, error)
}
