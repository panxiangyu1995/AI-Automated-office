package repository

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type AuditLogRepository interface {
	Create(log *model.AuditLog) error
	FindByID(id, enterpriseID uuid.UUID) (*model.AuditLog, error)
	List(query model.AuditLogQuery) ([]model.AuditLog, int64, error)
	QueryOperatorActions(enterpriseID uuid.UUID, page, pageSize int, action, userID, startTime, endTime string) ([]map[string]interface{}, int64, error)
	DeleteOldByEnterprise(enterpriseID uuid.UUID, cutoff time.Time) (int64, error)
}
