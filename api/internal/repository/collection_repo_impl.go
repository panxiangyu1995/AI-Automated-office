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

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *collectionRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *collectionRepo) CreateWithTx(rec *model.CollectionRecord, invoiceID *string, amount float64, enterpriseID uuid.UUID) (*model.CollectionRecord, error) {
	if err := r.fresh().Create(rec).Error; err != nil {
		return nil, err
	}
	return rec, nil
}

func (r *collectionRepo) FindByID(id, enterpriseID uuid.UUID) (*model.CollectionRecord, error) {
	var rec model.CollectionRecord
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rec).Error; err != nil {
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
	q := r.fresh().Model(&model.CollectionRecord{}).Where("enterprise_id=?", enterpriseID)
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
