package model

import "time"

type ApiQuota struct {
	TenantModel
	DailyLimit     int       `gorm:"not null;default:10000" json:"daily_limit"`
	MonthlyLimit   int       `gorm:"not null;default:300000" json:"monthly_limit"`
	DailyUsed      int       `gorm:"not null;default:0" json:"daily_used"`
	MonthlyUsed    int       `gorm:"not null;default:0" json:"monthly_used"`
	DailyResetAt   time.Time `gorm:"not null" json:"daily_reset_at"`
	MonthlyResetAt time.Time `gorm:"not null" json:"monthly_reset_at"`
}

func (ApiQuota) TableName() string {
	return "api_quotas"
}

type FeatureFlag struct {
	TenantModel
	FeatureKey string `gorm:"type:varchar(100);not null;index" json:"feature_key"`
	Enabled    bool   `gorm:"not null;default:true" json:"enabled"`
	Label      string `gorm:"type:varchar(200)" json:"label,omitempty"`
}

func (FeatureFlag) TableName() string {
	return "feature_flags"
}

type FeatureFlagList []FeatureFlag

var DefaultFeatureKeys = []string{
	"hrm", "crm", "ims", "contract", "sales", "service", "finance", "workflow", "kb",
}
