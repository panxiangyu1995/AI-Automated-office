package model

type IndustryTemplate struct {
	BaseModel
	Name            string `gorm:"type:varchar(100);not null" json:"name"`
	Industry        string `gorm:"type:varchar(50);not null;index" json:"industry"`
	Description     string `gorm:"type:text" json:"description,omitempty"`
	PresetSkills    string `gorm:"type:jsonb" json:"preset_skills,omitempty"`
	PresetFields    string `gorm:"type:jsonb" json:"preset_fields,omitempty"`
	PresetWorkflows string `gorm:"type:jsonb" json:"preset_workflows,omitempty"`
	PresetRoles     string `gorm:"type:jsonb" json:"preset_roles,omitempty"`
}

func (IndustryTemplate) TableName() string { return "industry_templates" }
