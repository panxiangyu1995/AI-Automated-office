package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type repairOrderRepo struct {
	db *gorm.DB
}

func NewRepairOrderRepository(db *gorm.DB) RepairOrderRepository {
	return &repairOrderRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *repairOrderRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *repairOrderRepo) BeginTx() interface{} {
	return r.fresh().Begin()
}

func (r *repairOrderRepo) CommitTx(tx interface{}) {
	tx.(*gorm.DB).Commit()
}

func (r *repairOrderRepo) RollbackTx(tx interface{}) {
	tx.(*gorm.DB).Rollback()
}

func (r *repairOrderRepo) CreateWithTx(tx interface{}, order *model.RepairOrder) error {
	return tx.(*gorm.DB).Create(order).Error
}

func (r *repairOrderRepo) UpdateServiceOrderStatus(tx interface{}, serviceOrderID string, enterpriseID uuid.UUID, status string) error {
	return tx.(*gorm.DB).Model(&model.ServiceOrder{}).Where("id=? AND enterprise_id=?", serviceOrderID, enterpriseID).Update("status", status).Error
}

func (r *repairOrderRepo) FindByID(id, enterpriseID uuid.UUID) (*model.RepairOrder, error) {
	var order model.RepairOrder
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

func (r *repairOrderRepo) Update(id, enterpriseID uuid.UUID, input map[string]interface{}) (*model.RepairOrder, error) {
	var order model.RepairOrder
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&order).Error; err != nil {
		return nil, err
	}
	if err := r.fresh().Model(&order).Updates(input).Error; err != nil {
		return nil, err
	}
	r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&order)
	return &order, nil
}

func (r *repairOrderRepo) FindByServiceOrderID(serviceOrderID string) (*model.RepairOrder, error) {
	var order model.RepairOrder
	if err := r.fresh().Where("service_order_id=?", serviceOrderID).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}
