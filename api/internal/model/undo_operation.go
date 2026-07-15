package model

import "time"

type UndoOperation struct {
	TenantModel
	UserID        string     `gorm:"type:uuid;not null;index" json:"user_id"`
	ResourceType  string     `gorm:"type:varchar(50);not null;index" json:"resource_type"`
	ResourceID    string     `gorm:"type:varchar(100);not null;index" json:"resource_id"`
	Action        string     `gorm:"type:varchar(50);not null" json:"action"`
	BeforeState   string     `gorm:"type:text" json:"before_state"`
	UndoableUntil *time.Time `gorm:"index" json:"undoable_until,omitempty"`
	Undone        bool       `gorm:"default:false;index" json:"undone"`
}

func (UndoOperation) TableName() string { return "undo_operations" }
