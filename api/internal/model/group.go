package model

type Group struct {
	BaseModel
	Name         string `gorm:"type:varchar(255);not null" json:"name"`
	Code         string `gorm:"type:varchar(100);uniqueIndex;not null" json:"code"`
	ContactEmail string `gorm:"type:varchar(255)" json:"contact_email,omitempty"`
	ContactPhone string `gorm:"type:varchar(50)" json:"contact_phone,omitempty"`
	Address      string `gorm:"type:text" json:"address,omitempty"`
	Status       string `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
}

func (Group) TableName() string {
	return "groups"
}

type GroupQuery struct {
	Page     int
	PageSize int
}
