package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type BackupConfigRepository interface {
	Create(config *model.BackupConfig) error
	Update(config *model.BackupConfig) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.BackupConfig, error)
	ListByEnterprise(enterpriseID string) ([]model.BackupConfig, error)
	ListEnabled() ([]model.BackupConfig, error)
}

type BackupRecordRepository interface {
	Create(record *model.BackupRecord) error
	Update(record *model.BackupRecord) error
	FindByID(id uuid.UUID) (*model.BackupRecord, error)
	ListByEnterprise(enterpriseID string, offset, limit int) ([]model.BackupRecord, int64, error)
}
