package model

import (
	"time"

	"github.com/google/uuid"
)

type WfDefinition struct {
	TenantModel
	Name        string     `gorm:"type:varchar(255);not null" json:"name"`
	Description string     `gorm:"type:text" json:"description"`
	FlowConfig  string     `gorm:"type:jsonb;not null" json:"flow_config"`
	Version     int        `gorm:"default:1" json:"version"`
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	Category    string     `gorm:"type:varchar(50)" json:"category,omitempty"`
}

func (WfDefinition) TableName() string { return "wf_definitions" }

type WfInstance struct {
	TenantModel
	DefinitionID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"definition_id"`
	BusinessID    string     `gorm:"type:varchar(100);not null;index" json:"business_id"`
	BusinessType  string     `gorm:"type:varchar(50);not null" json:"business_type"`
	Status        string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	CurrentStep   int        `gorm:"default:0" json:"current_step"`
	InitiatorID   string     `gorm:"type:uuid;not null" json:"initiator_id"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	ReturnReason  string     `gorm:"type:text" json:"return_reason,omitempty"`
	ReturnedBy    string     `gorm:"type:uuid" json:"returned_by,omitempty"`
}

func (WfInstance) TableName() string { return "wf_instances" }

type WfApproval struct {
	BaseModel
	InstanceID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"instance_id"`
	StepIndex    int        `json:"step_index"`
	ApproverID   string     `gorm:"type:uuid;not null" json:"approver_id"`
	Action       string     `gorm:"type:varchar(20);not null" json:"action"`
	Comment      string     `gorm:"type:text" json:"comment,omitempty"`
	ApprovedAt   time.Time  `json:"approved_at"`
}

func (WfApproval) TableName() string { return "wf_approvals" }
