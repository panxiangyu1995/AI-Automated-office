package repository

import (
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

func (r *customerRepo) Create(customer *model.Customer) error {
	return r.db.Create(customer).Error
}

func (r *customerRepo) Update(customer *model.Customer) error {
	return r.db.Save(customer).Error
}

func (r *customerRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Customer{}, "id = ?", id).Error
}

func (r *customerRepo) FindByID(id uuid.UUID) (*model.Customer, error) {
	var c model.Customer
	err := r.db.Where("id = ?", id).First(&c).Error
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
	err := r.db.Where("enterprise_id = ? AND name = ?", enterpriseID, name).First(&c).Error
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

	q := r.db.Model(&model.Customer{}).Where("enterprise_id = ?", enterpriseID)
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
