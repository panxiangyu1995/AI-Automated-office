package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type serviceOrderRepo struct {
	db *gorm.DB
}

func NewServiceOrderRepository(db *gorm.DB) ServiceOrderRepository {
	return &serviceOrderRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *serviceOrderRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *serviceOrderRepo) Create(order *model.ServiceOrder) error {
	return r.fresh().Create(order).Error
}

func (r *serviceOrderRepo) FindByID(id, enterpriseID uuid.UUID) (*model.ServiceOrder, error) {
	var order model.ServiceOrder
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

func (r *serviceOrderRepo) Save(order *model.ServiceOrder) error {
	return r.fresh().Save(order).Error
}

func (r *serviceOrderRepo) Delete(order *model.ServiceOrder, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", order.ID, enterpriseID).Delete(order).Error
}

func (r *serviceOrderRepo) List(enterpriseID uuid.UUID, orderType, status string, page, pageSize int) ([]model.ServiceOrder, int64, error) {
	var items []model.ServiceOrder
	var total int64
	q := r.fresh().Model(&model.ServiceOrder{}).Where("enterprise_id=?", enterpriseID)
	if orderType != "" {
		q = q.Where("order_type=?", orderType)
	}
	if status != "" {
		q = q.Where("status=?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *serviceOrderRepo) CreateFileMetadata(meta *model.FileMetadata) error {
	return r.fresh().Create(meta).Error
}

func (r *serviceOrderRepo) ListFileMetadata(refType, refID string) ([]model.FileMetadata, error) {
	var files []model.FileMetadata
	err := r.fresh().Where("ref_type=? AND ref_id=?", refType, refID).
		Order("created_at DESC").Find(&files).Error
	return files, err
}

func (r *serviceOrderRepo) ListByCustomer(customerID, enterpriseID uuid.UUID) ([]model.ServiceOrder, error) {
	var orders []model.ServiceOrder
	if err := r.fresh().Where("customer_id = ? AND enterprise_id = ?", customerID, enterpriseID).Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *serviceOrderRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	return r.fresh().Model(&model.ServiceOrder{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("status", status).Error
}
