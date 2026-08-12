package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type departmentRepo struct {
	db *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &departmentRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *departmentRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *departmentRepo) Create(department *model.Department) error {
	return r.fresh().Create(department).Error
}

func (r *departmentRepo) Update(department *model.Department) error {
	return r.fresh().Save(department).Error
}

func (r *departmentRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.Department{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *departmentRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Department, error) {
	var dept model.Department
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&dept).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &dept, nil
}

func (r *departmentRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.Department, error) {
	var departments []model.Department
	err := r.fresh().Where("enterprise_id = ?", enterpriseID).Order("name ASC").Find(&departments).Error
	return departments, err
}

func (r *departmentRepo) CountByEnterprise(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Department{}).Where("enterprise_id = ?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *departmentRepo) CountByParent(parentID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Department{}).Where("parent_id = ?", parentID).Count(&count).Error
	return count, err
}

func (r *departmentRepo) UpdateFields(id, enterpriseID string, fields map[string]interface{}) error {
	return r.fresh().Model(&model.Department{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Updates(fields).Error
}

func (r *departmentRepo) RestoreFields(id, enterpriseID string, fields map[string]interface{}) error {
	return r.UpdateFields(id, enterpriseID, fields)
}
