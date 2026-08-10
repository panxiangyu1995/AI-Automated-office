package repository

import (
	"time"
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

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *employeePermissionRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *employeePermissionRepo) Create(perm *model.EmployeePermission) error {
	return r.fresh().Create(perm).Error
}

func (r *employeePermissionRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.EmployeePermission{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *employeePermissionRepo) DeleteByEmployeeAndPermission(employeeID uuid.UUID, permission string, enterpriseID uuid.UUID) error {
	return r.fresh().Exec("DELETE FROM employee_permissions WHERE employee_id = ? AND permission = ? AND enterprise_id = ?", employeeID, permission, enterpriseID).Error
}

func (r *employeePermissionRepo) ListByEmployee(employeeID uuid.UUID) ([]model.EmployeePermission, error) {
	var perms []model.EmployeePermission
	err := r.fresh().Where("employee_id = ?", employeeID).Find(&perms).Error
	return perms, err
}

func (r *employeePermissionRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.EmployeePermission, error) {
	var perms []model.EmployeePermission
	err := r.fresh().Where("enterprise_id = ?", enterpriseID).Find(&perms).Error
	return perms, err
}
