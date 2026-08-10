package repository

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type opportunityRepo struct {
	db *gorm.DB
}

func NewOpportunityRepository(db *gorm.DB) OpportunityRepository {
	return &opportunityRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *opportunityRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *opportunityRepo) Create(op *model.Opportunity) error { return r.fresh().Create(op).Error }
func (r *opportunityRepo) Update(op *model.Opportunity) error { return r.fresh().Save(op).Error }
func (r *opportunityRepo) Delete(id, enterpriseID uuid.UUID) error { return r.fresh().Model(&model.Opportunity{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error }

func (r *opportunityRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Opportunity, error) {
	var op model.Opportunity
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&op).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &op, nil
}

func (r *opportunityRepo) ListByCustomer(customerID uuid.UUID) ([]model.Opportunity, int64, error) {
	var ops []model.Opportunity
	var total int64
	q := r.fresh().Model(&model.Opportunity{}).Where("customer_id = ?", customerID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := q.Order("created_at DESC").Find(&ops).Error; err != nil {
		return nil, 0, err
	}
	return ops, total, nil
}
