package repository

import (
	"context"

	"cloud-server/internal/model"
)

// PermissionOverrideFilter 权限覆盖筛选条件
type PermissionOverrideFilter struct {
	UserID   string // 用户ID
	Resource string // 资源标识
	Type     *model.OverrideType // 覆盖类型
}

// PermissionOverrideListResult 权限覆盖列表结果
type PermissionOverrideListResult struct {
	Items    []*model.PermissionOverrideWithDetails
	Total    int64
	Page     int
	PageSize int
}

// PermissionOverrideItem 权限覆盖项（简化版）
type PermissionOverrideItem struct {
	ID               string                          `json:"id"`
	UserID           string                          `json:"user_id"`
	Resource         string                          `json:"resource"`
	PermissionID     *string                         `json:"permission_id,omitempty"`
	OverrideType     model.OverrideType              `json:"override_type"`
	DataScopeType    model.DataScopeType             `json:"data_scope_type"`
	DataScopeRule    *model.DataScopeRule            `json:"data_scope_rule,omitempty"`
	FieldRestrictions model.FieldRestrictionsMap     `json:"field_restrictions,omitempty"`
	EffectiveFrom    string                          `json:"effective_from"`
	EffectiveUntil   *string                         `json:"effective_until,omitempty"`
	CreatedBy        *string                         `json:"created_by,omitempty"`
	CreatedAt        string                          `json:"created_at"`
}

// PermissionOverrideRepository 权限覆盖仓储接口
type PermissionOverrideRepository interface {
	// FindByID 根据 ID 查找权限覆盖
	FindByID(ctx context.Context, overrideID string) (*model.PermissionOverride, error)

	// FindByUserID 获取用户的所有权限覆盖
	FindByUserID(ctx context.Context, userID string) ([]*model.PermissionOverride, error)

	// FindByUserIDAndResource 获取用户指定资源的权限覆盖
	FindByUserIDAndResource(ctx context.Context, userID, resource string) ([]*model.PermissionOverride, error)

	// FindEffectiveByUserID 获取用户当前有效的权限覆盖
	FindEffectiveByUserID(ctx context.Context, userID string) ([]*model.PermissionOverride, error)

	// FindEffectiveByUserIDAndResource 获取用户指定资源的有效权限覆盖
	FindEffectiveByUserIDAndResource(ctx context.Context, userID, resource string) ([]*model.PermissionOverride, error)

	// FindWithFilters 分页筛选查询权限覆盖列表
	FindWithFilters(ctx context.Context, tenantID string, filter *PermissionOverrideFilter, page, pageSize int) (*PermissionOverrideListResult, error)

	// Create 创建权限覆盖
	Create(ctx context.Context, override *model.PermissionOverride) error

	// Update 更新权限覆盖
	Update(ctx context.Context, override *model.PermissionOverride) error

	// Delete 删除权限覆盖
	Delete(ctx context.Context, overrideID string) error

	// DeleteByUserID 删除用户的所有权限覆盖
	DeleteByUserID(ctx context.Context, userID string) error

	// BatchCreate 批量创建权限覆盖
	BatchCreate(ctx context.Context, overrides []*model.PermissionOverride) error

	// BatchUpdate 批量更新用户权限覆盖（先删后建）
	BatchUpdate(ctx context.Context, tenantID, userID string, overrides []*model.PermissionOverride) error

	// ExistsByUserResource 检查用户对资源的覆盖是否存在
	ExistsByUserResource(ctx context.Context, userID, resource string, permissionID *string) (bool, error)
}
