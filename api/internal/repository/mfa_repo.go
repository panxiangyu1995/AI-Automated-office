package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type MFARepository interface {
	FindByUserID(userID string) (*model.MFAConfig, error)
	FindByUserIDAndVerified(userID string, verified bool) (*model.MFAConfig, error)
	Create(config *model.MFAConfig) error
	Save(config *model.MFAConfig) error
	UpdateVerified(id uuid.UUID, verified bool) error
	UpdateBackupCodes(id uuid.UUID, backupCodes string) error
	DeleteByUserID(userID string) (int64, error)
}
