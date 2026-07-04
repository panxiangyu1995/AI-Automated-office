package model

import (
	"time"

	"github.com/google/uuid"
)

type Opportunity struct {
	TenantModel
	CustomerID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"customer_id"`
	Name            string     `gorm:"type:varchar(255);not null" json:"name"`
	Amount          float64    `gorm:"type:numeric(15,2);default:0" json:"amount"`
	Status          string     `gorm:"type:varchar(20);not null;default:'跟进中'" json:"status"`
	ExpectedCloseAt *time.Time `json:"expected_close_at,omitempty"`
	Description     string     `gorm:"type:text" json:"description,omitempty"`
}

func (Opportunity) TableName() string {
	return "opportunities"
}
