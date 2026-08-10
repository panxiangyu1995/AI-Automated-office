package model

import (
	"time"

	"github.com/google/uuid"
)

type BillingRecord struct {
	BaseModel
	EnterpriseID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	SubscriptionID uuid.UUID  `gorm:"type:uuid;not null;index" json:"subscription_id"`
	Amount         float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	Type           string     `gorm:"type:varchar(20);not null;default:'charge'" json:"type"`
	Status         string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	PeriodStart    *time.Time `json:"period_start,omitempty"`
	PeriodEnd      *time.Time `json:"period_end,omitempty"`
	DueDate        *time.Time `json:"due_date,omitempty"`
	PaidAt         *time.Time `json:"paid_at,omitempty"`
}

func (BillingRecord) TableName() string { return "billing_records" }

type PaymentGatewayConfig struct {
	TenantModel
	Provider string `gorm:"type:varchar(30);not null" json:"provider"`
	Config   string `gorm:"type:jsonb" json:"config,omitempty"`
	IsActive bool   `gorm:"default:true" json:"is_active"`
}

func (PaymentGatewayConfig) TableName() string { return "payment_gateway_configs" }
