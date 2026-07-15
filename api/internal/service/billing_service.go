package service

import (
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type BillingService struct {
	billingRepo repository.BillingRepository
}

func NewBillingService(billingRepo repository.BillingRepository) *BillingService {
	return &BillingService{billingRepo: billingRepo}
}

func (s *BillingService) CreatePlan(plan *model.SubscriptionPlan) *apperrors.AppError {
	if err := s.billingRepo.CreatePlan(plan); err != nil {
		return apperrors.ErrInternal.WithDetail("创建订阅计划失败")
	}
	return nil
}

func (s *BillingService) ListPlans(enterpriseID uuid.UUID, page, pageSize int) ([]model.SubscriptionPlan, int64, *apperrors.AppError) {
	items, total, err := s.billingRepo.ListPlans(enterpriseID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func (s *BillingService) Subscribe(enterpriseID uuid.UUID, planID uuid.UUID, billingCycle string) (*model.EnterpriseSubscription, *apperrors.AppError) {
	plan, err := s.billingRepo.FindPlanByID(planID)
	if err != nil || plan == nil {
		return nil, apperrors.ErrNotFound.WithDetail("订阅计划不存在")
	}

	now := time.Now()
	var periodEnd time.Time
	if billingCycle == "yearly" {
		periodEnd = now.AddDate(1, 0, 0)
	} else {
		periodEnd = now.AddDate(0, 1, 0)
	}

	if billingCycle == "" {
		billingCycle = "monthly"
	}

	nowStr := now.Format(time.RFC3339)
	endStr := periodEnd.Format(time.RFC3339)

	entIDStr := enterpriseID.String()
	planIDStr := planID.String()
	sub := &model.EnterpriseSubscription{
		EnterpriseID:       entIDStr,
		PlanID:             planIDStr,
		Status:             "active",
		StartAt:            &nowStr,
		EndAt:              &endStr,
		AutoRenew:          true,
		CurrentPeriodStart: &nowStr,
		CurrentPeriodEnd:   &endStr,
		BillingCycle:       billingCycle,
	}

	if err := s.billingRepo.CreateSubscription(sub); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建订阅失败")
	}

	var amount float64
	if billingCycle == "yearly" {
		amount = plan.PriceYearly
	} else {
		amount = plan.PriceMonthly
	}
	if amount == 0 {
		amount = plan.Price
	}

	subID, _ := uuid.Parse(sub.ID.String())
	record := &model.BillingRecord{
		EnterpriseID:   enterpriseID,
		SubscriptionID: subID,
		Amount:         amount,
		Type:           "charge",
		Status:         "pending",
		PeriodStart:    &now,
		PeriodEnd:      &periodEnd,
		DueDate:        &now,
	}
	record.EnterpriseID = enterpriseID
	if err := s.billingRepo.CreateBillingRecord(record); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建账单记录失败")
	}

	return sub, nil
}

func (s *BillingService) UpgradePlan(subscriptionID uuid.UUID, newPlanID uuid.UUID) (*model.BillingRecord, *apperrors.AppError) {
	sub, err := s.billingRepo.FindSubscriptionByID(subscriptionID)
	if err != nil || sub == nil {
		return nil, apperrors.ErrNotFound.WithDetail("订阅不存在")
	}

	oldPlanID, _ := uuid.Parse(sub.PlanID)
	oldPlan, err := s.billingRepo.FindPlanByID(oldPlanID)
	if err != nil || oldPlan == nil {
		return nil, apperrors.ErrNotFound.WithDetail("原订阅计划不存在")
	}

	newPlan, err := s.billingRepo.FindPlanByID(newPlanID)
	if err != nil || newPlan == nil {
		return nil, apperrors.ErrNotFound.WithDetail("新订阅计划不存在")
	}

	proratedAmount := s.calculateProration(*sub, *oldPlan, *newPlan)

	entID, _ := uuid.Parse(sub.EnterpriseID)
	now := time.Now()
	record := &model.BillingRecord{
		EnterpriseID:   entID,
		SubscriptionID: subscriptionID,
		Amount:         proratedAmount,
		Type:           "upgrade_charge",
		Status:         "pending",
		PeriodStart:    &now,
	}
	record.EnterpriseID = entID
	if err := s.billingRepo.CreateBillingRecord(record); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建升级账单失败")
	}

	sub.PlanID = newPlanID.String()
	s.billingRepo.SaveSubscription(sub)

	return record, nil
}

