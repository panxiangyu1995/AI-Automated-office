package repository

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type customerRepo struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) CustomerRepository {
	return &customerRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *customerRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *customerRepo) Create(customer *model.Customer) error {
	return r.fresh().Create(customer).Error
}

func (r *customerRepo) Update(customer *model.Customer) error {
	return r.fresh().Save(customer).Error
}

func (r *customerRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.Customer{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *customerRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Customer, error) {
	var c model.Customer
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&c).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *customerRepo) FindByName(enterpriseID uuid.UUID, name string) (*model.Customer, error) {
	var c model.Customer
	err := r.fresh().Where("enterprise_id = ? AND name = ?", enterpriseID, name).First(&c).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *customerRepo) List(enterpriseID uuid.UUID, page, pageSize int) ([]model.Customer, int64, error) {
	var customers []model.Customer
	var total int64

	q := r.fresh().Model(&model.Customer{}).Where("enterprise_id = ?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&customers).Error; err != nil {
		return nil, 0, err
	}
	return customers, total, nil
}

func (r *customerRepo) UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	return r.fresh().Model(&model.Customer{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Updates(fields).Error
}

func (r *customerRepo) UpdateFieldsByID(id, enterpriseID string, fields map[string]interface{}) error {
	return r.fresh().Model(&model.Customer{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Updates(fields).Error
}

func (r *customerRepo) RestoreFields(id, enterpriseID string, fields map[string]interface{}) error {
	return r.UpdateFieldsByID(id, enterpriseID, fields)
}

func (r *customerRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	result := r.fresh().Model(&model.Customer{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now())
	return result.RowsAffected, result.Error
}

func (r *customerRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	return r.fresh().Model(&model.Customer{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("status", status).Error
}
