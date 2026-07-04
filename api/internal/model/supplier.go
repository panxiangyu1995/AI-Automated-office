package model

type Supplier struct {
	TenantModel
	Name         string `gorm:"type:varchar(255);not null" json:"name"`
	ContactName  string `gorm:"type:varchar(100)" json:"contact_name,omitempty"`
	ContactPhone string `gorm:"type:varchar(50)" json:"contact_phone,omitempty"`
	ContactEmail string `gorm:"type:varchar(255)" json:"contact_email,omitempty"`
	Address      string `gorm:"type:text" json:"address,omitempty"`
	Status       string `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
}

func (Supplier) TableName() string { return "suppliers" }
