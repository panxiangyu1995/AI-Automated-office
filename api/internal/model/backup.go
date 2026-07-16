package model

import "time"

type BackupConfig struct {
	TenantModel
	BackupTime      string `gorm:"type:varchar(5);not null" json:"backup_time"`
	BackupDirectory string `gorm:"type:varchar(500);not null;default:'/var/backups'" json:"backup_directory"`
	RetentionDays   int    `gorm:"not null;default:30" json:"retention_days"`
	Enabled         bool   `gorm:"not null;default:true" json:"enabled"`
}

func (BackupConfig) TableName() string {
	return "backup_configs"
}

type BackupRecord struct {
	TenantModel
	ConfigID     *string    `gorm:"type:uuid;index" json:"config_id,omitempty"`
	Status       string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	FilePath     string     `gorm:"type:varchar(500)" json:"file_path,omitempty"`
	FileSize     int64      `json:"file_size,omitempty"`
	Encrypted    bool       `gorm:"not null;default:false" json:"encrypted"`
	ErrorMessage string     `gorm:"type:text" json:"error_message,omitempty"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
}

func (BackupRecord) TableName() string {
	return "backup_records"
}
