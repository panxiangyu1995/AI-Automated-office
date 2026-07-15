package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type collectionRepo struct {
	db *gorm.DB
}

func NewCollectionRepository(db *gorm.DB) CollectionRepository {
	return &collectionRepo{db: db}
}

func (r *collectionRepo) CreateWithTx(rec *model.CollectionRecord, contractID, salesOrderID *string, receivableID string, amount float64, enterpriseID uuid.UUID) (*model.CollectionRecord, error) {
	tx := r.db.Begin()

	if err := tx.Create(rec).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if contractID != nil && *contractID != "" {
		if err := tx.Model(&model.Contract{}).Where("id=? AND enterprise_id=?", *contractID, enterpriseID).
			Update("paid_amount", gorm.Expr("paid_amount + ?", amount)).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if salesOrderID != nil && *salesOrderID != "" {
		if err := tx.Model(&model.SalesOrder{}).Where("id=? AND enterprise_id=?", *salesOrderID, enterpriseID).
			Update("paid_amount", gorm.Expr("paid_amount + ?", amount)).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if receivableID != "" {
		if err := tx.Model(&model.Receivable{}).Where("id=? AND enterprise_id=?", receivableID, enterpriseID).
			Update("paid_amount", gorm.Expr("paid_amount + ?", amount)).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		var recv model.Receivable
		if err := tx.Where("id=? AND enterprise_id=?", receivableID, enterpriseID).First(&recv).Error; err == nil {
			newStatus := "partial"
			if recv.PaidAmount >= recv.Amount {
				newStatus = "completed"
			}
			tx.Model(&model.Receivable{}).Where("id=? AND enterprise_id=?", receivableID, enterpriseID).Update("status", newStatus)
		}
	}

	tx.Commit()
	return rec, nil
}

func (r *collectionRepo) FindByID(id, enterpriseID uuid.UUID) (*model.CollectionRecord, error) {
	var rec model.CollectionRecord
	if err := r.db.Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rec).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *collectionRepo) List(enterpriseID uuid.UUID, page, pageSize int) ([]model.CollectionRecord, int64, error) {
	var items []model.CollectionRecord
	var total int64
	q := r.db.Model(&model.CollectionRecord{}).Where("enterprise_id=?", enterpriseID)
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