func (s *BillingService) DowngradePlan(subscriptionID uuid.UUID, newPlanID uuid.UUID) (*model.BillingRecord, *apperrors.AppError) {
	sub, err := s.billingRepo.FindSubscriptionByID(subscriptionID)
	if err != nil || sub == nil {
		return nil, apperrors.ErrNotFound.WithDetail("订阅不存在")
	}

	oldPlanID, _ := uuid.Parse(sub.PlanID)
	oldPlan, err := s.billingRepo.FindPlanByID(oldPlanID)
	if err != nil || oldPlan == nil {
		return nil, apperrors.ErrNotFound.WithDetail("原订阅计划不存在")
	}

	newPlan, err := s.billingRepo.FindPlanByID(newPlanID)
	if err != nil || newPlan == nil {
		return nil, apperrors.ErrNotFound.WithDetail("新订阅计划不存在")
	}

	proratedAmount := s.calculateProration(*sub, *oldPlan, *newPlan)

	entID, _ := uuid.Parse(sub.EnterpriseID)
	now := time.Now()
	recordType := "downgrade_credit"
	if proratedAmount > 0 {
		recordType = "downgrade_charge"
	} else {
		proratedAmount = math.Abs(proratedAmount)
	}
	record := &model.BillingRecord{
		EnterpriseID:   entID,
		SubscriptionID: subscriptionID,
		Amount:         proratedAmount,
		Type:           recordType,
		Status:         "pending",
		PeriodStart:    &now,
	}
	record.EnterpriseID = entID
	if err := s.billingRepo.CreateBillingRecord(record); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建降级账单失败")
	}

	sub.PlanID = newPlanID.String()
	s.billingRepo.SaveSubscription(sub)

	return record, nil
}

func (s *BillingService) calculateProration(sub model.EnterpriseSubscription, oldPlan, newPlan model.SubscriptionPlan) float64 {
	if sub.CurrentPeriodStart == nil || sub.CurrentPeriodEnd == nil {
		return newPlan.Price - oldPlan.Price
	}

	start, err := time.Parse(time.RFC3339, *sub.CurrentPeriodStart)
	if err != nil {
		return newPlan.Price - oldPlan.Price
	}
	end, err := time.Parse(time.RFC3339, *sub.CurrentPeriodEnd)
	if err != nil {
		return newPlan.Price - oldPlan.Price
	}

	totalDays := end.Sub(start).Hours() / 24
	if totalDays <= 0 {
		return newPlan.Price - oldPlan.Price
	}

	now := time.Now()
	if now.After(end) {
		now = end
	}
	remainingDays := end.Sub(now).Hours() / 24
	if remainingDays < 0 {
		remainingDays = 0
	}

	var oldPrice, newPrice float64
	if sub.BillingCycle == "yearly" {
		oldPrice = oldPlan.PriceYearly
		newPrice = newPlan.PriceYearly
	} else {
		oldPrice = oldPlan.PriceMonthly
		newPrice = newPlan.PriceMonthly
	}
	if oldPrice == 0 {
		oldPrice = oldPlan.Price
	}
	if newPrice == 0 {
		newPrice = newPlan.Price
	}

	return (newPrice - oldPrice) * remainingDays / totalDays
}

