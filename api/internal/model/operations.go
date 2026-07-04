package model

type SubscriptionPlan struct {
	TenantModel
	Name        string  `gorm:"type:varchar(100);not null" json:"name"`
	Description string  `gorm:"type:text" json:"description,omitempty"`
	Price       float64 `gorm:"type:numeric(15,2);not null" json:"price"`
	MaxUsers    int     `gorm:"default:10" json:"max_users"`
	MaxStorage  int64   `gorm:"default:1073741824" json:"max_storage"`
	Features    string  `gorm:"type:text" json:"features,omitempty"`
	Status      string  `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
}

func (SubscriptionPlan) TableName() string { return "subscription_plans" }

type EnterpriseSubscription struct {
	BaseModel
	EnterpriseID string `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	PlanID       string `gorm:"type:uuid;not null" json:"plan_id"`
	Status       string `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	StartAt      string `gorm:"type:timestamp" json:"start_at,omitempty"`
	EndAt        string `gorm:"type:timestamp" json:"end_at,omitempty"`
	AutoRenew    bool   `gorm:"default:true" json:"auto_renew"`
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

type Skill struct {
	TenantModel
	Name        string `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	Parameters  string `gorm:"type:text" json:"parameters"`
	APIEndpoint string `gorm:"type:varchar(500)" json:"api_endpoint"`
	Module      string `gorm:"type:varchar(100)" json:"module"`
	Enabled     bool   `gorm:"default:true" json:"enabled"`
}

func (Skill) TableName() string { return "skills" }

type ServiceTicket struct {
	TenantModel
	CustomerID  string `gorm:"type:uuid;index" json:"customer_id"`
	Subject     string `gorm:"type:varchar(255);not null" json:"subject"`
	Description string `gorm:"type:text" json:"description"`
	Priority    string `gorm:"type:varchar(20);default:'normal'" json:"priority"`
	Status      string `gorm:"type:varchar(20);default:'open'" json:"status"`
	AssignedTo  string `gorm:"type:uuid" json:"assigned_to,omitempty"`
}

func (ServiceTicket) TableName() string { return "service_tickets" }

type Announcement struct {
	TenantModel
	Title   string `gorm:"type:varchar(255);not null" json:"title"`
	Content string `gorm:"type:text" json:"content"`
}

func (Announcement) TableName() string { return "announcements" }

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


