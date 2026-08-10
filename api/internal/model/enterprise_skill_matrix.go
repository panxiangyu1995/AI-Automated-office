package model

type EnterpriseSkillMatrix struct {
	BaseModel
	EnterpriseID         string `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	SkillName            string `gorm:"type:varchar(100);not null" json:"skill_name"`
	IsEnabled            bool   `gorm:"default:true" json:"is_enabled"`
	CustomOpeningMessage string `gorm:"type:text" json:"custom_opening_message,omitempty"`
	CustomParams         string `gorm:"type:text" json:"custom_params,omitempty"`
}

func (EnterpriseSkillMatrix) TableName() string { return "enterprise_skill_matrix" }
