package model

import "time"

var ContractTransitions = map[string][]string{
	"draft":     {"pending_approval"},
	"pending_approval": {"active", "draft"},
	"active":    {"fulfilled", "terminated"},
	"fulfilled": {},
	"terminated": {},
}

var ContractStatusLabels = map[string]string{
	"draft": "草稿", "pending_approval": "审批中", "active": "已生效",
	"fulfilled": "已履行", "terminated": "已终止",
}

type Contract struct {
	TenantModel
	ContractNo   string     `gorm:"type:varchar(100);not null" json:"contract_no"`
	CustomerID   string     `gorm:"type:uuid;not null;index" json:"customer_id"`
	Name         string     `gorm:"type:varchar(255);not null" json:"name"`
	Amount       float64    `gorm:"type:numeric(15,2);default:0" json:"amount"`
	PaidAmount   float64    `gorm:"type:numeric(15,2);default:0" json:"paid_amount"`
	Status       string     `gorm:"type:varchar(30);not null;default:'draft'" json:"status"`
	SignedAt     *time.Time `json:"signed_at,omitempty"`
	EffectiveAt  *time.Time `json:"effective_at,omitempty"`
	ExpireAt     *time.Time `json:"expire_at,omitempty"`
	Content      string     `gorm:"type:text" json:"content,omitempty"`
	Notes        string     `gorm:"type:text" json:"notes,omitempty"`
}

func (Contract) TableName() string { return "contracts" }

type ContractReference struct {
	TenantModel
	ContractID string `gorm:"type:uuid;not null;index" json:"contract_id"`
	RefType    string `gorm:"type:varchar(30);not null" json:"ref_type"`
	RefID      string `gorm:"type:uuid;not null" json:"ref_id"`
	RefNo      string `gorm:"type:varchar(100)" json:"ref_no,omitempty"`
}

func (ContractReference) TableName() string { return "contract_references" }

