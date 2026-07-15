package model

type ClaudeMDTemplate struct {
	BaseModel
	OperatorID string `gorm:"type:uuid;not null;index" json:"operator_id"`
	Name       string `gorm:"type:varchar(100);not null" json:"name"`
	Content    string `gorm:"type:text;not null" json:"content"`
	IsDefault  bool   `gorm:"default:false" json:"is_default"`
}

func (ClaudeMDTemplate) TableName() string { return "claude_md_templates" }
