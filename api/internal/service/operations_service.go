package service

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type OperationsService struct{ db *gorm.DB }
func NewOperationsService(db *gorm.DB) *OperationsService { return &OperationsService{db} }

func (s *OperationsService) CreatePlan(eid, name, desc, features string, price float64, maxUsers int, maxStorage int64) (*model.SubscriptionPlan, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	p := &model.SubscriptionPlan{Name: name, Description: desc, Price: price, MaxUsers: maxUsers, MaxStorage: maxStorage, Features: features, Status: "active"}
	p.EnterpriseID = id
	if err := s.db.Create(p).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建套餐失败") }
	return p, nil
}

func (s *OperationsService) ListPlans(eid string) ([]model.SubscriptionPlan, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var plans []model.SubscriptionPlan
	if err := s.db.Where("enterprise_id=? AND status='active'", id).Find(&plans).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询套餐失败")
	}
	return plans, nil
}

func (s *OperationsService) CreateSubscription(eid, planID string) (*model.EnterpriseSubscription, *apperrors.AppError) {
	_, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sub := &model.EnterpriseSubscription{EnterpriseID: eid, PlanID: planID, Status: "active", AutoRenew: true}
	if err := s.db.Create(sub).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建订阅失败") }
	return sub, nil
}

func (s *OperationsService) ListSubscriptions(eid string) ([]model.EnterpriseSubscription, *apperrors.AppError) {
	_, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var subs []model.EnterpriseSubscription
	if err := s.db.Where("enterprise_id=?", eid).Find(&subs).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询订阅失败")
	}
	return subs, nil
}

func (s *OperationsService) CreateSkill(eid, name, desc, params, endpoint, module string) (*model.Skill, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sk := &model.Skill{Name: name, Description: desc, APIEndpoint: endpoint, Category: module, IsActive: true}
	sk.EnterpriseID = id
	if err := s.db.Create(sk).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建Skill失败") }
	return sk, nil
}

func (s *OperationsService) ListSkills(eid string) ([]model.Skill, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var skills []model.Skill
	if err := s.db.Where("enterprise_id=? AND enabled=?", id, true).Find(&skills).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询Skill失败")
	}
	return skills, nil
}

func (s *OperationsService) CreateWebhook(eid, name, url, secret, events string) (*model.Webhook, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	w := &model.Webhook{Name: name, URL: url, Secret: secret, Events: events, Enabled: true}
	w.EnterpriseID = id
	if err := s.db.Create(w).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建Webhook失败") }
	return w, nil
}

func (s *OperationsService) ListWebhooks(eid string) ([]model.Webhook, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var whs []model.Webhook
	if err := s.db.Where("enterprise_id=?", id).Find(&whs).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询Webhook失败")
	}
	return whs, nil
}

func (s *OperationsService) Dashboard(eid string) (*apperrors.AppError) {
	return nil
}
