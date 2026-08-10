package model

import "time"

type PaymentPlan struct {
	TenantModel
	ContractID   string     `gorm:"type:uuid;not null;index" json:"contract_id"`
	PlanNo       string     `gorm:"type:varchar(100);not null" json:"plan_no"`
	DueDate      *time.Time `json:"due_date,omitempty"`
	Amount       float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	PaidAmount   float64    `gorm:"type:numeric(15,2);default:0" json:"paid_amount"`
	Status       string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	Notes        string     `gorm:"type:text" json:"notes,omitempty"`
	ReminderSent bool       `gorm:"default:false" json:"reminder_sent"`
}

func (PaymentPlan) TableName() string { return "payment_plans" }

const (
	PaymentPlanStatusPending  = "pending"
	PaymentPlanStatusPaid     = "paid"
	PaymentPlanStatusOverdue  = "overdue"
	PaymentPlanStatusReminded = "reminded"
)
