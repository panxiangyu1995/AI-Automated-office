package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type OperationsRepository interface {
	CreatePlan(plan *model.SubscriptionPlan) error
	ListActivePlans(enterpriseID uuid.UUID) ([]model.SubscriptionPlan, error)
	CreateSubscription(sub *model.EnterpriseSubscription) error
	ListSubscriptions(enterpriseID string) ([]model.EnterpriseSubscription, error)
	CreateSkill(skill *model.Skill) error
	ListActiveSkills(enterpriseID uuid.UUID) ([]model.Skill, error)
	CreateWebhook(w *model.Webhook) error
	ListWebhooks(enterpriseID uuid.UUID) ([]model.Webhook, error)
}
