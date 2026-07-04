package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
)

type departmentRepo struct {
	db *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &departmentRepo{db: db}
}

func (r *departmentRepo) Create(department *model.Department) error {
	return r.db.Create(department).Error
}

func (r *departmentRepo) Update(department *model.Department) error {
	return r.db.Save(department).Error
}

func (r *departmentRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Department{}, "id = ?", id).Error
}

func (r *departmentRepo) FindByID(id uuid.UUID) (*model.Department, error) {
	var dept model.Department
	err := r.db.Where("id = ?", id).First(&dept).Error
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
	err := r.db.Where("enterprise_id = ?", enterpriseID).Order("name ASC").Find(&departments).Error
	return departments, err
}

func (r *departmentRepo) CountByParent(parentID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&model.Department{}).Where("parent_id = ?", parentID).Count(&count).Error
	return count, err
}
