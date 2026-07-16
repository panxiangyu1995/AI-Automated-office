package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
)

type EnterpriseService struct {
	enterpriseRepo repository.EnterpriseRepository
	statusLogRepo  repository.EnterpriseStatusLogRepository
	schemaManager  repository.SchemaManager
}

func NewEnterpriseService(enterpriseRepo repository.EnterpriseRepository, statusLogRepo repository.EnterpriseStatusLogRepository, schemaManager repository.SchemaManager) *EnterpriseService {
	return &EnterpriseService{
		enterpriseRepo: enterpriseRepo,
		statusLogRepo:  statusLogRepo,
		schemaManager:  schemaManager,
	}
}

func (s *EnterpriseService) Create(groupID, name, code, contactEmail, contactPhone, address string) (*model.Enterprise, *apperrors.AppError) {
	if name == "" {
		return nil, apperrors.NewValidationError("name", "企业名称不能为空")
	}
	if code == "" {
		return nil, apperrors.NewValidationError("code", "企业编码不能为空")
	}
	if groupID == "" {
		return nil, apperrors.NewValidationError("group_id", "所属集团不能为空")
	}

	existing, _ := s.enterpriseRepo.FindByCode(code)
	if existing != nil {
		return nil, apperrors.ErrDuplicateEntry.WithDetail("企业编码已存在")
	}

	enterprise := &model.Enterprise{
		GroupID:      groupID,
		Name:         name,
		Code:         code,
		ContactEmail: contactEmail,
		ContactPhone: contactPhone,
		Address:      address,
		Status:       "trial",
	}

	if err := s.enterpriseRepo.Create(enterprise); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建企业失败: " + err.Error())
	}

	schemaName, schemaErr := tenant.SchemaName(enterprise.ID.String())
	if schemaErr != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID格式无效")
	}
	enterprise.SchemaName = schemaName
	s.enterpriseRepo.Update(enterprise)

	if s.schemaManager != nil {
		if err := s.schemaManager.CreateSchema(enterprise.ID.String()); err != nil {
			return nil, apperrors.ErrInternal.WithDetail(err.Error())
		}
		if err := s.schemaManager.RunMigrations(enterprise.ID.String()); err != nil {
			return nil, apperrors.ErrInternal.WithDetail(err.Error())
		}
	}

	return enterprise, nil
}

func (s *EnterpriseService) Update(enterpriseID, name, contactEmail, contactPhone, address string) (*model.Enterprise, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	enterprise, err := s.enterpriseRepo.FindByID(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询企业失败")
	}
	if enterprise == nil {
		return nil, apperrors.ErrNotFound.WithDetail("企业不存在")
	}

	if name != "" {
		enterprise.Name = name
	}
	if contactEmail != "" {
		enterprise.ContactEmail = contactEmail
	}
	if contactPhone != "" {
		enterprise.ContactPhone = contactPhone
	}
	if address != "" {
		enterprise.Address = address
	}

	if err := s.enterpriseRepo.Update(enterprise); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新企业失败: " + err.Error())
	}
	return enterprise, nil
}

func (s *EnterpriseService) Get(enterpriseID string) (*model.Enterprise, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	enterprise, err := s.enterpriseRepo.FindByID(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询企业失败")
	}
	if enterprise == nil {
		return nil, apperrors.ErrNotFound.WithDetail("企业不存在")
	}
	return enterprise, nil
}

func (s *EnterpriseService) List(page, pageSize int) ([]model.Enterprise, int64, *apperrors.AppError) {
	enterprises, total, err := s.enterpriseRepo.List(page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询企业列表失败: " + err.Error())
	}
	return enterprises, total, nil
}

func (s *EnterpriseService) ChangeStatus(enterpriseID, newStatus, reason, operatorID string) (*model.Enterprise, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	opID, opErr := uuid.Parse(operatorID)
	if opErr != nil {
		return nil, apperrors.NewValidationError("operator_id", "操作者ID无效")
	}

	enterprise, dbErr := s.enterpriseRepo.FindByID(eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询企业失败")
	}
	if enterprise == nil {
		return nil, apperrors.ErrNotFound.WithDetail("企业不存在")
	}

	if !model.ValidEnterpriseTransition(enterprise.Status, newStatus) {
		return nil, &apperrors.AppError{
			Code:    "ENT_INVALID_STATUS_TRANSITION",
			Message: "非法状态流转",
			Status:  400,
			Detail:  fmt.Sprintf("不能从 %s 转换到 %s", model.EnterpriseStatusLabels[enterprise.Status], model.EnterpriseStatusLabels[newStatus]),
		}
	}

	fromStatus := enterprise.Status
	now := time.Now()
	enterprise.Status = newStatus
	enterprise.StatusReason = reason
	enterprise.StatusChangedAt = &now
	enterprise.StatusChangedBy = &operatorID

	switch newStatus {
	case "active":
		if enterprise.SubscribedAt == nil {
			enterprise.SubscribedAt = &now
		}
	case "suspended":
		enterprise.SuspendedAt = &now
	case "frozen":
		enterprise.FrozenAt = &now
	case "expired":
		if enterprise.ExpiresAt == nil {
			enterprise.ExpiresAt = &now
		}
	}

	if err := s.enterpriseRepo.Update(enterprise); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新企业状态失败: " + err.Error())
	}

	statusLog := &model.EnterpriseStatusLog{
		EnterpriseID: eid,
		OperatorID:   opID,
		FromStatus:   fromStatus,
		ToStatus:     newStatus,
		Reason:       reason,
	}
	if logErr := s.statusLogRepo.Create(statusLog); logErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("记录状态日志失败: " + logErr.Error())
	}

	return enterprise, nil
}

func (s *EnterpriseService) GetStatusLog(enterpriseID string) ([]model.EnterpriseStatusLog, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	logs, dbErr := s.statusLogRepo.ListByEnterprise(eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询状态日志失败")
	}
	return logs, nil
}
