package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type AuditLogService struct {
	auditLogRepo repository.AuditLogRepository
}

func NewAuditLogService(auditLogRepo repository.AuditLogRepository) *AuditLogService {
	return &AuditLogService{auditLogRepo: auditLogRepo}
}

func (s *AuditLogService) Get(id uuid.UUID) (*model.AuditLog, *apperrors.AppError) {
	log, err := s.auditLogRepo.FindByID(id)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询审计日志失败: " + err.Error())
	}
	if log == nil {
		return nil, apperrors.ErrNotFound.WithDetail("审计日志不存在")
	}
	return log, nil
}

func (s *AuditLogService) Create(enterpriseID, userID, action, resourceType, resourceID, details, ipAddress, userAgent string) *apperrors.AppError {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return apperrors.NewValidationError("user_id", "用户ID无效")
	}
	if action == "" {
		return apperrors.NewValidationError("action", "操作类型不能为空")
	}
	if resourceType == "" {
		return apperrors.NewValidationError("resource_type", "资源类型不能为空")
	}

	log := &model.AuditLog{
		UserID:       uid,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      details,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}
	log.EnterpriseID = eid

	if err := s.auditLogRepo.Create(log); err != nil {
		return apperrors.ErrInternal.WithDetail("记录审计日志失败: " + err.Error())
	}
	return nil
}

func (s *AuditLogService) Query(query model.AuditLogQuery) ([]model.AuditLog, int64, *apperrors.AppError) {
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PageSize < 1 || query.PageSize > 100 {
		query.PageSize = 20
	}

	logs, total, err := s.auditLogRepo.List(query)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询审计日志失败: " + err.Error())
	}
	return logs, total, nil
}
