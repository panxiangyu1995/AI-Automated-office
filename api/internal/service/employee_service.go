package service

import (
	"crypto/rand"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type EmployeeService struct {
	empRepo  repository.EmployeeRepository
	deptRepo repository.DepartmentRepository
	userRepo repository.UserRepository
}

func NewEmployeeService(empRepo repository.EmployeeRepository, deptRepo repository.DepartmentRepository) *EmployeeService {
	return &EmployeeService{
		empRepo:  empRepo,
		deptRepo: deptRepo,
	}
}

func NewEmployeeServiceWithUser(empRepo repository.EmployeeRepository, deptRepo repository.DepartmentRepository, userRepo repository.UserRepository) *EmployeeService {
	return &EmployeeService{
		empRepo:  empRepo,
		deptRepo: deptRepo,
		userRepo: userRepo,
	}
}

func (s *EmployeeService) Create(enterpriseID, departmentID, name, email, phone, position, employeeNo, role string, hireDate *time.Time) (*model.Employee, *apperrors.AppError) {
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
	dept, err := s.deptRepo.FindByID(did, eid)
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

	if role == "" {
		role = "employee"
	}

	emp := &model.Employee{
		DepartmentID: did,
		Name:         name,
		Email:        email,
		Phone:        phone,
		Position:     position,
		EmployeeNo:   employeeNo,
		Role:         role,
		Status:       "active",
		HireDate:     hireDate,
	}
	emp.EnterpriseID = eid

	if err := s.empRepo.Create(emp); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建员工失败: " + err.Error())
	}

	if s.userRepo != nil && email != "" {
		tempPass := generateTempPassword()
		passwordHash, hashErr := auth.HashPassword(tempPass)
		if hashErr == nil {
			eidStr := enterpriseID
			empIDStr := emp.ID.String()
			user := &model.User{
				EnterpriseID: eidStr,
				EmployeeID:   &empIDStr,
				Email:        email,
				PasswordHash: passwordHash,
				Name:         name,
				Role:         "employee",
				Status:       "active",
			}
			if createErr := s.userRepo.Create(user); createErr != nil {
				s.empRepo.Delete(emp.ID, eid)
				return nil, apperrors.ErrInternal.WithDetail("创建用户账号失败: " + createErr.Error())
			}
		}
	}

	return emp, nil
}

type SalesPerformance struct {
	EmployeeID  string  `json:"employee_id"`
	Name        string  `json:"name"`
	Department  string  `json:"department"`
	TotalOrders int     `json:"total_orders"`
	TotalAmount float64 `json:"total_amount"`
	PeriodStart string  `json:"period_start"`
	PeriodEnd   string  `json:"period_end"`
}

func (s *EmployeeService) GetSalesPerformance(enterpriseID, employeeID, startTime, endTime string) ([]SalesPerformance, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	query := model.EmployeeQuery{EnterpriseID: enterpriseID}
	if employeeID != "" {
		eid, _ := uuid.Parse(employeeID)
		if eid != uuid.Nil {
			employees, _, err := s.empRepo.List(query)
			if err != nil {
				return nil, apperrors.ErrInternal.WithDetail("查询员工列表失败: " + err.Error())
			}
			for _, emp := range employees {
				if emp.ID == eid {
					deptName := ""
					dept, _ := s.deptRepo.FindByID(emp.DepartmentID, uuid.MustParse(enterpriseID))
					if dept != nil {
						deptName = dept.Name
					}
					return []SalesPerformance{{
						EmployeeID:  emp.ID.String(),
						Name:        emp.Name,
						Department:  deptName,
						TotalOrders: 0,
						TotalAmount: 0,
						PeriodStart: startTime,
						PeriodEnd:   endTime,
					}}, nil
				}
			}
			return nil, apperrors.ErrNotFound.WithDetail("员工不存在")
		}
	}
	employees, _, err := s.empRepo.List(query)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询员工列表失败: " + err.Error())
	}

	results := make([]SalesPerformance, 0, len(employees))
	for _, emp := range employees {
		deptName := ""
		dept, _ := s.deptRepo.FindByID(emp.DepartmentID, eid)
		if dept != nil {
			deptName = dept.Name
		}

		results = append(results, SalesPerformance{
			EmployeeID:  emp.ID.String(),
			Name:        emp.Name,
			Department:  deptName,
			TotalOrders: 0,
			TotalAmount: 0,
			PeriodStart: startTime,
			PeriodEnd:   endTime,
		})
	}
	return results, nil
}

type BatchImportResult struct {
	Total   int                `json:"total"`
	Created int                `json:"created"`
	Failed  int                `json:"failed"`
	Errors  []BatchImportError `json:"errors,omitempty"`
}

type BatchImportError struct {
	Index  int    `json:"index"`
	Name   string `json:"name"`
	Reason string `json:"reason"`
}

type BatchEmployee struct {
	DepartmentID string `json:"department_id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Position     string `json:"position"`
	EmployeeNo   string `json:"employee_no"`
	Role         string `json:"role"`
	HireDate     string `json:"hire_date"`
}

func (s *EmployeeService) BatchImport(enterpriseID string, employees []BatchEmployee) *BatchImportResult {
	result := &BatchImportResult{Total: len(employees)}

	for i, emp := range employees {
		var hireDate *time.Time
		if emp.HireDate != "" {
			t, err := time.Parse("2006-01-02", emp.HireDate)
			if err == nil {
				hireDate = &t
			}
		}

		_, appErr := s.Create(enterpriseID, emp.DepartmentID, emp.Name, emp.Email, emp.Phone, emp.Position, emp.EmployeeNo, emp.Role, hireDate)
		if appErr != nil {
			result.Failed++
			result.Errors = append(result.Errors, BatchImportError{
				Index:  i,
				Name:   emp.Name,
				Reason: appErr.Message,
			})
		} else {
			result.Created++
		}
	}

	return result
}

func generateTempPassword() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		for i := range b {
			b[i] = charset[i%len(charset)]
		}
		return string(b)
	}
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b)
}

func (s *EmployeeService) Update(enterpriseID, employeeID, name, email, phone, position, employeeNo, role, status string) (*model.Employee, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	empID, err := uuid.Parse(employeeID)
	if err != nil {
		return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	emp, err := s.empRepo.FindByID(empID, eid)
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
	if role != "" {
		emp.Role = role
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

func (s *EmployeeService) Delete(enterpriseID, employeeID string) *apperrors.AppError {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	empID, err := uuid.Parse(employeeID)
	if err != nil {
		return apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	emp, err := s.empRepo.FindByID(empID, eid)
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

func (s *EmployeeService) Get(enterpriseID, employeeID string) (*model.Employee, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	empID, err := uuid.Parse(employeeID)
	if err != nil {
		return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	emp, err := s.empRepo.FindByID(empID, eid)
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

func (s *EmployeeService) Transfer(enterpriseID, employeeID, newDepartmentID string) (*model.Employee, *apperrors.AppError) {
	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	empID, err := uuid.Parse(employeeID)
	if err != nil {
		return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
	}

	emp, err := s.empRepo.FindByID(empID, entID)
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
	dept, err := s.deptRepo.FindByID(did, entID)
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
