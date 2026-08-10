package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type healthRepo struct {
	db *gorm.DB
}

func NewHealthRepository(db *gorm.DB) HealthRepository {
	return &healthRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *healthRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *healthRepo) CountActiveEmployees(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Employee{}).Where("enterprise_id=? AND status=?", enterpriseID, "active").Count(&count).Error
	return count, err
}

func (r *healthRepo) CountCustomers(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Customer{}).Where("enterprise_id=?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *healthRepo) CountContracts(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Contract{}).Where("enterprise_id=?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *healthRepo) CountSalesOrders(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.SalesOrder{}).Where("enterprise_id=?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *healthRepo) ListAllEnterprises() ([]model.Enterprise, error) {
	var enterprises []model.Enterprise
	err := r.fresh().Find(&enterprises).Error
	return enterprises, err
}
