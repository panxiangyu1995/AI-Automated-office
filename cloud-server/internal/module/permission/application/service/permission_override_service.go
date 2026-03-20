package service

import (
	"context"
	"sync"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"go.uber.org/zap"
)

// PermissionOverrideService 权限覆盖服务
type PermissionOverrideService struct {
	overrideRepo repository.PermissionOverrideRepository
	logger       *zap.Logger
}

// NewPermissionOverrideService 创建权限覆盖服务
func NewPermissionOverrideService(
	overrideRepo repository.PermissionOverrideRepository,
	logger *zap.Logger,
) *PermissionOverrideService {
	return &PermissionOverrideService{
		overrideRepo: overrideRepo,
		logger:       logger,
	}
}

// GetUserOverrides 获取用户的所有权限覆盖
func (s *PermissionOverrideService) GetUserOverrides(ctx context.Context, userID string) ([]*model.PermissionOverride, error) {
	overrides, err := s.overrideRepo.FindEffectiveByUserID(ctx, userID)
	if err != nil {
		s.logger.Error("failed to get user overrides",
			zap.Error(err),
			zap.String("userID", userID),
		)
		return nil, err
	}
	return overrides, nil
}

// GetUserResourceOverrides 获取用户指定资源的权限覆盖
func (s *PermissionOverrideService) GetUserResourceOverrides(ctx context.Context, userID, resource string) ([]*model.PermissionOverride, error) {
	overrides, err := s.overrideRepo.FindEffectiveByUserIDAndResource(ctx, userID, resource)
	if err != nil {
		s.logger.Error("failed to get user resource overrides",
			zap.Error(err),
			zap.String("userID", userID),
			zap.String("resource", resource),
		)
		return nil, err
	}
	return overrides, nil
}

// ApplyOverrides 应用权限覆盖到基础权限
func (s *PermissionOverrideService) ApplyOverrides(
	basePermissions map[string]bool,
	overrides []*model.PermissionOverride,
) map[string]bool {
	result := make(map[string]bool)
	for k, v := range basePermissions {
		result[k] = v
	}

	for _, override := range overrides {
		if override.PermissionID != nil && *override.PermissionID != "" {
			// 具体权限覆盖
			permID := *override.PermissionID
			if override.OverrideType == model.OverrideTypeGrant {
				result[permID] = true
			} else {
				result[permID] = false
			}
		} else {
			// 资源级覆盖 - 需要根据资源标识处理
			// 这里我们只记录覆盖信息，具体权限码由调用方处理
		}
	}

	return result
}

// GetDataScope 获取用户指定资源的数据范围
func (s *PermissionOverrideService) GetDataScope(ctx context.Context, userID, resource string) (*model.DataScope, error) {
	overrides, err := s.overrideRepo.FindEffectiveByUserIDAndResource(ctx, userID, resource)
	if err != nil {
		return nil, err
	}

	// 默认为全部数据
	dataScope := &model.DataScope{
		Type: model.DataScopeAll,
	}

	// 查找最近的授权类型覆盖的数据范围配置
	for _, override := range overrides {
		if override.OverrideType == model.OverrideTypeGrant && override.DataScopeType != "" {
			dataScope.Type = override.DataScopeType
			dataScope.Rule = override.DataScopeRule
			break
		}
	}

	return dataScope, nil
}

// GetFieldRestrictions 获取用户指定资源的字段限制
func (s *PermissionOverrideService) GetFieldRestrictions(ctx context.Context, userID, resource string) (model.FieldRestrictionsMap, error) {
	overrides, err := s.overrideRepo.FindEffectiveByUserIDAndResource(ctx, userID, resource)
	if err != nil {
		return nil, err
	}

	restrictions := make(model.FieldRestrictionsMap)

	for _, override := range overrides {
		if override.FieldRestrictions != nil {
			// 合并字段限制，deny 类型的覆盖优先
			for fieldName, restriction := range override.FieldRestrictions {
				if existing, ok := restrictions[fieldName]; ok {
					// 如果已存在限制，deny 类型的覆盖优先
					if override.OverrideType == model.OverrideTypeDeny {
						restrictions[fieldName] = restriction
					} else if existing.Mode == model.FieldModeVisible {
						// 只有当前为可见时才覆盖
						restrictions[fieldName] = restriction
					}
				} else {
					restrictions[fieldName] = restriction
				}
			}
		}
	}

	return restrictions, nil
}

// GetPermissionResult 获取用户完整权限结果
func (s *PermissionOverrideService) GetPermissionResult(
	ctx context.Context,
	userID string,
	resource string,
	basePermissions map[string]bool,
) (*model.PermissionResult, error) {
	// 1. 获取用户覆盖
	overrides, err := s.overrideRepo.FindEffectiveByUserIDAndResource(ctx, userID, resource)
	if err != nil {
		return nil, err
	}

	// 2. 应用权限覆盖
	permissions := s.ApplyOverrides(basePermissions, overrides)

	// 3. 获取数据范围
	dataScope, err := s.GetDataScope(ctx, userID, resource)
	if err != nil {
		return nil, err
	}

	// 4. 获取字段限制
	fieldRestrictions, err := s.GetFieldRestrictions(ctx, userID, resource)
	if err != nil {
		return nil, err
	}

	// 5. 构建来源追溯
	sources := make([]model.PermissionSource, 0)
	for _, override := range overrides {
		if override.PermissionID != nil {
			sources = append(sources, model.PermissionSource{
				PermissionID: *override.PermissionID,
				SourceType:   "override",
				SourceID:     override.ID,
				SourceName:   "用户覆盖",
			})
		}
	}

	return &model.PermissionResult{
		Permissions:       permissions,
		DataScope:         dataScope,
		FieldRestrictions: fieldRestrictions,
		Sources:           sources,
	}, nil
}

// OverrideCache 权限覆盖缓存
type OverrideCache struct {
	mu         sync.RWMutex
	items      map[string]*overrideCacheItem
	ttl        time.Duration
	cleanupInt time.Duration
	stopChan   chan struct{}
}

type overrideCacheItem struct {
	overrides []*model.PermissionOverride
	expiredAt time.Time
}

// NewOverrideCache 创建权限覆盖缓存
func NewOverrideCache(ttl time.Duration) *OverrideCache {
	c := &OverrideCache{
		items:    make(map[string]*overrideCacheItem),
		ttl:      ttl,
		stopChan: make(chan struct{}),
	}

	go c.cleanup()

	return c
}

// Get 获取缓存
func (c *OverrideCache) Get(userID string) ([]*model.PermissionOverride, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[userID]
	if !exists {
		return nil, false
	}

	if time.Now().After(item.expiredAt) {
		return nil, false
	}

	return item.overrides, true
}

// Set 设置缓存
func (c *OverrideCache) Set(userID string, overrides []*model.PermissionOverride) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[userID] = &overrideCacheItem{
		overrides: overrides,
		expiredAt: time.Now().Add(c.ttl),
	}
}

// Delete 删除缓存
func (c *OverrideCache) Delete(userID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, userID)
}

// Clear 清空缓存
func (c *OverrideCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]*overrideCacheItem)
}

// cleanup 定期清理过期缓存
func (c *OverrideCache) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.doCleanup()
		case <-c.stopChan:
			return
		}
	}
}

// doCleanup 执行清理
func (c *OverrideCache) doCleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, item := range c.items {
		if now.After(item.expiredAt) {
			delete(c.items, key)
		}
	}
}

// Stop 停止缓存清理
func (c *OverrideCache) Stop() {
	close(c.stopChan)
}
