package model

type CustomerLevel struct {
	TenantModel
	Name        string  `gorm:"type:varchar(50);not null" json:"name"`
	Description string  `gorm:"type:varchar(255)" json:"description,omitempty"`
	MinAmount   float64 `gorm:"default:0" json:"min_amount"`
	Color       string  `gorm:"type:varchar(20)" json:"color,omitempty"`
	SortOrder   int     `gorm:"default:0" json:"sort_order"`
}

func (CustomerLevel) TableName() string {
	return "customer_levels"
}
