package service

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type DataRetentionConfig struct {
	AuditLogRetentionYears int `yaml:"audit_log_retention_years"`
	ContractRetentionYears int `yaml:"contract_retention_years"`
}

type DataRetentionService struct {
	auditLogRepo repository.AuditLogRepository
	config       DataRetentionConfig
}

func NewDataRetentionService(auditLogRepo repository.AuditLogRepository, config DataRetentionConfig) *DataRetentionService {
	if config.AuditLogRetentionYears == 0 {
		config.AuditLogRetentionYears = 7
	}
	if config.ContractRetentionYears == 0 {
		config.ContractRetentionYears = 10
	}
	return &DataRetentionService{auditLogRepo: auditLogRepo, config: config}
}

func (s *DataRetentionService) ArchiveOldAuditLogs(enterpriseID uuid.UUID) (int64, *apperrors.AppError) {
	cutoff := time.Now().AddDate(-s.config.AuditLogRetentionYears, 0, 0)
	affected, err := s.auditLogRepo.DeleteOldByEnterprise(enterpriseID, cutoff)
	if err != nil {
		return 0, apperrors.ErrInternal.WithDetail("归档审计日志失败")
	}
	return affected, nil
}
