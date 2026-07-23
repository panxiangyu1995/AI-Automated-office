package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type MFARepository interface {
	FindByUserID(userID string, enterpriseID uuid.UUID) (*model.MFAConfig, error)
	FindByUserIDAndVerified(userID string, enterpriseID uuid.UUID, verified bool) (*model.MFAConfig, error)
	Create(config *model.MFAConfig) error
	Save(config *model.MFAConfig) error
	UpdateVerified(id, enterpriseID uuid.UUID, verified bool) error
	UpdateBackupCodes(id, enterpriseID uuid.UUID, backupCodes string) error
	DeleteByUserID(userID string, enterpriseID uuid.UUID) (int64, error)
}
