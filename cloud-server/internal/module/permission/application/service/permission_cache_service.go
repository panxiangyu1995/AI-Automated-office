package service

import (
	"cloud-server/internal/cache"
	"cloud-server/internal/module/permission/domain/repository"
	"context"
	"time"

	"go.uber.org/zap"
)

// PermissionCacheService 权限缓存服务
type PermissionCacheService struct {
	permissionCache *cache.Cache
	roleCache      *cache.Cache
	permissionRepo repository.PermissionRepository
	logger         *zap.Logger
}

// NewPermissionCacheService 创建权限缓存服务
func NewPermissionCacheService(
	permissionRepo repository.PermissionRepository,
	permissionCache *cache.Cache,
	roleCache *cache.Cache,
	logger *zap.Logger,
) *PermissionCacheService {
	return &PermissionCacheService{
		permissionCache: permissionCache,
		roleCache:      roleCache,
		permissionRepo: permissionRepo,
		logger:         logger,
	}
}

// GetUserPermissions 获取用户权限（带缓存）
func (s *PermissionCacheService) GetUserPermissions(ctx context.Context, userID string) ([]*repository.PermissionItem, error) {
	cacheKey := "user_perms:" + userID

	// 尝试从缓存获取
	if cached, ok := s.permissionCache.Get(cacheKey); ok {
		if perms, ok := cached.([]*repository.PermissionItem); ok {
			s.logger.Debug("cache hit for user permissions", zap.String("user_id", userID))
			return perms, nil
		}
	}

	s.logger.Debug("cache miss for user permissions", zap.String("user_id", userID))

	// 从数据库获取
	permissions, err := s.permissionRepo.FindByUserID(ctx, userID)
	if err != nil {
		s.logger.Error("failed to get user permissions from db", zap.Error(err), zap.String("user_id", userID))
		return nil, err
	}

	// 存入缓存
	s.permissionCache.Set(cacheKey, permissions)

	return permissions, nil
}

// InvalidateUserPermissions 使用户权限缓存失效
func (s *PermissionCacheService) InvalidateUserPermissions(userID string) {
	cacheKey := "user_perms:" + userID
	s.permissionCache.Delete(cacheKey)
	s.logger.Info("user permissions cache invalidated", zap.String("user_id", userID))
}

// GetRolePermissions 获取角色权限（带缓存）
func (s *PermissionCacheService) GetRolePermissions(ctx context.Context, roleID string) ([]*repository.PermissionItem, error) {
	cacheKey := "role_perms:" + roleID

	if cached, ok := s.roleCache.Get(cacheKey); ok {
		if perms, ok := cached.([]*repository.PermissionItem); ok {
			s.logger.Debug("cache hit for role permissions", zap.String("role_id", roleID))
			return perms, nil
		}
	}

	s.logger.Debug("cache miss for role permissions", zap.String("role_id", roleID))

	// TODO: 从数据库获取角色权限
	return nil, nil
}

// InvalidateRolePermissions 使角色权限缓存失效
func (s *PermissionCacheService) InvalidateRolePermissions(roleID string) {
	cacheKey := "role_perms:" + roleID
	s.roleCache.Delete(cacheKey)
	s.logger.Info("role permissions cache invalidated", zap.String("role_id", roleID))
}

// InvalidateAllPermissions 清空所有权限缓存
func (s *PermissionCacheService) InvalidateAllPermissions() {
	s.permissionCache.Clear()
	s.roleCache.Clear()
	s.logger.Info("all permissions cache cleared")
}

// GetStats 获取缓存统计
func (s *PermissionCacheService) GetStats() map[string]cache.Stats {
	return map[string]cache.Stats{
		"permission_cache": s.permissionCache.Stats(),
		"role_cache":       s.roleCache.Stats(),
	}
}
