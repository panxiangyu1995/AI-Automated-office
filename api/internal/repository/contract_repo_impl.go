package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type contractRepo struct {
	db *gorm.DB
}

func NewContractRepository(db *gorm.DB) ContractRepository {
	return &contractRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *contractRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *contractRepo) Create(c *model.Contract) error {
	return r.fresh().Create(c).Error
}

func (r *contractRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Contract, error) {
	var c model.Contract
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&c).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *contractRepo) List(enterpriseID uuid.UUID, status string, page, pageSize int) ([]model.Contract, int64, error) {
	var cs []model.Contract
	var total int64
	q := r.fresh().Model(&model.Contract{}).Where("enterprise_id=?", enterpriseID)
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
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&cs).Error; err != nil {
		return nil, 0, err
	}
	return cs, total, nil
}

func (r *contractRepo) Update(c *model.Contract) error {
	return r.fresh().Save(c).Error
}

func (r *contractRepo) Delete(c *model.Contract, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", c.ID, enterpriseID).Delete(c).Error
}

func (r *contractRepo) PatchFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) (*model.Contract, error) {
	if err := r.fresh().Model(&model.Contract{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Updates(fields).Error; err != nil {
		return nil, err
	}
	var c model.Contract
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *contractRepo) CreateAttachment(att *model.ContractAttachment) error {
	return r.fresh().Create(att).Error
}

func (r *contractRepo) CreateReference(cr *model.ContractReference) error {
	return r.fresh().Create(cr).Error
}

func (r *contractRepo) ListReferences(contractID uuid.UUID) ([]model.ContractReference, error) {
	var refs []model.ContractReference
	if err := r.fresh().Where("contract_id=?", contractID).Find(&refs).Error; err != nil {
		return nil, err
	}
	return refs, nil
}

func (r *contractRepo) FindByIDNoEnterprise(id string) (*model.Contract, error) {
	var c model.Contract
	if err := r.fresh().Where("id=?", id).First(&c).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *contractRepo) ListByCustomer(customerID, enterpriseID uuid.UUID) ([]model.Contract, error) {
	var contracts []model.Contract
	if err := r.fresh().Where("customer_id = ? AND enterprise_id = ?", customerID, enterpriseID).Find(&contracts).Error; err != nil {
		return nil, err
	}
	return contracts, nil
}

func (r *contractRepo) UpdateFields(id, enterpriseID string, fields map[string]interface{}) error {
	return r.fresh().Model(&model.Contract{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Updates(fields).Error
}

func (r *contractRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	result := r.fresh().Model(&model.Contract{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now())
	return result.RowsAffected, result.Error
}

func (r *contractRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	return r.fresh().Model(&model.Contract{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("status", status).Error
}

func (r *contractRepo) RestoreFields(id, enterpriseID string, fields map[string]interface{}) error {
	return r.UpdateFields(id, enterpriseID, fields)
}
