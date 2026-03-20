package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"go.uber.org/zap"
)

// 错误定义
var (
	ErrOverrideNotFound      = errors.New("permission override not found")
	ErrInvalidOverrideType   = errors.New("invalid override type")
	ErrInvalidDataScope      = errors.New("invalid data scope configuration")
	ErrInvalidFieldRestriction = errors.New("invalid field restriction configuration")
	ErrInvalidDateRange      = errors.New("invalid date range")
	ErrPermissionDenied      = errors.New("permission denied")
)

// PermissionOverrideCRUDService 权限覆盖 CRUD 服务
type PermissionOverrideCRUDService struct {
	overrideRepo   repository.PermissionOverrideRepository
	overrideService *PermissionOverrideService
	fieldService   *FieldPermissionService
	logger         *zap.Logger
}

// NewPermissionOverrideCRUDService 创建权限覆盖 CRUD 服务
func NewPermissionOverrideCRUDService(
	overrideRepo repository.PermissionOverrideRepository,
	overrideService *PermissionOverrideService,
	fieldService *FieldPermissionService,
	logger *zap.Logger,
) *PermissionOverrideCRUDService {
	return &PermissionOverrideCRUDService{
		overrideRepo:    overrideRepo,
		overrideService: overrideService,
		fieldService:    fieldService,
		logger:          logger,
	}
}

// GetUserOverridesRequest 获取用户权限覆盖请求
type GetUserOverridesRequest struct {
	UserID   string
	Resource string // 可选，指定资源
}

// OverrideItem 权限覆盖项（API 返回格式）
type OverrideItem struct {
	ID               string                       `json:"id"`
	Resource         string                       `json:"resource"`
	PermissionID     *string                      `json:"permission_id,omitempty"`
	OverrideType     model.OverrideType           `json:"override_type"`
	DataScope        *DataScopeResponse           `json:"data_scope"`
	FieldRestrictions model.FieldRestrictionsMap  `json:"field_restrictions,omitempty"`
	EffectiveFrom    string                       `json:"effective_from"`
	EffectiveUntil   *string                      `json:"effective_until,omitempty"`
	CreatedBy        *CreatedByInfo               `json:"created_by,omitempty"`
	CreatedAt        string                       `json:"created_at"`
}

// DataScopeResponse 数据范围响应
type DataScopeResponse struct {
	Type model.DataScopeType  `json:"type"`
	Rule *model.DataScopeRule `json:"rule,omitempty"`
}

// CreatedByInfo 创建者信息
type CreatedByInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// GetUserOverrides 获取用户权限覆盖
func (s *PermissionOverrideCRUDService) GetUserOverrides(ctx context.Context, req *GetUserOverridesRequest) ([]*OverrideItem, error) {
	var overrides []*model.PermissionOverride
	var err error

	if req.Resource != "" {
		overrides, err = s.overrideRepo.FindByUserIDAndResource(ctx, req.UserID, req.Resource)
	} else {
		overrides, err = s.overrideRepo.FindByUserID(ctx, req.UserID)
	}

	if err != nil {
		s.logger.Error("failed to get user overrides",
			zap.Error(err),
			zap.String("userID", req.UserID),
		)
		return nil, err
	}

	return s.toOverrideItems(overrides), nil
}

// UpdateUserOverridesRequest 更新用户权限覆盖请求
type UpdateUserOverridesRequest struct {
	Overrides []OverrideInput `json:"overrides"`
}

// OverrideInput 权限覆盖输入
type OverrideInput struct {
	Resource         string                       `json:"resource"`
	PermissionID     *string                      `json:"permission_id,omitempty"`
	OverrideType     model.OverrideType           `json:"override_type"`
	DataScope        *DataScopeInput              `json:"data_scope,omitempty"`
	FieldRestrictions model.FieldRestrictionsMap  `json:"field_restrictions,omitempty"`
	EffectiveUntil   *string                      `json:"effective_until,omitempty"`
}

