package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type OperationsService struct{ repo repository.OperationsRepository }
func NewOperationsService(repo repository.OperationsRepository) *OperationsService { return &OperationsService{repo} }

func (s *OperationsService) CreatePlan(eid, name, desc, features string, price float64, maxUsers int, maxStorage int64) (*model.SubscriptionPlan, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var featuresJSON model.JSONArray
	if features != "" {
		featuresJSON = model.JSONArray(features)
	}
	p := &model.SubscriptionPlan{Name: name, Description: desc, Price: price, MaxUsers: maxUsers, MaxStorage: maxStorage, Features: featuresJSON, Status: "active"}
	p.EnterpriseID = id
	if err := s.repo.CreatePlan(p); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建套餐失败") }
	return p, nil
}

func (s *OperationsService) ListPlans(eid string) ([]model.SubscriptionPlan, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	plans, dbErr := s.repo.ListActivePlans(id)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询套餐失败")
	}
	return plans, nil
}

func (s *OperationsService) CreateSubscription(eid, planID string) (*model.EnterpriseSubscription, *apperrors.AppError) {
	_, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sub := &model.EnterpriseSubscription{EnterpriseID: eid, PlanID: planID, Status: "active", AutoRenew: true}
	if err := s.repo.CreateSubscription(sub); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建订阅失败") }
	return sub, nil
}

func (s *OperationsService) ListSubscriptions(eid string) ([]model.EnterpriseSubscription, *apperrors.AppError) {
	_, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	subs, dbErr := s.repo.ListSubscriptions(eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询订阅失败")
	}
	return subs, nil
}

func (s *OperationsService) CreateSkill(eid, name, desc, params, endpoint, module string) (*model.Skill, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sk := &model.Skill{Name: name, Description: desc, APIEndpoint: endpoint, Category: module, IsActive: true}
	sk.EnterpriseID = id
	if err := s.repo.CreateSkill(sk); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建Skill失败") }
	return sk, nil
}

func (s *OperationsService) ListSkills(eid string) ([]model.Skill, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	skills, dbErr := s.repo.ListActiveSkills(id)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询Skill失败")
	}
	return skills, nil
}

func (s *OperationsService) CreateWebhook(eid, name, url, secret, events string) (*model.Webhook, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	w := &model.Webhook{Name: name, URL: url, Secret: secret, Events: events, Enabled: true}
	w.EnterpriseID = id
	if err := s.repo.CreateWebhook(w); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建Webhook失败") }
	return w, nil
}

func (s *OperationsService) ListWebhooks(eid string) ([]model.Webhook, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	whs, dbErr := s.repo.ListWebhooks(id)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询Webhook失败")
	}
	return whs, nil
}

func (s *OperationsService) Dashboard(eid string) (*apperrors.AppError) {
	return nil
}
