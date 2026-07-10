package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type EnterpriseSummary struct {
	EnterpriseID   string `json:"enterprise_id"`
	EnterpriseName string `json:"enterprise_name"`
	DepartmentCount int64 `json:"department_count"`
	EmployeeCount   int64 `json:"employee_count"`
	ActiveEmployees int64 `json:"active_employees"`
}

type GroupSummary struct {
	GroupID      string               `json:"group_id"`
	EnterpriseCount int               `json:"enterprise_count"`
	Enterprises  []EnterpriseSummary  `json:"enterprises"`
	TotalEmployees int64              `json:"total_employees"`
	TotalActive   int64               `json:"total_active"`
}

type SummaryService struct {
	enterpriseRepo repository.EnterpriseRepository
	employeeRepo   repository.EmployeeRepository
	deptRepo       repository.DepartmentRepository
}

func NewSummaryService(enterpriseRepo repository.EnterpriseRepository, employeeRepo repository.EmployeeRepository, deptRepo repository.DepartmentRepository) *SummaryService {
	return &SummaryService{
		enterpriseRepo: enterpriseRepo,
		employeeRepo:   employeeRepo,
		deptRepo:       deptRepo,
	}
}

func (s *SummaryService) GetGroupSummary(groupID string) (*GroupSummary, *apperrors.AppError) {
	gid, err := uuid.Parse(groupID)
	if err != nil {
		return nil, apperrors.NewValidationError("group_id", "集团ID无效")
	}

	enterprises, err := s.enterpriseRepo.ListByGroup(groupID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询企业列表失败: " + err.Error())
	}

	summary := &GroupSummary{
		GroupID:      gid.String(),
		EnterpriseCount: len(enterprises),
		Enterprises:  make([]EnterpriseSummary, 0, len(enterprises)),
	}

	for _, ent := range enterprises {
		eid := ent.ID

		deptCount, _ := s.deptRepo.CountByEnterprise(eid)
		empCount, _ := s.employeeRepo.CountByEnterprise(eid)
		activeCount, _ := s.employeeRepo.CountActiveByEnterprise(eid)

		es := EnterpriseSummary{
			EnterpriseID:    eid.String(),
			EnterpriseName:  ent.Name,
			DepartmentCount: deptCount,
			EmployeeCount:   empCount,
			ActiveEmployees: activeCount,
		}
		summary.Enterprises = append(summary.Enterprises, es)
		summary.TotalEmployees += empCount
		summary.TotalActive += activeCount
	}

	return summary, nil
}
