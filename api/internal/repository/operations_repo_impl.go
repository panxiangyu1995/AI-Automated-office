package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type operationsRepo struct {
	db *gorm.DB
}

func NewOperationsRepository(db *gorm.DB) OperationsRepository {
	return &operationsRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *operationsRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *operationsRepo) CreatePlan(plan *model.SubscriptionPlan) error {
	return r.fresh().Create(plan).Error
}

func (r *operationsRepo) ListActivePlans(enterpriseID uuid.UUID) ([]model.SubscriptionPlan, error) {
	var plans []model.SubscriptionPlan
	err := r.fresh().Where("enterprise_id=? AND status='active'", enterpriseID).Find(&plans).Error
	return plans, err
}

func (r *operationsRepo) CreateSubscription(sub *model.EnterpriseSubscription) error {
	return r.fresh().Create(sub).Error
}

func (r *operationsRepo) ListSubscriptions(enterpriseID string) ([]model.EnterpriseSubscription, error) {
	var subs []model.EnterpriseSubscription
	err := r.fresh().Where("enterprise_id=?", enterpriseID).Find(&subs).Error
	return subs, err
}

func (r *operationsRepo) CreateSkill(skill *model.Skill) error {
	return r.fresh().Create(skill).Error
}

func (r *operationsRepo) ListActiveSkills(enterpriseID uuid.UUID) ([]model.Skill, error) {
	var skills []model.Skill
	err := r.fresh().Where("enterprise_id=? AND is_active=?", enterpriseID, true).Find(&skills).Error
	return skills, err
}

func (r *operationsRepo) CreateWebhook(w *model.Webhook) error {
	return r.fresh().Create(w).Error
}

func (r *operationsRepo) ListWebhooks(enterpriseID uuid.UUID) ([]model.Webhook, error) {
	var whs []model.Webhook
	err := r.fresh().Where("enterprise_id=?", enterpriseID).Find(&whs).Error
	return whs, err
}
