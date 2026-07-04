package service

import (
	"time"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type EmployeeService struct {
	empRepo  repository.EmployeeRepository
	deptRepo repository.DepartmentRepository
}

func NewEmployeeService(empRepo repository.EmployeeRepository, deptRepo repository.DepartmentRepository) *EmployeeService {
	return &EmployeeService{
		empRepo:  empRepo,
		deptRepo: deptRepo,
	}
}

func (s *EmployeeService) Create(enterpriseID, departmentID, name, email, phone, position, employeeNo string, hireDate *time.Time) (*model.Employee, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "员工姓名不能为空")
	}

	did, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, apperrors.NewValidationError("department_id", "部门ID无效")
	}
	dept, err := s.deptRepo.FindByID(did)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询部门失败")
	}
	if dept == nil {
		return nil, apperrors.ErrNotFound.WithDetail("部门不存在")
	}

	if email != "" {
		existing, _ := s.empRepo.FindByEmail(email, eid)
		if existing != nil {
			return nil, apperrors.ErrDuplicateEntry.WithDetail("该邮箱已被使用")
		}
	}

	emp := &model.Employee{
		DepartmentID: did,
		Name:         name,
		Email:        email,
		Phone:        phone,
		Position:     position,
		EmployeeNo:   employeeNo,
		Status:       "active",
		HireDate:     hireDate,
	}
	emp.EnterpriseID = eid

	if err := s.empRepo.Create(emp); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建员工失败: " + err.Error())
	}
	return emp, nil
}

func (s *EmployeeService) Update(employeeID, name, email, phone, position, employeeNo, status string) (*model.Employee, *apperrors.AppError) {
	eid, err := uuid.Parse(employeeID)
	if err != nil {
		return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	emp, err := s.empRepo.FindByID(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询员工失败")
	}
	if emp == nil {
		return nil, apperrors.ErrNotFound.WithDetail("员工不存在")
	}

	if name != "" {
		emp.Name = name
	}
	if email != "" {
		emp.Email = email
	}
	if phone != "" {
		emp.Phone = phone
	}
	if position != "" {
		emp.Position = position
	}
	if employeeNo != "" {
		emp.EmployeeNo = employeeNo
	}
	if status != "" {
		emp.Status = status
		if status == "resigned" {
			now := time.Now()
			emp.ResignDate = &now
		}
	}

	if err := s.empRepo.Update(emp); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新员工失败: " + err.Error())
	}
	return emp, nil
}

func (s *EmployeeService) Delete(employeeID string) *apperrors.AppError {
	eid, err := uuid.Parse(employeeID)
	if err != nil {
		return apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	emp, err := s.empRepo.FindByID(eid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询员工失败")
	}
	if emp == nil {
		return apperrors.ErrNotFound.WithDetail("员工不存在")
	}

	now := time.Now()
	emp.Status = "resigned"
	emp.ResignDate = &now
	if err := s.empRepo.Update(emp); err != nil {
		return apperrors.ErrInternal.WithDetail("离职处理失败: " + err.Error())
	}
	return nil
}

func (s *EmployeeService) Get(employeeID string) (*model.Employee, *apperrors.AppError) {
	eid, err := uuid.Parse(employeeID)
	if err != nil {
		return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	emp, err := s.empRepo.FindByID(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询员工失败")
	}
	if emp == nil {
		return nil, apperrors.ErrNotFound.WithDetail("员工不存在")
	}
	return emp, nil
}

func (s *EmployeeService) List(query model.EmployeeQuery) ([]model.Employee, int64, *apperrors.AppError) {
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PageSize < 1 || query.PageSize > 100 {
		query.PageSize = 20
	}

	employees, total, err := s.empRepo.List(query)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询员工列表失败: " + err.Error())
	}
	return employees, total, nil
}

func (s *EmployeeService) Transfer(employeeID, newDepartmentID string) (*model.Employee, *apperrors.AppError) {
	eid, err := uuid.Parse(employeeID)
	if err != nil {
		return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	emp, err := s.empRepo.FindByID(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询员工失败")
	}
	if emp == nil {
		return nil, apperrors.ErrNotFound.WithDetail("员工不存在")
	}

	did, err := uuid.Parse(newDepartmentID)
	if err != nil {
		return nil, apperrors.NewValidationError("department_id", "新部门ID无效")
	}
	dept, err := s.deptRepo.FindByID(did)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询新部门失败")
	}
	if dept == nil {
		return nil, apperrors.ErrNotFound.WithDetail("新部门不存在")
	}

	emp.DepartmentID = did
	if err := s.empRepo.Update(emp); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("调岗失败: " + err.Error())
	}
	return emp, nil
}
