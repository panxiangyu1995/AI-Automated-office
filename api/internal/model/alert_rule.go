package model

type AlertRule struct {
	TenantModel
	Dimension string  `gorm:"type:varchar(30);not null" json:"dimension"`
	Metric    string  `gorm:"type:varchar(50);not null" json:"metric"`
	Operator  string  `gorm:"type:varchar(10);not null" json:"operator"`
	Threshold float64 `gorm:"type:numeric(15,2);not null" json:"threshold"`
	Enabled   bool    `gorm:"default:true" json:"enabled"`
}

func (AlertRule) TableName() string { return "alert_rules" }