// DataScopeInput 数据范围输入
type DataScopeInput struct {
	Type model.DataScopeType  `json:"type"`
	Rule *model.DataScopeRule `json:"rule,omitempty"`
}

// UpdateUserOverrides 批量更新用户权限覆盖
func (s *PermissionOverrideCRUDService) UpdateUserOverrides(ctx context.Context, tenantID, userID, operatorID string, req *UpdateUserOverridesRequest) error {
	// 验证输入
	for _, input := range req.Overrides {
		if err := s.validateOverrideInput(&input); err != nil {
			return err
		}
	}

	// 转换为模型
	overrides := make([]*model.PermissionOverride, len(req.Overrides))
	for i, input := range req.Overrides {
		override := &model.PermissionOverride{
			TenantID:         tenantID,
			UserID:           userID,
			Resource:         input.Resource,
			PermissionID:     input.PermissionID,
			OverrideType:     input.OverrideType,
			DataScopeType:    model.DataScopeAll,
			FieldRestrictions: input.FieldRestrictions,
			EffectiveFrom:    time.Now(),
			CreatedBy:        &operatorID,
		}

		if input.DataScope != nil {
			override.DataScopeType = input.DataScope.Type
			override.DataScopeRule = input.DataScope.Rule
		}

		if input.EffectiveUntil != nil {
			t, err := time.Parse(time.RFC3339, *input.EffectiveUntil)
			if err != nil {
				return fmt.Errorf("invalid effective_until format: %w", err)
			}
			override.EffectiveUntil = &t
		}

		overrides[i] = override
	}

	// 批量更新
	err := s.overrideRepo.BatchUpdate(ctx, tenantID, userID, overrides)
	if err != nil {
		s.logger.Error("failed to update user overrides",
			zap.Error(err),
			zap.String("userID", userID),
		)
		return err
	}

	// 清除缓存
	s.fieldService.InvalidateUserCache(userID)

	return nil
}

// CreateOverrideRequest 创建权限覆盖请求
type CreateOverrideRequest struct {
	TenantID         string                       `json:"-"`
	UserID           string                       `json:"user_id"`
	Resource         string                       `json:"resource"`
	PermissionID     *string                      `json:"permission_id,omitempty"`
	OverrideType     model.OverrideType           `json:"override_type"`
	DataScope        *DataScopeInput              `json:"data_scope,omitempty"`
	FieldRestrictions model.FieldRestrictionsMap  `json:"field_restrictions,omitempty"`
	EffectiveFrom    *string                      `json:"effective_from,omitempty"`
	EffectiveUntil   *string                      `json:"effective_until,omitempty"`
	CreatedBy        string                       `json:"-"`
}

// CreateOverride 创建单个权限覆盖
func (s *PermissionOverrideCRUDService) CreateOverride(ctx context.Context, req *CreateOverrideRequest) (*model.PermissionOverride, error) {
	// 验证输入
	if req.OverrideType != model.OverrideTypeGrant && req.OverrideType != model.OverrideTypeDeny {
		return nil, ErrInvalidOverrideType
	}

	// 检查是否已存在
	exists, err := s.overrideRepo.ExistsByUserResource(ctx, req.UserID, req.Resource, req.PermissionID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("override already exists for this user, resource and permission")
	}

	override := &model.PermissionOverride{
		TenantID:         req.TenantID,
		UserID:           req.UserID,
		Resource:         req.Resource,
		PermissionID:     req.PermissionID,
		OverrideType:     req.OverrideType,
		DataScopeType:    model.DataScopeAll,
		FieldRestrictions: req.FieldRestrictions,
		EffectiveFrom:    time.Now(),
		CreatedBy:        &req.CreatedBy,
	}

	if req.DataScope != nil {
		override.DataScopeType = req.DataScope.Type
		override.DataScopeRule = req.DataScope.Rule
	}

	if req.EffectiveFrom != nil {
		t, err := time.Parse(time.RFC3339, *req.EffectiveFrom)
		if err != nil {
			return nil, fmt.Errorf("invalid effective_from format: %w", err)
		}
		override.EffectiveFrom = t
	}

	if req.EffectiveUntil != nil {
		t, err := time.Parse(time.RFC3339, *req.EffectiveUntil)
		if err != nil {
			return nil, fmt.Errorf("invalid effective_until format: %w", err)
		}
		if t.Before(override.EffectiveFrom) {
			return nil, ErrInvalidDateRange
		}
		override.EffectiveUntil = &t
	}

	err = s.overrideRepo.Create(ctx, override)
	if err != nil {
		s.logger.Error("failed to create override",
			zap.Error(err),
			zap.String("userID", req.UserID),
		)
		return nil, err
	}

	// 清除缓存
	s.fieldService.InvalidateCache(req.UserID, req.Resource)

	return override, nil
}

