package repository

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"gorm.io/gorm"
)

type PermissionRepository interface {
	ListPermissions() ([]model.Permission, error)
	FindPermissionByCode(code string) (*model.Permission, error)
	CreatePermission(perm *model.Permission) error
}

type permissionRepo struct {
	db *gorm.DB
}

func NewPermissionRepository(db *gorm.DB) PermissionRepository {
	return &permissionRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *permissionRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *permissionRepo) ListPermissions() ([]model.Permission, error) {
	var perms []model.Permission
	err := r.fresh().Find(&perms).Error
	return perms, err
}

func (r *permissionRepo) FindPermissionByCode(code string) (*model.Permission, error) {
	var perm model.Permission
	err := r.fresh().Where("code = ?", code).First(&perm).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &perm, nil
}

func (r *permissionRepo) CreatePermission(perm *model.Permission) error {
	return r.fresh().Create(perm).Error
}

type RoleRepository interface {
	ListRoles(enterpriseID uuid.UUID) ([]model.Role, error)
	FindRoleByID(id, enterpriseID uuid.UUID) (*model.Role, error)
	CreateRole(role *model.Role) error
	UpdateRole(role *model.Role) error
	DeleteRole(id, enterpriseID uuid.UUID) error
	GetRolePermissions(roleID uuid.UUID) ([]model.Permission, error)
	SetRolePermissions(roleID uuid.UUID, permissionIDs []uuid.UUID) error
}

type roleRepo struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *roleRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *roleRepo) ListRoles(enterpriseID uuid.UUID) ([]model.Role, error) {
	var roles []model.Role
	err := r.fresh().Where("enterprise_id = ?", enterpriseID).Find(&roles).Error
	return roles, err
}

func (r *roleRepo) FindRoleByID(id, enterpriseID uuid.UUID) (*model.Role, error) {
	var role model.Role
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&role).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &role, nil
}

func (r *roleRepo) CreateRole(role *model.Role) error {
	return r.fresh().Create(role).Error
}

func (r *roleRepo) UpdateRole(role *model.Role) error {
	return r.fresh().Model(&model.Role{}).Where("id = ? AND enterprise_id = ?", role.ID, role.EnterpriseID).Updates(map[string]interface{}{
		"name":        role.Name,
		"description": role.Description,
		"updated_at":  gorm.Expr("NOW()"),
	}).Error
}

func (r *roleRepo) DeleteRole(id, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.Role{}).Error
}

func (r *roleRepo) GetRolePermissions(roleID uuid.UUID) ([]model.Permission, error) {
	var perms []model.Permission
	err := r.fresh().Table("permissions").
		Joins("JOIN role_permissions ON role_permissions.permission_id = permissions.id").
		Where("role_permissions.role_id = ?", roleID).
		Find(&perms).Error
	return perms, err
}

func (r *roleRepo) SetRolePermissions(roleID uuid.UUID, permissionIDs []uuid.UUID) error {
	return r.fresh().Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("role_id = ?", roleID).Delete(&model.RolePermission{}).Error; err != nil {
			return err
		}
		for _, pid := range permissionIDs {
			rp := model.RolePermission{RoleID: roleID, PermissionID: pid}
			if err := tx.Create(&rp).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

type EmployeePermissionABACRepository interface {
	FindByEmployeeID(employeeID uuid.UUID) ([]model.EmployeePermissionABAC, error)
	Create(empPerm *model.EmployeePermissionABAC) error
	Delete(id, enterpriseID uuid.UUID) error
}

type employeePermissionABACRepo struct {
	db *gorm.DB
}

func NewEmployeePermissionABACRepository(db *gorm.DB) EmployeePermissionABACRepository {
	return &employeePermissionABACRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *employeePermissionABACRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *employeePermissionABACRepo) FindByEmployeeID(employeeID uuid.UUID) ([]model.EmployeePermissionABAC, error) {
	var perms []model.EmployeePermissionABAC
	err := r.fresh().Where("employee_id = ?", employeeID).Find(&perms).Error
	return perms, err
}

func (r *employeePermissionABACRepo) Create(empPerm *model.EmployeePermissionABAC) error {
	return r.fresh().Create(empPerm).Error
}

func (r *employeePermissionABACRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.EmployeePermissionABAC{}).Error
}

type CustomRuleRepository interface {
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.CustomRule, error)
	Create(rule *model.CustomRule) error
	Delete(id, enterpriseID uuid.UUID) error
}

type customRuleRepo struct {
	db *gorm.DB
}

func NewCustomRuleRepository(db *gorm.DB) CustomRuleRepository {
	return &customRuleRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *customRuleRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *customRuleRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.CustomRule, error) {
	var rules []model.CustomRule
	err := r.fresh().Where("enterprise_id = ? AND is_active = ?", enterpriseID, true).Find(&rules).Error
	return rules, err
}

func (r *customRuleRepo) Create(rule *model.CustomRule) error {
	return r.fresh().Create(rule).Error
}

func (r *customRuleRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.CustomRule{}).Error
}
