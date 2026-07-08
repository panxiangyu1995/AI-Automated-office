package model

import "github.com/google/uuid"

type Skill struct {
	BaseModel
	EnterpriseID uuid.UUID `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	Name         string    `gorm:"type:varchar(100);not null;uniqueIndex" json:"name"`
	Description  string    `gorm:"type:text" json:"description"`
	Category     string    `gorm:"type:varchar(50)" json:"category"`
	APIEndpoint  string    `gorm:"type:varchar(500)" json:"api_endpoint"`
	Method       string    `gorm:"type:varchar(10);default:'POST'" json:"method"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
}

func (Skill) TableName() string { return "skills" }

type SkillRoleOpening struct {
	BaseModel
	SkillID           uuid.UUID `gorm:"type:uuid;not null;index" json:"skill_id"`
	Role              string    `gorm:"type:varchar(50);not null" json:"role"`
	OpeningText       string    `gorm:"type:text" json:"opening_text"`
	AvailableActions  string    `gorm:"type:text" json:"available_actions"`
}

func (SkillRoleOpening) TableName() string { return "skill_role_openings" }

type SkillParameter struct {
	BaseModel
	SkillID    uuid.UUID `gorm:"type:uuid;not null;index" json:"skill_id"`
	Name       string    `gorm:"type:varchar(100);not null" json:"name"`
	Type       string    `gorm:"type:varchar(50)" json:"type"`
	Required   bool      `gorm:"default:false" json:"required"`
	DefaultVal string    `gorm:"type:text" json:"default_val,omitempty"`
	Description string   `gorm:"type:text" json:"description,omitempty"`
}

func (SkillParameter) TableName() string { return "skill_parameters" }
