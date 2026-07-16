package model

import (
	"database/sql/driver"
	"encoding/json"
)

type JSONArray json.RawMessage

func (j *JSONArray) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	b, err := json.Marshal(value)
	if err != nil {
		return err
	}
	*j = JSONArray(b)
	return nil
}

func (j JSONArray) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return string(j), nil
}

func (j JSONArray) MarshalJSON() ([]byte, error) {
	if len(j) == 0 {
		return []byte("null"), nil
	}
	return []byte(j), nil
}

func (j *JSONArray) UnmarshalJSON(data []byte) error {
	*j = JSONArray(data)
	return nil
}

type SubscriptionPlan struct {
	TenantModel
	Name         string     `gorm:"type:varchar(100);not null" json:"name"`
	Description  string     `gorm:"type:text" json:"description,omitempty"`
	Price        float64    `gorm:"type:numeric(15,2);not null" json:"price"`
	MaxUsers     int        `gorm:"default:10" json:"max_users"`
	MaxStorage   int64      `gorm:"default:1073741824" json:"max_storage"`
	Features     JSONArray  `gorm:"type:jsonb" json:"features,omitempty"`
	Status       string     `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	PlanType     string     `gorm:"type:varchar(20);default:'monthly'" json:"plan_type"`
	Quotas       JSONArray  `gorm:"type:jsonb" json:"quotas,omitempty"`
	PriceMonthly float64    `gorm:"type:numeric(15,2);default:0" json:"price_monthly"`
	PriceYearly  float64    `gorm:"type:numeric(15,2);default:0" json:"price_yearly"`
	TrialDays    int        `gorm:"default:0" json:"trial_days"`
}

func (SubscriptionPlan) TableName() string { return "subscription_plans" }

type EnterpriseSubscription struct {
	BaseModel
	EnterpriseID       string  `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	PlanID             string  `gorm:"type:uuid;not null" json:"plan_id"`
	Status             string  `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	StartAt            *string `gorm:"type:timestamp" json:"start_at,omitempty"`
	EndAt              *string `gorm:"type:timestamp" json:"end_at,omitempty"`
	AutoRenew          bool    `gorm:"default:true" json:"auto_renew"`
	CurrentPeriodStart *string `gorm:"type:varchar(30)" json:"current_period_start,omitempty"`
	CurrentPeriodEnd   *string `gorm:"type:varchar(30)" json:"current_period_end,omitempty"`
	GracePeriodEnd     *string `gorm:"type:varchar(30)" json:"grace_period_end,omitempty"`
	BillingCycle       string  `gorm:"type:varchar(20);default:'monthly'" json:"billing_cycle"`
}

func (EnterpriseSubscription) TableName() string { return "enterprise_subscriptions" }

type Webhook struct {
	TenantModel
	Name    string `gorm:"type:varchar(100);not null" json:"name"`
	URL     string `gorm:"type:text;not null" json:"url"`
	Secret  string `gorm:"type:varchar(255)" json:"secret,omitempty"`
	Events  string `gorm:"type:text" json:"events"`
	Enabled bool   `gorm:"default:true" json:"enabled"`
}

func (Webhook) TableName() string { return "webhooks" }

type AuditLogEntry struct {
	TenantModel
	UserID    string `gorm:"type:uuid;index" json:"user_id"`
	Action    string `gorm:"type:varchar(100);not null" json:"action"`
	Resource  string `gorm:"type:varchar(100)" json:"resource"`
	Detail    string `gorm:"type:text" json:"detail,omitempty"`
	IPAddress string `gorm:"type:varchar(45)" json:"ip_address"`
}

func (AuditLogEntry) TableName() string { return "audit_log_entries" }

// Skill is defined in skill.go with full fields

type ServiceTicket struct {
	TenantModel
	CustomerID  *string `gorm:"type:uuid;index" json:"customer_id,omitempty"`
	Subject     string  `gorm:"type:varchar(255);not null" json:"subject"`
	Description string  `gorm:"type:text" json:"description"`
	Priority    string  `gorm:"type:varchar(20);default:'normal'" json:"priority"`
	Status      string  `gorm:"type:varchar(20);default:'open'" json:"status"`
	AssignedTo  *string `gorm:"type:uuid" json:"assigned_to,omitempty"`
}

func (ServiceTicket) TableName() string { return "service_tickets" }

// Announcement is defined in knowledge.go with full fields

type UsageBill struct {
	TenantModel
	Amount      float64 `gorm:"type:numeric(15,2);not null" json:"amount"`
	Description string  `gorm:"type:text" json:"description"`
	Status      string  `gorm:"type:varchar(20);default:'pending'" json:"status"`
}

func (UsageBill) TableName() string { return "usage_bills" }

type ServiceConfig struct {
	TenantModel
	ConfigKey   string `gorm:"type:varchar(100);not null" json:"config_key"`
	ConfigValue string `gorm:"type:text" json:"config_value"`
}

func (ServiceConfig) TableName() string { return "service_configs" }