func (s *BillingService) RenewSubscription(subscriptionID uuid.UUID) (*model.EnterpriseSubscription, *apperrors.AppError) {
	sub, err := s.billingRepo.FindSubscriptionByID(subscriptionID)
	if err != nil || sub == nil {
		return nil, apperrors.ErrNotFound.WithDetail("订阅不存在")
	}

	planID, _ := uuid.Parse(sub.PlanID)
	plan, err := s.billingRepo.FindPlanByID(planID)
	if err != nil || plan == nil {
		return nil, apperrors.ErrNotFound.WithDetail("订阅计划不存在")
	}

	var periodStart, periodEnd time.Time
	if sub.CurrentPeriodEnd != nil {
		prevEnd, err := time.Parse(time.RFC3339, *sub.CurrentPeriodEnd)
		if err != nil {
			periodStart = time.Now()
		} else {
			periodStart = prevEnd
		}
	} else {
		periodStart = time.Now()
	}

	if sub.BillingCycle == "yearly" {
		periodEnd = periodStart.AddDate(1, 0, 0)
	} else {
		periodEnd = periodStart.AddDate(0, 1, 0)
	}

	startStr := periodStart.Format(time.RFC3339)
	endStr := periodEnd.Format(time.RFC3339)
	sub.CurrentPeriodStart = &startStr
	sub.CurrentPeriodEnd = &endStr
	sub.Status = "active"
	sub.GracePeriodEnd = nil
	s.billingRepo.SaveSubscription(sub)

	var amount float64
	if sub.BillingCycle == "yearly" {
		amount = plan.PriceYearly
	} else {
		amount = plan.PriceMonthly
	}
	if amount == 0 {
		amount = plan.Price
	}

	entID, _ := uuid.Parse(sub.EnterpriseID)
	record := &model.BillingRecord{
		EnterpriseID:   entID,
		SubscriptionID: subscriptionID,
		Amount:         amount,
		Type:           "charge",
		Status:         "pending",
		PeriodStart:    &periodStart,
		PeriodEnd:      &periodEnd,
		DueDate:        &periodStart,
	}
	record.EnterpriseID = entID
	if err := s.billingRepo.CreateBillingRecord(record); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建续费账单失败")
	}

	return sub, nil
}

func (s *BillingService) GenerateBill(subscriptionID uuid.UUID) (*model.BillingRecord, *apperrors.AppError) {
	sub, err := s.billingRepo.FindSubscriptionByID(subscriptionID)
	if err != nil || sub == nil {
		return nil, apperrors.ErrNotFound.WithDetail("订阅不存在")
	}

	planID, _ := uuid.Parse(sub.PlanID)
	plan, err := s.billingRepo.FindPlanByID(planID)
	if err != nil || plan == nil {
		return nil, apperrors.ErrNotFound.WithDetail("订阅计划不存在")
	}

	var periodStart, periodEnd time.Time
	if sub.CurrentPeriodStart != nil {
		ps, err := time.Parse(time.RFC3339, *sub.CurrentPeriodStart)
		if err != nil {
			periodStart = time.Now()
		} else {
			periodStart = ps
		}
	} else {
		periodStart = time.Now()
	}
	if sub.CurrentPeriodEnd != nil {
		pe, err := time.Parse(time.RFC3339, *sub.CurrentPeriodEnd)
		if err != nil {
			periodEnd = periodStart.AddDate(0, 1, 0)
		} else {
			periodEnd = pe
		}
	} else {
		periodEnd = periodStart.AddDate(0, 1, 0)
	}

	var amount float64
	if sub.BillingCycle == "yearly" {
		amount = plan.PriceYearly
	} else {
		amount = plan.PriceMonthly
	}
	if amount == 0 {
		amount = plan.Price
	}

	entID, _ := uuid.Parse(sub.EnterpriseID)
	now := time.Now()
	record := &model.BillingRecord{
		EnterpriseID:   entID,
		SubscriptionID: subscriptionID,
		Amount:         amount,
		Type:           "charge",
		Status:         "pending",
		PeriodStart:    &periodStart,
		PeriodEnd:      &periodEnd,
		DueDate:        &now,
	}
	record.EnterpriseID = entID
	if err := s.billingRepo.CreateBillingRecord(record); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成账单失败")
	}

	return record, nil
}

