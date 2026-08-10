package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ownerRepo struct {
	db *gorm.DB
}

func NewOwnerRepository(db *gorm.DB) OwnerRepository {
	return &ownerRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *ownerRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *ownerRepo) SumSalesOrderRevenue(enterpriseID uuid.UUID, statuses []string) (float64, error) {
	var amount float64
	err := r.fresh().Model(&model.SalesOrder{}).Where("enterprise_id=? AND status IN ?",
		enterpriseID, statuses).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&amount).Error
	return amount, err
}

func (r *ownerRepo) SumCollections(enterpriseID uuid.UUID) (float64, error) {
	var amount float64
	err := r.fresh().Model(&model.CollectionRecord{}).Where("enterprise_id=?", enterpriseID).
		Select("COALESCE(SUM(amount), 0)").Scan(&amount).Error
	return amount, err
}

func (r *ownerRepo) SumPayments(enterpriseID uuid.UUID) (float64, error) {
	var amount float64
	err := r.fresh().Model(&model.PaymentRecord{}).Where("enterprise_id=?", enterpriseID).
		Select("COALESCE(SUM(amount), 0)").Scan(&amount).Error
	return amount, err
}

func (r *ownerRepo) CountLowStock(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.WarehouseInventory{}).Where("enterprise_id=? AND quantity <= safety_stock AND safety_stock > 0", enterpriseID).
		Count(&count).Error
	return count, err
}

func (r *ownerRepo) CountTotalSKU(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.WarehouseInventory{}).Where("enterprise_id=?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *ownerRepo) CountEmployeesByStatus(enterpriseID uuid.UUID, status string) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Employee{}).Where("enterprise_id=? AND status=?", enterpriseID, status).Count(&count).Error
	return count, err
}

func (r *ownerRepo) CountCustomers(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Customer{}).Where("enterprise_id=?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *ownerRepo) CreateAlertRule(rule *model.AlertRule) error {
	return r.fresh().Create(rule).Error
}

func (r *ownerRepo) FindAlertRuleByID(id, enterpriseID uuid.UUID) (*model.AlertRule, error) {
	var rule model.AlertRule
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rule).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &rule, nil
}

func (r *ownerRepo) UpdateAlertRule(id, enterpriseID uuid.UUID, input map[string]interface{}) (*model.AlertRule, error) {
	var rule model.AlertRule
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rule).Error; err != nil {
		return nil, err
	}
	if err := r.fresh().Model(&rule).Updates(input).Error; err != nil {
		return nil, err
	}
	r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rule)
	return &rule, nil
}

func (r *ownerRepo) ListAlertRules(enterpriseID uuid.UUID) ([]model.AlertRule, error) {
	var rules []model.AlertRule
	err := r.fresh().Where("enterprise_id=?", enterpriseID).Find(&rules).Error
	return rules, err
}
