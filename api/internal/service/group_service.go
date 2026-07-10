package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type GroupService struct {
	groupRepo repository.GroupRepository
	userRepo  repository.UserRepository
	jwtMgr    *auth.JWTManager
}

func NewGroupService(groupRepo repository.GroupRepository, userRepo repository.UserRepository, jwtMgr *auth.JWTManager) *GroupService {
	return &GroupService{
		groupRepo: groupRepo,
		userRepo:  userRepo,
		jwtMgr:    jwtMgr,
	}
}

type CreateGroupRequest struct {
	Name         string `json:"name"`
	Code         string `json:"code"`
	ContactEmail string `json:"contact_email"`
	ContactPhone string `json:"contact_phone"`
	Address      string `json:"address"`
	OwnerEmail   string `json:"owner_email"`
	OwnerName    string `json:"owner_name"`
	OwnerPassword string `json:"owner_password"`
}

func (s *GroupService) Create(req CreateGroupRequest) (*model.Group, *apperrors.AppError) {
	if req.Name == "" {
		return nil, apperrors.NewValidationError("name", "集团名称不能为空")
	}
	if req.Code == "" {
		return nil, apperrors.NewValidationError("code", "集团编码不能为空")
	}

	existing, _ := s.groupRepo.FindByCode(req.Code)
	if existing != nil {
		return nil, apperrors.ErrDuplicateEntry.WithDetail("集团编码已存在")
	}

	group := &model.Group{
		Name:         req.Name,
		Code:         req.Code,
		ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone,
		Address:      req.Address,
		Status:       "active",
	}

	if err := s.groupRepo.Create(group); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建集团失败: " + err.Error())
	}

	return group, nil
}

func (s *GroupService) Update(groupID string, name, contactEmail, contactPhone, address string) (*model.Group, *apperrors.AppError) {
	gid, err := uuid.Parse(groupID)
	if err != nil {
		return nil, apperrors.NewValidationError("group_id", "集团ID无效")
	}

	group, err := s.groupRepo.FindByID(gid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询集团失败")
	}
	if group == nil {
		return nil, apperrors.ErrNotFound.WithDetail("集团不存在")
	}

	if name != "" {
		group.Name = name
	}
	if contactEmail != "" {
		group.ContactEmail = contactEmail
	}
	if contactPhone != "" {
		group.ContactPhone = contactPhone
	}
	if address != "" {
		group.Address = address
	}

	if err := s.groupRepo.Update(group); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新集团失败: " + err.Error())
	}

	return group, nil
}

func (s *GroupService) Delete(groupID string) *apperrors.AppError {
	gid, err := uuid.Parse(groupID)
	if err != nil {
		return apperrors.NewValidationError("group_id", "集团ID无效")
	}

	group, err := s.groupRepo.FindByID(gid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询集团失败")
	}
	if group == nil {
		return apperrors.ErrNotFound.WithDetail("集团不存在")
	}

	if err := s.groupRepo.Delete(gid); err != nil {
		return apperrors.ErrInternal.WithDetail("删除集团失败: " + err.Error())
	}

	return nil
}

func (s *GroupService) Get(groupID string) (*model.Group, *apperrors.AppError) {
	gid, err := uuid.Parse(groupID)
	if err != nil {
		return nil, apperrors.NewValidationError("group_id", "集团ID无效")
	}

	group, err := s.groupRepo.FindByID(gid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询集团失败")
	}
	if group == nil {
		return nil, apperrors.ErrNotFound.WithDetail("集团不存在")
	}
	return group, nil
}

func (s *GroupService) List(page, pageSize int) ([]model.Group, int64, *apperrors.AppError) {
	groups, total, err := s.groupRepo.List(page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询集团列表失败: " + err.Error())
	}
	return groups, total, nil
}
