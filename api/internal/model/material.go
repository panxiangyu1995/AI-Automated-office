package model

type Material struct {
	TenantModel
	Name         string  `gorm:"type:varchar(255);not null" json:"name"`
	SKUCode      string  `gorm:"type:varchar(100);index;not null" json:"sku_code"`
	MaterialType string  `gorm:"type:varchar(50);not null" json:"material_type"`
	Spec         string  `gorm:"type:text" json:"spec,omitempty"`
	Unit         string  `gorm:"type:varchar(20);not null" json:"unit"`
	UnitPrice    float64 `gorm:"type:numeric(15,2);default:0" json:"unit_price"`
	Status       string  `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
}

func (Material) TableName() string {
	return "materials"
}
