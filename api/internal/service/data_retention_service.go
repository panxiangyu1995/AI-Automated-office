package service

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type DataRetentionConfig struct {
	AuditLogRetentionYears int `yaml:"audit_log_retention_years"`
	ContractRetentionYears int `yaml:"contract_retention_years"`
}

type DataRetentionService struct {
	db     *gorm.DB
	config DataRetentionConfig
}

func NewDataRetentionService(db *gorm.DB, config DataRetentionConfig) *DataRetentionService {
	if config.AuditLogRetentionYears == 0 {
		config.AuditLogRetentionYears = 7
	}
	if config.ContractRetentionYears == 0 {
		config.ContractRetentionYears = 10
	}
	return &DataRetentionService{db: db, config: config}
}

func (s *DataRetentionService) ArchiveOldAuditLogs(enterpriseID uuid.UUID) (int64, *apperrors.AppError) {
	cutoff := time.Now().AddDate(-s.config.AuditLogRetentionYears, 0, 0)
	result := s.db.Where("enterprise_id = ? AND created_at < ?", enterpriseID, cutoff).Delete(&model.AuditLog{})
	if result.Error != nil {
		return 0, apperrors.ErrInternal.WithDetail("归档审计日志失败")
	}
	return result.RowsAffected, nil
}
