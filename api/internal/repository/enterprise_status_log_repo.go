package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type EnterpriseStatusLogRepository interface {
	Create(log *model.EnterpriseStatusLog) error
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.EnterpriseStatusLog, error)
}

type enterpriseStatusLogRepo struct {
	db *gorm.DB
}

func NewEnterpriseStatusLogRepository(db *gorm.DB) EnterpriseStatusLogRepository {
	return &enterpriseStatusLogRepo{db}
}

func (r *enterpriseStatusLogRepo) Create(log *model.EnterpriseStatusLog) error {
	return r.db.Create(log).Error
}

func (r *enterpriseStatusLogRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.EnterpriseStatusLog, error) {
	var logs []model.EnterpriseStatusLog
	err := r.db.Where("enterprise_id = ?", enterpriseID).Order("created_at DESC").Find(&logs).Error
	return logs, err
}
