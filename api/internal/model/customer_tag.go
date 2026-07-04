package model

import "github.com/google/uuid"

type CustomerTag struct {
	TenantModel
	CustomerID uuid.UUID `gorm:"type:uuid;not null;index" json:"customer_id"`
	Tag        string    `gorm:"type:varchar(50);not null" json:"tag"`
}

func (CustomerTag) TableName() string {
	return "customer_tags"
}
