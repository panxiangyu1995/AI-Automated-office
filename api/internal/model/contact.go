package model

import "github.com/google/uuid"

type Contact struct {
	TenantModel
	CustomerID uuid.UUID `gorm:"type:uuid;not null;index" json:"customer_id"`
	Name       string    `gorm:"type:varchar(100);not null" json:"name"`
	Position   string    `gorm:"type:varchar(100)" json:"position,omitempty"`
	Phone      string    `gorm:"type:varchar(50)" json:"phone,omitempty"`
	Email      string    `gorm:"type:varchar(255)" json:"email,omitempty"`
	Role       string    `gorm:"type:varchar(50)" json:"role,omitempty"`
	IsPrimary  bool      `gorm:"default:false" json:"is_primary"`
}

func (Contact) TableName() string {
	return "contacts"
}
