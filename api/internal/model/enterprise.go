package model

type Enterprise struct {
	BaseModel
	GroupID      string `gorm:"type:uuid;index;not null" json:"group_id"`
	Name         string `gorm:"type:varchar(255);not null" json:"name"`
	Code         string `gorm:"type:varchar(100);uniqueIndex;not null" json:"code"`
	ContactEmail string `gorm:"type:varchar(255)" json:"contact_email,omitempty"`
	ContactPhone string `gorm:"type:varchar(50)" json:"contact_phone,omitempty"`
	Address      string `gorm:"type:text" json:"address,omitempty"`
	Status       string `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	SchemaName   string `gorm:"type:varchar(100)" json:"schema_name,omitempty"`
}

func (Enterprise) TableName() string {
	return "enterprises"
}
