package repository

import (
	"time"
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

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *crossEnterpriseRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *crossEnterpriseRepo) publicDB() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true}).Exec("SET search_path TO public")
}

func (r *crossEnterpriseRepo) Create(perm *model.CrossEnterprisePermission) error {
	return r.publicDB().Create(perm).Error
}

func (r *crossEnterpriseRepo) Update(perm *model.CrossEnterprisePermission) error {
	return r.publicDB().Save(perm).Error
}

func (r *crossEnterpriseRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.publicDB().Model(&model.CrossEnterprisePermission{}).Where("id = ? AND source_enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *crossEnterpriseRepo) FindByID(id, enterpriseID uuid.UUID) (*model.CrossEnterprisePermission, error) {
	var perm model.CrossEnterprisePermission
	err := r.publicDB().Where("id = ? AND source_enterprise_id = ?", id, enterpriseID).First(&perm).Error
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
	err := r.publicDB().Where("user_id = ? AND target_enterprise_id = ?", userID, targetEnterpriseID).First(&perm).Error
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
	err := r.publicDB().Where("user_id = ?", userID).Find(&perms).Error
	return perms, err
}

func (r *crossEnterpriseRepo) ListBySource(sourceEnterpriseID uuid.UUID) ([]model.CrossEnterprisePermission, error) {
	var perms []model.CrossEnterprisePermission
	err := r.publicDB().Where("source_enterprise_id = ?", sourceEnterpriseID).Find(&perms).Error
	return perms, err
}

func (r *crossEnterpriseRepo) ListByTarget(targetEnterpriseID uuid.UUID) ([]model.CrossEnterprisePermission, error) {
	var perms []model.CrossEnterprisePermission
	err := r.publicDB().Where("target_enterprise_id = ?", targetEnterpriseID).Find(&perms).Error
	return perms, err
}
