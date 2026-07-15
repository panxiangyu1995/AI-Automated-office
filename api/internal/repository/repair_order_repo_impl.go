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

func (r *repairOrderRepo) BeginTx() interface{} {
	return r.db.Begin()
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
	if err := r.db.Where("id=? AND enterprise_id=?", id, enterpriseID).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

func (r *repairOrderRepo) Update(id, enterpriseID uuid.UUID, input map[string]interface{}) (*model.RepairOrder, error) {
	var order model.RepairOrder
	if err := r.db.Where("id=? AND enterprise_id=?", id, enterpriseID).First(&order).Error; err != nil {
		return nil, err
	}
	if err := r.db.Model(&order).Updates(input).Error; err != nil {
		return nil, err
	}
	r.db.Where("id=? AND enterprise_id=?", id, enterpriseID).First(&order)
	return &order, nil
}

func (r *repairOrderRepo) FindByServiceOrderID(serviceOrderID string) (*model.RepairOrder, error) {
	var order model.RepairOrder
	if err := r.db.Where("service_order_id=?", serviceOrderID).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}
