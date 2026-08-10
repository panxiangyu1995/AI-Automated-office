package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type PaymentPlanService struct {
	repo repository.PaymentPlanRepository
}

func NewPaymentPlanService(repo repository.PaymentPlanRepository) *PaymentPlanService {
	return &PaymentPlanService{repo}
}

type PaymentPlanItem struct {
	DueDate string  `json:"due_date"`
	Amount  float64 `json:"amount"`
	Notes   string  `json:"notes,omitempty"`
}

func (s *PaymentPlanService) CreateBatch(eid, contractID string, items []PaymentPlanItem) ([]model.PaymentPlan, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	var plans []model.PaymentPlan
	for i, item := range items {
		var dueDate *time.Time
		if item.DueDate != "" {
			t, parseErr := time.Parse("2006-01-02", item.DueDate)
			if parseErr != nil {
				return nil, apperrors.NewValidationError("due_date", "日期格式无效，需要 YYYY-MM-DD")
			}
			dueDate = &t
		}
		plans = append(plans, model.PaymentPlan{
			ContractID: contractID,
			PlanNo:     fmt.Sprintf("PP-%s-%03d", uuid.New().String()[:8], i+1),
			DueDate:    dueDate,
			Amount:     item.Amount,
			Status:     model.PaymentPlanStatusPending,
			Notes:      item.Notes,
		})
	}

	for i := range plans {
		plans[i].EnterpriseID = id
	}

	if err := s.repo.CreateBatch(plans); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建回款计划失败")
	}
	return plans, nil
}

func (s *PaymentPlanService) Update(id, enterpriseID string, input map[string]interface{}) (*model.PaymentPlan, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	p, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询回款计划失败")
	}
	if p == nil {
		return nil, apperrors.ErrNotFound.WithDetail("回款计划不存在")
	}
	result, dbErr := s.repo.UpdateFields(pid, eid, input)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新回款计划失败")
	}
	return result, nil
}

func (s *PaymentPlanService) Delete(id, enterpriseID string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "无效")
	}
	p, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return apperrors.ErrInternal.WithDetail("查询回款计划失败")
	}
	if p == nil {
		return apperrors.ErrNotFound.WithDetail("回款计划不存在")
	}
	if err := s.repo.Delete(pid, eid); err != nil {
		return apperrors.ErrInternal.WithDetail("删除回款计划失败")
	}
	return nil
}

func (s *PaymentPlanService) List(contractID string) ([]model.PaymentPlan, *apperrors.AppError) {
	plans, dbErr := s.repo.ListByContractID(contractID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询回款计划失败")
	}
	return plans, nil
}

func (s *PaymentPlanService) ListOverdue(eid string) ([]model.PaymentPlan, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	plans, dbErr := s.repo.ListOverdue(id, model.PaymentPlanStatusPending, time.Now())
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询逾期计划失败")
	}
	return plans, nil
}

func (s *PaymentPlanService) CheckAndRemindOverdue() {
	now := time.Now()
	plans, _ := s.repo.FindPendingUnreminded(now)

	for _, plan := range plans {
		sevenDaysAgo := now.AddDate(0, 0, -7)
		if plan.DueDate != nil && plan.DueDate.Before(sevenDaysAgo) {
			s.repo.UpdatePlanFields(plan.ID, plan.EnterpriseID, map[string]interface{}{
				"status":        model.PaymentPlanStatusOverdue,
				"reminder_sent": true,
			})
		} else {
			s.repo.UpdatePlanReminderSent(plan.ID, plan.EnterpriseID)
		}
	}
}
