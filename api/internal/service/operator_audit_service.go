package service

import (
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type OperatorAuditService struct {
	auditLogRepo repository.AuditLogRepository
}

func NewOperatorAuditService(auditLogRepo repository.AuditLogRepository) *OperatorAuditService {
	return &OperatorAuditService{auditLogRepo: auditLogRepo}
}

func (s *OperatorAuditService) ListOperatorActions(page, pageSize int, action, userID, startTime, endTime string) ([]map[string]interface{}, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	logs, total, err := s.auditLogRepo.QueryOperatorActions(page, pageSize, action, userID, startTime, endTime)
	if err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}
