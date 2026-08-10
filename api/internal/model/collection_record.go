package model

import "time"

type CollectionRecord struct {
	TenantModel
	CollectionNo      string     `gorm:"type:varchar(100);not null" json:"collection_no"`
	InvoiceID         *string    `gorm:"type:uuid;index" json:"invoice_id,omitempty"`
	Amount            float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	CollectionMethod  string     `gorm:"type:varchar(50);not null;default:'bank_transfer'" json:"collection_method"`
	Status            string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	CollectedAt       *time.Time `json:"collected_at,omitempty"`
	Notes             string     `gorm:"type:text" json:"notes,omitempty"`
}

func (CollectionRecord) TableName() string { return "collection_records" }
