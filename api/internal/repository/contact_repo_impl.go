package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
)

type contactRepo struct {
	db *gorm.DB
}

func NewContactRepository(db *gorm.DB) ContactRepository {
	return &contactRepo{db: db}
}

func (r *contactRepo) Create(contact *model.Contact) error {
	return r.db.Create(contact).Error
}
func (r *contactRepo) Update(contact *model.Contact) error { return r.db.Save(contact).Error }
func (r *contactRepo) Delete(id uuid.UUID) error          { return r.db.Delete(&model.Contact{}, "id = ?", id).Error }

func (r *contactRepo) FindByID(id uuid.UUID) (*model.Contact, error) {
	var c model.Contact
	err := r.db.Where("id = ?", id).First(&c).Error
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
	err := r.db.Where("customer_id = ?", customerID).Order("is_primary DESC, name ASC").Find(&contacts).Error
	return contacts, err
}

func (r *contactRepo) ListByCustomerAndRole(customerID uuid.UUID, role string) ([]model.Contact, error) {
	var contacts []model.Contact
	err := r.db.Where("customer_id = ? AND role = ?", customerID, role).Find(&contacts).Error
	return contacts, err
}
