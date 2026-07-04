package model

type Customer struct {
	TenantModel
	Name                   string `gorm:"type:varchar(255);not null" json:"name"`
	Industry               string `gorm:"type:varchar(100)" json:"industry,omitempty"`
	UnifiedSocialCreditCode string `gorm:"type:varchar(50)" json:"unified_social_credit_code,omitempty"`
	Address                string `gorm:"type:text" json:"address,omitempty"`
	Notes                  string `gorm:"type:text" json:"notes,omitempty"`
	Level                  string `gorm:"type:varchar(30);not null;default:'普通'" json:"level"`
	Status                 string `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
}

func (Customer) TableName() string {
	return "customers"
}
