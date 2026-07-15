package service

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type UndoTargetRepo interface {
	RestoreFields(id string, fields map[string]interface{}) error
}

type UndoService struct {
	undoRepo    repository.UndoRepository
	userRepo    repository.UserRepository
	targetRepos map[string]UndoTargetRepo
}

func NewUndoService(undoRepo repository.UndoRepository, userRepo repository.UserRepository, targetRepos map[string]UndoTargetRepo) *UndoService {
	return &UndoService{undoRepo: undoRepo, userRepo: userRepo, targetRepos: targetRepos}
}

func (s *UndoService) RecordOperation(userID, resourceType, resourceID, action, beforeState string) (string, *apperrors.AppError) {
	_, err := uuid.Parse(userID)
	if err != nil {
		return "", apperrors.NewValidationError("user_id", "用户ID无效")
	}
	if s.undoRepo == nil {
		return "", apperrors.ErrInternal.WithDetail("数据库未初始化")
	}

	undoableUntil := time.Now().Add(24 * time.Hour)

	user, findErr := s.userRepo.FindByIDString(userID)
	if findErr != nil || user == nil {
		return "", apperrors.ErrNotFound.WithDetail("用户不存在")
	}

	op := &model.UndoOperation{
		UserID:        userID,
		ResourceType:  resourceType,
		ResourceID:    resourceID,
		Action:        action,
		BeforeState:   beforeState,
		UndoableUntil: &undoableUntil,
		Undone:        false,
	}
	eid, _ := uuid.Parse(user.EnterpriseID)
	op.EnterpriseID = eid

	if createErr := s.undoRepo.Create(op); createErr != nil {
		return "", apperrors.ErrInternal.WithDetail("记录操作失败")
	}

	return op.ID.String(), nil
}

func (s *UndoService) UndoOperation(operationID string) *apperrors.AppError {
	opID, err := uuid.Parse(operationID)
	if err != nil {
		return apperrors.NewValidationError("operation_id", "操作ID无效")
	}
	if s.undoRepo == nil {
		return apperrors.ErrInternal.WithDetail("数据库未初始化")
	}

	op, findErr := s.undoRepo.FindByID(opID)
	if findErr != nil {
		return apperrors.ErrInternal.WithDetail("查询操作记录失败")
	}
	if op == nil {
		return apperrors.ErrNotFound.WithDetail("操作记录不存在")
	}

	if op.Undone {
		return apperrors.ErrInvalidStatus.WithDetail("操作已撤销")
	}

	if op.UndoableUntil != nil && time.Now().After(*op.UndoableUntil) {
		return apperrors.ErrInvalidStatus.WithDetail("已超过24小时撤销期限")
	}

	var beforeState map[string]interface{}
	if jsonErr := json.Unmarshal([]byte(op.BeforeState), &beforeState); jsonErr != nil {
		return apperrors.ErrInternal.WithDetail("无法解析操作前状态")
	}

	targetRepo, exists := s.targetRepos[op.ResourceType]
	if !exists {
		return apperrors.ErrInvalidStatus.WithDetail("不支持撤销的资源类型: " + op.ResourceType)
	}

	if updateErr := targetRepo.RestoreFields(op.ResourceID, beforeState); updateErr != nil {
		return apperrors.ErrInternal.WithDetail("撤销操作失败")
	}

	s.undoRepo.MarkUndone(opID)
	return nil
}
