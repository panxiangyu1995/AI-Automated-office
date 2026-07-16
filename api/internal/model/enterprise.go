package model

import (
	"time"

	"github.com/google/uuid"
)

var EnterpriseTransitions = map[string][]string{
	"trial":     {"active", "expired", "cancelled"},
	"active":    {"suspended", "frozen", "expired", "cancelled"},
	"suspended": {"active", "frozen", "cancelled"},
	"frozen":    {"active", "cancelled"},
	"expired":   {"active", "cancelled"},
	"cancelled": {},
}

var EnterpriseStatusLabels = map[string]string{
	"trial":     "试用中",
	"active":    "正常",
	"suspended": "已暂停",
	"frozen":    "已冻结",
	"expired":   "已过期",
	"cancelled": "已取消",
}

func ValidEnterpriseTransition(from, to string) bool {
	next, ok := EnterpriseTransitions[from]
	if !ok {
		return false
	}
	for _, s := range next {
		if s == to {
			return true
		}
	}
	return false
}

type Enterprise struct {
	BaseModel
	GroupID         string     `gorm:"type:uuid;index;not null" json:"group_id"`
	Name            string     `gorm:"type:varchar(255);not null" json:"name"`
	Code            string     `gorm:"type:varchar(100);uniqueIndex;not null" json:"code"`
	ContactEmail    string     `gorm:"type:varchar(255)" json:"contact_email,omitempty"`
	ContactPhone    string     `gorm:"type:varchar(50)" json:"contact_phone,omitempty"`
	Address         string     `gorm:"type:text" json:"address,omitempty"`
	Status          string     `gorm:"type:varchar(20);not null;default:'trial'" json:"status"`
	StatusReason    string     `gorm:"type:text" json:"status_reason,omitempty"`
	StatusChangedAt *time.Time `json:"status_changed_at,omitempty"`
	StatusChangedBy *string    `gorm:"type:uuid" json:"status_changed_by,omitempty"`
	SuspendedAt     *time.Time `json:"suspended_at,omitempty"`
	FrozenAt        *time.Time `json:"frozen_at,omitempty"`
	SubscribedAt    *time.Time `json:"subscribed_at,omitempty"`
	ExpiresAt       *time.Time `json:"expires_at,omitempty"`
	SchemaName      string     `gorm:"type:varchar(100)" json:"schema_name,omitempty"`
}

func (Enterprise) TableName() string {
	return "enterprises"
}

type EnterpriseStatusLog struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	EnterpriseID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	OperatorID     uuid.UUID  `gorm:"type:uuid;not null" json:"operator_id"`
	FromStatus     string     `gorm:"type:varchar(20)" json:"from_status,omitempty"`
	ToStatus       string     `gorm:"type:varchar(20);not null" json:"to_status"`
	Reason         string     `gorm:"type:text" json:"reason,omitempty"`
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`
}

func (EnterpriseStatusLog) TableName() string {
	return "enterprise_status_logs"
}
