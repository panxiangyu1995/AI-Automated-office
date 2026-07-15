package model

import "time"

type QualityInspection struct {
	TenantModel
	InspectionNo    string     `gorm:"type:varchar(100);not null" json:"inspection_no"`
	PurchaseOrderID string     `gorm:"type:uuid;not null;index" json:"purchase_order_id"`
	Status          string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	InspectorID     *string    `gorm:"type:uuid" json:"inspector_id,omitempty"`
	InspectedAt     *time.Time `json:"inspected_at,omitempty"`
	Notes           string     `gorm:"type:text" json:"notes,omitempty"`
}

func (QualityInspection) TableName() string { return "quality_inspections" }

type QualityInspectionItem struct {
	BaseModel
	InspectionID string `gorm:"type:uuid;not null;index" json:"inspection_id"`
	MaterialID   string `gorm:"type:uuid;not null" json:"material_id"`
	CheckItem    string `gorm:"type:varchar(200);not null" json:"check_item"`
	Standard     string `gorm:"type:varchar(200)" json:"standard,omitempty"`
	Result       string `gorm:"type:varchar(10);not null;default:'pending'" json:"result"`
	FailReason   string `gorm:"type:text" json:"fail_reason,omitempty"`
}

func (QualityInspectionItem) TableName() string { return "quality_inspection_items" }