func (s *BillingService) ProcessGracePeriod() (int, error) {
	subs, err := s.billingRepo.FindActiveOrPastDueSubscriptions()
	if err != nil {
		return 0, err
	}

	processed := 0
	for i := range subs {
		if subs[i].CurrentPeriodEnd == nil {
			continue
		}
		periodEnd, err := time.Parse(time.RFC3339, *subs[i].CurrentPeriodEnd)
		if err != nil {
			continue
		}

		if time.Now().After(periodEnd) && subs[i].Status == "active" {
			graceEnd := periodEnd.Add(7 * 24 * time.Hour)
			graceEndStr := graceEnd.Format(time.RFC3339)
			subs[i].GracePeriodEnd = &graceEndStr
			subs[i].Status = "past_due"
			s.billingRepo.SaveSubscription(&subs[i])
			processed++
			continue
		}

		if subs[i].GracePeriodEnd != nil && subs[i].Status == "past_due" {
			graceEnd, err := time.Parse(time.RFC3339, *subs[i].GracePeriodEnd)
			if err != nil {
				continue
			}
			if time.Now().After(graceEnd) {
				subs[i].Status = "suspended"
				s.billingRepo.SaveSubscription(&subs[i])
				processed++
			}
		}
	}

	return processed, nil
}

func (s *BillingService) Refund(billingRecordID uuid.UUID) (*model.BillingRecord, *apperrors.AppError) {
	record, err := s.billingRepo.FindBillingRecordByID(billingRecordID)
	if err != nil || record == nil {
		return nil, apperrors.ErrNotFound.WithDetail("账单记录不存在")
	}

	now := time.Now()
	record.Status = "refunded"
	record.PaidAt = &now
	if err := s.billingRepo.SaveBillingRecord(record); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("退款失败")
	}

	return record, nil
}

func (s *BillingService) GetRevenueSummary(enterpriseID uuid.UUID, period string) (map[string]interface{}, *apperrors.AppError) {
	var startDate time.Time
	now := time.Now()
	switch period {
	case "quarterly":
		startDate = now.AddDate(0, -3, 0)
	case "yearly":
		startDate = now.AddDate(-1, 0, 0)
	default:
		startDate = now.AddDate(0, -1, 0)
	}

	totalCharges, totalRevenue, err := s.billingRepo.CountBillingRecords(enterpriseID, "paid", []string{"charge", "upgrade_charge"}, startDate)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询收入统计失败")
	}

	totalRefunds, refundAmount, err := s.billingRepo.CountBillingRecords(enterpriseID, "refunded", nil, startDate)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询退款统计失败")
	}

	pendingCount, err := s.billingRepo.CountPendingBillingRecords(enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询待付款统计失败")
	}

	return map[string]interface{}{
		"period":        period,
		"start_date":    startDate.Format(time.RFC3339),
		"end_date":      now.Format(time.RFC3339),
		"total_revenue": totalRevenue,
		"charge_count":  totalCharges,
		"refund_count":  totalRefunds,
		"refund_amount": refundAmount,
		"pending_count": pendingCount,
		"net_revenue":   totalRevenue - refundAmount,
	}, nil
}

func (s *BillingService) ListBills(enterpriseID uuid.UUID, page, pageSize int) ([]model.BillingRecord, int64, *apperrors.AppError) {
	items, total, err := s.billingRepo.ListBillingRecords(enterpriseID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func (s *BillingService) GetBill(id uuid.UUID) (*model.BillingRecord, *apperrors.AppError) {
	record, err := s.billingRepo.FindBillingRecordByID(id)
	if err != nil || record == nil {
		return nil, apperrors.ErrNotFound.WithDetail("账单记录不存在")
	}
	return record, nil
}

func (s *BillingService) genBillNo(prefix string) string {
	return fmt.Sprintf("%s-%s", prefix, uuid.New().String()[:8])
}
