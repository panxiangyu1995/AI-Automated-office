package model

import "time"

type ServiceOrder struct {
	TenantModel
	OrderNo      string     `gorm:"type:varchar(100);not null" json:"order_no"`
	ContractID   string     `gorm:"type:uuid;index" json:"contract_id,omitempty"`
	CustomerID   string     `gorm:"type:uuid;not null;index" json:"customer_id"`
	OrderType    string     `gorm:"type:varchar(30);not null" json:"order_type"`
	Status       string     `gorm:"type:varchar(30);not null;default:'pending'" json:"status"`
	Description  string     `gorm:"type:text" json:"description,omitempty"`
	Amount       float64    `gorm:"type:numeric(15,2);default:0" json:"amount"`
	TechnicianID string     `gorm:"type:uuid" json:"technician_id,omitempty"`
	SignedAt     *time.Time `json:"signed_at,omitempty"`
	Notes        string     `gorm:"type:text" json:"notes,omitempty"`
}

func (ServiceOrder) TableName() string { return "service_orders" }

var ServiceStatusTransitions = map[string][]string{
	"pending": {"in_progress", "cancelled"},
	"in_progress": {"waiting_approval", "completed"},
	"waiting_approval": {"in_progress", "approved"},
	"approved": {"in_progress", "completed"},
	"completed": {"signed"},
	"signed": {}, "cancelled": {},
}
