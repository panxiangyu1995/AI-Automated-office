package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type employeePermissionRepo struct {
	db *gorm.DB
}

func NewEmployeePermissionRepository(db *gorm.DB) EmployeePermissionRepository {
	return &employeePermissionRepo{db: db}
}

func (r *employeePermissionRepo) Create(perm *model.EmployeePermission) error {
	return r.db.Create(perm).Error
}

func (r *employeePermissionRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.EmployeePermission{}).Error
}

func (r *employeePermissionRepo) DeleteByEmployeeAndPermission(employeeID uuid.UUID, permission string, enterpriseID uuid.UUID) error {
	return r.db.Where("employee_id = ? AND permission = ? AND enterprise_id = ?", employeeID, permission, enterpriseID).Delete(&model.EmployeePermission{}).Error
}

func (r *employeePermissionRepo) ListByEmployee(employeeID uuid.UUID) ([]model.EmployeePermission, error) {
	var perms []model.EmployeePermission
	err := r.db.Where("employee_id = ?", employeeID).Find(&perms).Error
	return perms, err
}

func (r *employeePermissionRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.EmployeePermission, error) {
	var perms []model.EmployeePermission
	err := r.db.Where("enterprise_id = ?", enterpriseID).Find(&perms).Error
	return perms, err
}
