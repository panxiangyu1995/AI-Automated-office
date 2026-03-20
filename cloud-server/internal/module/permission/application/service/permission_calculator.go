package service

import (
	"context"
	"sync"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"go.uber.org/zap"
)

// PermissionCalculator 权限计算器
type PermissionCalculator struct {
	permissionRepo repository.PermissionRepository
	cache          *PermissionCache
	logger         *zap.Logger
}

// NewPermissionCalculator 创建权限计算器
func NewPermissionCalculator(
	permissionRepo repository.PermissionRepository,
	logger *zap.Logger,
) *PermissionCalculator {
	return &PermissionCalculator{
		permissionRepo: permissionRepo,
		cache:          NewPermissionCache(5 * time.Minute),
		logger:         logger,
	}
}

// GetUserPermissions 获取用户的所有有效权限
func (pc *PermissionCalculator) GetUserPermissions(ctx context.Context, userID string) (*model.PermissionSet, error) {
	// 1. 检查缓存
	if cached, ok := pc.cache.Get(userID); ok {
		return cached, nil
	}

	// 2. 从数据库获取权限
	permissionSet, err := pc.permissionRepo.GetPermissionSet(ctx, userID)
	if err != nil {
		pc.logger.Error("failed to get user permissions",
			zap.Error(err),
			zap.String("userID", userID),
		)
		return nil, err
	}

	// 3. 应用权限继承规则
	pc.applyInheritance(permissionSet)

	// 4. 缓存结果
	pc.cache.Set(userID, permissionSet)

	return permissionSet, nil
}

// HasPermission 检查用户是否拥有指定权限
func (pc *PermissionCalculator) HasPermission(ctx context.Context, userID, permissionCode string) (bool, error) {
	permissions, err := pc.GetUserPermissions(ctx, userID)
	if err != nil {
		return false, err
	}
	return permissions.Contains(permissionCode), nil
}

// HasAnyPermission 检查用户是否拥有任意一个指定权限
func (pc *PermissionCalculator) HasAnyPermission(ctx context.Context, userID string, permissionCodes []string) (bool, error) {
	permissions, err := pc.GetUserPermissions(ctx, userID)
	if err != nil {
		return false, err
	}
	return permissions.ContainsAny(permissionCodes), nil
}

// HasAllPermissions 检查用户是否拥有所有指定权限
func (pc *PermissionCalculator) HasAllPermissions(ctx context.Context, userID string, permissionCodes []string) (bool, error) {
	permissions, err := pc.GetUserPermissions(ctx, userID)
	if err != nil {
		return false, err
	}
	return permissions.ContainsAll(permissionCodes), nil
}

// GetPermissionsByLayer 获取用户指定层级的权限
func (pc *PermissionCalculator) GetPermissionsByLayer(ctx context.Context, userID string, layer model.PermissionLayer) ([]*model.Permission, error) {
	permissions, err := pc.GetUserPermissions(ctx, userID)
	if err != nil {
		return nil, err
	}
	return permissions.GetByLayer(layer), nil
}

// GetPermissionsByResource 获取用户指定资源的权限
func (pc *PermissionCalculator) GetPermissionsByResource(ctx context.Context, userID, resource string) ([]*model.Permission, error) {
	permissions, err := pc.GetUserPermissions(ctx, userID)
	if err != nil {
		return nil, err
	}
	return permissions.GetByResource(resource), nil
}

// InvalidateCache 使缓存失效
func (pc *PermissionCalculator) InvalidateCache(userID string) {
	pc.cache.Delete(userID)
}

// InvalidateAllCache 使所有缓存失效
func (pc *PermissionCalculator) InvalidateAllCache() {
	pc.cache.Clear()
}

// applyInheritance 应用权限继承规则
// 三层权限继承：approval -> department -> base
// 拥有高层级权限的用户自动拥有低层级权限
func (pc *PermissionCalculator) applyInheritance(permissionSet *model.PermissionSet) {
	// 权限继承已经在数据库层面通过角色-权限关联处理
	// 这里不需要额外处理，因为用户的权限已经通过所有角色聚合
}

// PermissionCache 权限缓存
type PermissionCache struct {
	mu         sync.RWMutex
	items      map[string]*cacheItem
	ttl        time.Duration
	cleanupInt time.Duration
	stopChan   chan struct{}
}

type cacheItem struct {
	permissionSet *model.PermissionSet
	expiredAt     time.Time
}

// NewPermissionCache 创建权限缓存
func NewPermissionCache(ttl time.Duration) *PermissionCache {
	c := &PermissionCache{
		items:    make(map[string]*cacheItem),
		ttl:      ttl,
		stopChan: make(chan struct{}),
	}

	// 启动清理协程
	go c.cleanup()

	return c
}

// Get 获取缓存
func (c *PermissionCache) Get(userID string) (*model.PermissionSet, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[userID]
	if !exists {
		return nil, false
	}

	if time.Now().After(item.expiredAt) {
		return nil, false
	}

	return item.permissionSet, true
}

// Set 设置缓存
func (c *PermissionCache) Set(userID string, permissionSet *model.PermissionSet) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[userID] = &cacheItem{
		permissionSet: permissionSet,
		expiredAt:     time.Now().Add(c.ttl),
	}
}

// Delete 删除缓存
func (c *PermissionCache) Delete(userID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, userID)
}

// Clear 清空缓存
func (c *PermissionCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]*cacheItem)
}

// cleanup 定期清理过期缓存
func (c *PermissionCache) cleanup() {
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
func (c *PermissionCache) doCleanup() {
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
func (c *PermissionCache) Stop() {
	close(c.stopChan)
}