// DeleteOverride 删除权限覆盖
func (s *PermissionOverrideCRUDService) DeleteOverride(ctx context.Context, overrideID string) error {
	// 先获取覆盖信息用于清除缓存
	override, err := s.overrideRepo.FindByID(ctx, overrideID)
	if err != nil {
		return err
	}
	if override == nil {
		return ErrOverrideNotFound
	}

	err = s.overrideRepo.Delete(ctx, overrideID)
	if err != nil {
		s.logger.Error("failed to delete override",
			zap.Error(err),
			zap.String("overrideID", overrideID),
		)
		return err
	}

	// 清除缓存
	s.fieldService.InvalidateCache(override.UserID, override.Resource)

	return nil
}

// validateOverrideInput 验证权限覆盖输入
func (s *PermissionOverrideCRUDService) validateOverrideInput(input *OverrideInput) error {
	// 验证覆盖类型
	if input.OverrideType != model.OverrideTypeGrant && input.OverrideType != model.OverrideTypeDeny {
		return ErrInvalidOverrideType
	}

	// 验证数据范围
	if input.DataScope != nil {
		validTypes := map[model.DataScopeType]bool{
			model.DataScopeAll:            true,
			model.DataScopeDepartment:     true,
			model.DataScopeDepartmentTree: true,
			model.DataScopeSelf:           true,
			model.DataScopeCustom:         true,
		}
		if !validTypes[input.DataScope.Type] {
			return ErrInvalidDataScope
		}

		// 自定义规则必须有 Rule
		if input.DataScope.Type == model.DataScopeCustom && input.DataScope.Rule == nil {
			return fmt.Errorf("custom data scope must have rule")
		}
	}

	// 验证字段限制
	if input.FieldRestrictions != nil {
		for fieldName, restriction := range input.FieldRestrictions {
			validModes := map[model.FieldMode]bool{
				model.FieldModeVisible:  true,
				model.FieldModeHidden:   true,
				model.FieldModeReadonly: true,
				model.FieldModeMasked:   true,
			}
			if !validModes[restriction.Mode] {
				return fmt.Errorf("invalid field mode for field %s", fieldName)
			}
		}
	}

	return nil
}

// toOverrideItems 转换为 API 返回格式
func (s *PermissionOverrideCRUDService) toOverrideItems(overrides []*model.PermissionOverride) []*OverrideItem {
	items := make([]*OverrideItem, len(overrides))
	for i, o := range overrides {
		item := &OverrideItem{
			ID:               o.ID,
			Resource:         o.Resource,
			PermissionID:     o.PermissionID,
			OverrideType:     o.OverrideType,
			DataScope: &DataScopeResponse{
				Type: o.DataScopeType,
				Rule: o.DataScopeRule,
			},
			FieldRestrictions: o.FieldRestrictions,
			EffectiveFrom:     o.EffectiveFrom.Format(time.RFC3339),
			CreatedAt:         o.CreatedAt.Format(time.RFC3339),
		}

		if o.EffectiveUntil != nil {
			t := o.EffectiveUntil.Format(time.RFC3339)
			item.EffectiveUntil = &t
		}

		if o.CreatedBy != nil {
			item.CreatedBy = &CreatedByInfo{
				ID: *o.CreatedBy,
			}
		}

		items[i] = item
	}
	return items
}
