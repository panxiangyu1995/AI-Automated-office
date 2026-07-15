package model

type MFAConfig struct {
	TenantModel
	UserID      string `gorm:"type:uuid;not null;index" json:"user_id"`
	Method      string `gorm:"type:varchar(20);not null;default:'totp'" json:"method"`
	Secret      string `gorm:"type:varchar(100);not null" json:"-"`
	Verified    bool   `gorm:"default:false" json:"verified"`
	BackupCodes string `gorm:"type:jsonb" json:"-"`
}

func (MFAConfig) TableName() string { return "mfa_configs" }
