package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type EnterpriseSkillMatrixRepository interface {
	Upsert(matrix *model.EnterpriseSkillMatrix) error
	FindByEnterpriseAndSkill(enterpriseID uuid.UUID, skillName string) (*model.EnterpriseSkillMatrix, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.EnterpriseSkillMatrix, error)
}

type enterpriseSkillMatrixRepo struct {
	db *gorm.DB
}

func NewEnterpriseSkillMatrixRepository(db *gorm.DB) EnterpriseSkillMatrixRepository {
	return &enterpriseSkillMatrixRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *enterpriseSkillMatrixRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *enterpriseSkillMatrixRepo) Upsert(matrix *model.EnterpriseSkillMatrix) error {
	var existing model.EnterpriseSkillMatrix
	err := r.fresh().Where("enterprise_id = ? AND skill_name = ?", matrix.EnterpriseID, matrix.SkillName).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.fresh().Create(matrix).Error
		}
		return err
	}
	existing.IsEnabled = matrix.IsEnabled
	existing.CustomOpeningMessage = matrix.CustomOpeningMessage
	existing.CustomParams = matrix.CustomParams
	return r.fresh().Where("id = ? AND enterprise_id = ?", existing.ID, existing.EnterpriseID).Updates(map[string]interface{}{
		"is_enabled":            existing.IsEnabled,
		"custom_opening_message": existing.CustomOpeningMessage,
		"custom_params":         existing.CustomParams,
	}).Error
}

func (r *enterpriseSkillMatrixRepo) FindByEnterpriseAndSkill(enterpriseID uuid.UUID, skillName string) (*model.EnterpriseSkillMatrix, error) {
	var m model.EnterpriseSkillMatrix
	err := r.fresh().Where("enterprise_id = ? AND skill_name = ?", enterpriseID, skillName).First(&m).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

func (r *enterpriseSkillMatrixRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.EnterpriseSkillMatrix, error) {
	var matrices []model.EnterpriseSkillMatrix
	err := r.fresh().Where("enterprise_id = ?", enterpriseID).Find(&matrices).Error
	return matrices, err
}
