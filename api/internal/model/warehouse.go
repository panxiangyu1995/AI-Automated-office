package model

type Warehouse struct {
	TenantModel
	Name    string `gorm:"type:varchar(255);not null" json:"name"`
	Code    string `gorm:"type:varchar(100);not null" json:"code"`
	Address string `gorm:"type:text" json:"address,omitempty"`
	Status  string `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
}

func (Warehouse) TableName() string { return "warehouses" }
