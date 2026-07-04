package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type AuditLogRepository interface {
	Create(log *model.AuditLog) error
	FindByID(id uuid.UUID) (*model.AuditLog, error)
	List(query model.AuditLogQuery) ([]model.AuditLog, int64, error)
}
