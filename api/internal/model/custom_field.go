package model

import "github.com/google/uuid"

type FieldDefinition struct {
	TenantModel
	EntityType string `gorm:"type:varchar(50);not null;index" json:"entity_type"`
	FieldName  string `gorm:"type:varchar(100);not null" json:"field_name"`
	FieldType  string `gorm:"type:varchar(50);not null" json:"field_type"`
	Label      string `gorm:"type:varchar(200)" json:"label"`
	Required   bool   `gorm:"default:false" json:"required"`
	Options    string `gorm:"type:text" json:"options,omitempty"`
	SortOrder  int    `gorm:"default:0" json:"sort_order"`
}

func (FieldDefinition) TableName() string { return "field_definitions" }

type RelationDefinition struct {
	TenantModel
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	SourceType   string    `gorm:"type:varchar(50);not null" json:"source_type"`
	TargetType   string    `gorm:"type:varchar(50);not null" json:"target_type"`
	SourceID     uuid.UUID `gorm:"type:uuid;not null" json:"source_id"`
	TargetID     uuid.UUID `gorm:"type:uuid;not null" json:"target_id"`
	RelationType string    `gorm:"type:varchar(50);not null" json:"relation_type"`
}

func (RelationDefinition) TableName() string { return "relation_definitions" }
