package service

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type PaymentPlanService struct{ db *gorm.DB }

func NewPaymentPlanService(db *gorm.DB) *PaymentPlanService { return &PaymentPlanService{db} }

type PaymentPlanItem struct {
	PlanDate string  `json:"plan_date"`
	Amount   float64 `json:"amount"`
}

func (s *PaymentPlanService) CreateBatch(eid, contractID string, items []PaymentPlanItem) ([]model.PaymentPlan, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	var plans []model.PaymentPlan
	for _, item := range items {
		planDate, parseErr := time.Parse("2006-01-02", item.PlanDate)
		if parseErr != nil {
			return nil, apperrors.NewValidationError("plan_date", "日期格式无效，需要 YYYY-MM-DD")
		}
		plans = append(plans, model.PaymentPlan{
			ContractID: contractID,
			PlanDate:   planDate,
			Amount:     item.Amount,
			Status:     model.PaymentPlanStatusPending,
		})
	}

	for i := range plans {
		plans[i].EnterpriseID = id
	}

	if err := s.db.Create(&plans).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建回款计划失败")
	}
	return plans, nil
}

func (s *PaymentPlanService) Update(id string, input map[string]interface{}) (*model.PaymentPlan, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	var p model.PaymentPlan
	if err := s.db.Where("id=?", pid).First(&p).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("回款计划不存在")
	}
	if err := s.db.Model(&p).Updates(input).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新回款计划失败")
	}
	s.db.Where("id=?", pid).First(&p)
	return &p, nil
}

func (s *PaymentPlanService) Delete(id string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	if err := s.db.Where("id=?", pid).Delete(&model.PaymentPlan{}).Error; err != nil {
		return apperrors.ErrInternal.WithDetail("删除回款计划失败")
	}
	return nil
}

func (s *PaymentPlanService) List(contractID string) ([]model.PaymentPlan, *apperrors.AppError) {
	var plans []model.PaymentPlan
	if err := s.db.Where("contract_id=?", contractID).Order("plan_date ASC").Find(&plans).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询回款计划失败")
	}
	return plans, nil
}

func (s *PaymentPlanService) ListOverdue(eid string) ([]model.PaymentPlan, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	var plans []model.PaymentPlan
	if err := s.db.Where("enterprise_id=? AND status=? AND plan_date <= ?", id, model.PaymentPlanStatusPending, time.Now()).
		Order("plan_date ASC").Find(&plans).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询逾期计划失败")
	}
	return plans, nil
}

func (s *PaymentPlanService) CheckAndRemindOverdue() {
	now := time.Now()
	var plans []model.PaymentPlan

	s.db.Where("status = ? AND plan_date <= ? AND reminder_sent = ?",
		model.PaymentPlanStatusPending, now, false).Find(&plans)

	for _, plan := range plans {
		sevenDaysAgo := now.AddDate(0, 0, -7)
		if plan.PlanDate.Before(sevenDaysAgo) {
			s.db.Model(&plan).Updates(map[string]interface{}{
				"status":        model.PaymentPlanStatusOverdue,
				"reminder_sent": true,
			})
		} else {
			s.db.Model(&plan).Update("reminder_sent", true)
		}
	}
}
