package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type crossEnterpriseRepo struct {
	db *gorm.DB
}

func NewCrossEnterpriseRepository(db *gorm.DB) CrossEnterpriseRepository {
	return &crossEnterpriseRepo{db: db}
}

func (r *crossEnterpriseRepo) Create(perm *model.CrossEnterprisePermission) error {
	return r.db.Create(perm).Error
}

func (r *crossEnterpriseRepo) Update(perm *model.CrossEnterprisePermission) error {
	return r.db.Save(perm).Error
}

func (r *crossEnterpriseRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.CrossEnterprisePermission{}, "id = ?", id).Error
}

func (r *crossEnterpriseRepo) FindByID(id uuid.UUID) (*model.CrossEnterprisePermission, error) {
	var perm model.CrossEnterprisePermission
	err := r.db.Where("id = ?", id).First(&perm).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &perm, nil
}

func (r *crossEnterpriseRepo) FindByUserAndTarget(userID, targetEnterpriseID uuid.UUID) (*model.CrossEnterprisePermission, error) {
	var perm model.CrossEnterprisePermission
	err := r.db.Where("user_id = ? AND target_enterprise_id = ?", userID, targetEnterpriseID).First(&perm).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &perm, nil
}

func (r *crossEnterpriseRepo) ListByUser(userID uuid.UUID) ([]model.CrossEnterprisePermission, error) {
	var perms []model.CrossEnterprisePermission
	err := r.db.Where("user_id = ?", userID).Find(&perms).Error
	return perms, err
}

func (r *crossEnterpriseRepo) ListBySource(sourceEnterpriseID uuid.UUID) ([]model.CrossEnterprisePermission, error) {
	var perms []model.CrossEnterprisePermission
	err := r.db.Where("source_enterprise_id = ?", sourceEnterpriseID).Find(&perms).Error
	return perms, err
}

func (r *crossEnterpriseRepo) ListByTarget(targetEnterpriseID uuid.UUID) ([]model.CrossEnterprisePermission, error) {
	var perms []model.CrossEnterprisePermission
	err := r.db.Where("target_enterprise_id = ?", targetEnterpriseID).Find(&perms).Error
	return perms, err
}
