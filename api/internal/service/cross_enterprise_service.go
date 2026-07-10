package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type CrossEnterpriseService struct {
	crossRepo repository.CrossEnterpriseRepository
}

func NewCrossEnterpriseService(crossRepo repository.CrossEnterpriseRepository) *CrossEnterpriseService {
	return &CrossEnterpriseService{crossRepo: crossRepo}
}

func (s *CrossEnterpriseService) Grant(userID, sourceEnterpriseID, targetEnterpriseID, grantedBy, permissions string) (*model.CrossEnterprisePermission, *apperrors.AppError) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, apperrors.NewValidationError("user_id", "用户ID无效")
	}
	srcEID, err := uuid.Parse(sourceEnterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("source_enterprise_id", "源企业ID无效")
	}
	tgtEID, err := uuid.Parse(targetEnterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("target_enterprise_id", "目标企业ID无效")
	}
	gb, err := uuid.Parse(grantedBy)
	if err != nil {
		return nil, apperrors.NewValidationError("granted_by", "授权人ID无效")
	}

	existing, _ := s.crossRepo.FindByUserAndTarget(uid, tgtEID)
	if existing != nil {
		existing.Permissions = permissions
		existing.GrantedBy = gb
		if err := s.crossRepo.Update(existing); err != nil {
			return nil, apperrors.ErrInternal.WithDetail("更新跨企业权限失败: " + err.Error())
		}
		return existing, nil
	}

	perm := &model.CrossEnterprisePermission{
		UserID:            uid,
		SourceEnterpriseID: srcEID,
		TargetEnterpriseID: tgtEID,
		GrantedBy:         gb,
		Permissions:       permissions,
	}

	if err := s.crossRepo.Create(perm); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建跨企业权限失败: " + err.Error())
	}
	return perm, nil
}

func (s *CrossEnterpriseService) Revoke(permissionID string) *apperrors.AppError {
	pid, err := uuid.Parse(permissionID)
	if err != nil {
		return apperrors.NewValidationError("permission_id", "权限ID无效")
	}

	perm, err := s.crossRepo.FindByID(pid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询权限失败")
	}
	if perm == nil {
		return apperrors.ErrNotFound.WithDetail("权限不存在")
	}

	if err := s.crossRepo.Delete(pid); err != nil {
		return apperrors.ErrInternal.WithDetail("撤销权限失败: " + err.Error())
	}
	return nil
}

func (s *CrossEnterpriseService) ListByUser(userID string) ([]model.CrossEnterprisePermission, *apperrors.AppError) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, apperrors.NewValidationError("user_id", "用户ID无效")
	}

	perms, err := s.crossRepo.ListByUser(uid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询跨企业权限失败: " + err.Error())
	}
	return perms, nil
}

func (s *CrossEnterpriseService) CanAccess(userID, targetEnterpriseID string) (bool, *apperrors.AppError) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return false, apperrors.NewValidationError("user_id", "用户ID无效")
	}
	tgtEID, err := uuid.Parse(targetEnterpriseID)
	if err != nil {
		return false, apperrors.NewValidationError("target_enterprise_id", "目标企业ID无效")
	}

	perm, err := s.crossRepo.FindByUserAndTarget(uid, tgtEID)
	if err != nil {
		return false, apperrors.ErrInternal.WithDetail("查询跨企业权限失败")
	}
	return perm != nil, nil
}
