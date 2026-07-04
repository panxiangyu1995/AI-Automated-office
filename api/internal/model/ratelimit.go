package model

type RateLimitConfig struct {
	TenantModel
	EnterpriseQPS int `gorm:"not null;default:1000" json:"enterprise_qps"`
	IPQPS         int `gorm:"not null;default:100" json:"ip_qps"`
}

func (RateLimitConfig) TableName() string {
	return "rate_limit_configs"
}
