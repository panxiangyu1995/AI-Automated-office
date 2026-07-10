package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type EmployeePermissionService struct {
	permRepo repository.EmployeePermissionRepository
}

func NewEmployeePermissionService(permRepo repository.EmployeePermissionRepository) *EmployeePermissionService {
	return &EmployeePermissionService{permRepo: permRepo}
}

func (s *EmployeePermissionService) Set(enterpriseID, employeeID, permission, grantedBy, effect string) (*model.EmployeePermission, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	empID, err := uuid.Parse(employeeID)
	if err != nil {
		return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
	}
	gb, err := uuid.Parse(grantedBy)
	if err != nil {
		return nil, apperrors.NewValidationError("granted_by", "授权人ID无效")
	}
	if permission == "" {
		return nil, apperrors.NewValidationError("permission", "权限不能为空")
	}
	if effect == "" {
		effect = "allow"
	}
	if effect != "allow" && effect != "deny" {
		return nil, apperrors.NewValidationError("effect", "effect 必须为 allow 或 deny")
	}

	s.permRepo.DeleteByEmployeeAndPermission(empID, permission)

	perm := &model.EmployeePermission{
		EmployeeID: empID,
		Permission: permission,
		GrantedBy:  gb,
		Effect:     effect,
	}
	perm.EnterpriseID = eid

	if err := s.permRepo.Create(perm); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("设置员工权限失败: " + err.Error())
	}
	return perm, nil
}

func (s *EmployeePermissionService) Revoke(employeeID, permission string) *apperrors.AppError {
	empID, err := uuid.Parse(employeeID)
	if err != nil {
		return apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	if err := s.permRepo.DeleteByEmployeeAndPermission(empID, permission); err != nil {
		return apperrors.ErrInternal.WithDetail("撤销权限失败: " + err.Error())
	}
	return nil
}

func (s *EmployeePermissionService) ListByEmployee(employeeID string) ([]model.EmployeePermission, *apperrors.AppError) {
	empID, err := uuid.Parse(employeeID)
	if err != nil {
		return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	perms, err := s.permRepo.ListByEmployee(empID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询员工权限失败: " + err.Error())
	}
	return perms, nil
}

func (s *EmployeePermissionService) HasPermission(employeeID uuid.UUID, permission string) (bool, bool, error) {
	perms, err := s.permRepo.ListByEmployee(employeeID)
	if err != nil {
		return false, false, err
	}

	for _, p := range perms {
		if p.Permission == permission {
			return true, p.Effect == "allow", nil
		}
	}
	return false, false, nil
}
