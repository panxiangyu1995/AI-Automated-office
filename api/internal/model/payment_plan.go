package model

import "time"

type PaymentPlan struct {
	TenantModel
	ContractID   string     `gorm:"type:uuid;not null;index" json:"contract_id"`
	PlanDate     time.Time  `gorm:"type:date;not null" json:"plan_date"`
	Amount       float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	Status       string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	CollectedAt  *time.Time `json:"collected_at,omitempty"`
	ReminderSent bool       `gorm:"default:false" json:"reminder_sent"`
}

func (PaymentPlan) TableName() string { return "payment_plans" }

const (
	PaymentPlanStatusPending  = "pending"
	PaymentPlanStatusPaid     = "paid"
	PaymentPlanStatusOverdue  = "overdue"
	PaymentPlanStatusReminded = "reminded"
)
