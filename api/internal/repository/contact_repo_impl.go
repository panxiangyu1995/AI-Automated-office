package repository

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type contactRepo struct {
	db *gorm.DB
}

func NewContactRepository(db *gorm.DB) ContactRepository {
	return &contactRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *contactRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *contactRepo) Create(contact *model.Contact) error {
	return r.fresh().Create(contact).Error
}
func (r *contactRepo) Update(contact *model.Contact) error { return r.fresh().Save(contact).Error }
func (r *contactRepo) Delete(id, enterpriseID uuid.UUID) error { return r.fresh().Model(&model.Contact{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error }

func (r *contactRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Contact, error) {
	var c model.Contact
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&c).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *contactRepo) ListByCustomer(customerID uuid.UUID) ([]model.Contact, error) {
	var contacts []model.Contact
	err := r.fresh().Where("customer_id = ?", customerID).Order("is_primary DESC, name ASC").Find(&contacts).Error
	return contacts, err
}

func (r *contactRepo) ListByCustomerAndRole(customerID uuid.UUID, role string) ([]model.Contact, error) {
	var contacts []model.Contact
	err := r.fresh().Where("customer_id = ? AND role = ?", customerID, role).Find(&contacts).Error
	return contacts, err
}

func (r *contactRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	result := r.fresh().Model(&model.Contact{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now())
	return result.RowsAffected, result.Error
}
