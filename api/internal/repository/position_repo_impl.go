package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type positionRepo struct {
	db *gorm.DB
}

func NewPositionRepository(db *gorm.DB) PositionRepository {
	return &positionRepo{db: db}
}

func (r *positionRepo) Create(position *model.Position) error {
	return r.db.Create(position).Error
}

func (r *positionRepo) Update(position *model.Position) error {
	return r.db.Save(position).Error
}

func (r *positionRepo) FindByID(id uuid.UUID) (*model.Position, error) {
	var p model.Position
	err := r.db.Where("id = ?", id).First(&p).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *positionRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.Position, error) {
	var positions []model.Position
	err := r.db.Where("enterprise_id = ?", enterpriseID).Order("name ASC").Find(&positions).Error
	return positions, err
}
