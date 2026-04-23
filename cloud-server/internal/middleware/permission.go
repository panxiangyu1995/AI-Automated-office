package middleware

import (
	"context"
	"fmt"
	"strings"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// PermissionConfig 权限中间件配置
type PermissionConfig struct {
	// PublicRoutes 公开路由（不需要权限校验）
	PublicRoutes map[string]bool
	// ResourceRouteMapping 路由到资源的映射
	ResourceRouteMapping map[string]string
}

// DefaultPermissionConfig 默认权限配置
func DefaultPermissionConfig() *PermissionConfig {
	return &PermissionConfig{
		PublicRoutes: map[string]bool{
			"/api/v1/health":            true,
			"/api/v1/health/liveness":   true,
			"/api/v1/health/readiness":  true,
			"/api/v1/auth/login":        true,
			"/api/v1/auth/register":     true,
			"/api/v1/auth/forgot-password": true,
			"/api/v1/swagger/*":         true,
		},
		ResourceRouteMapping: map[string]string{
			"/api/v1/admin/users":          "hr.employee",
			"/api/v1/admin/departments":    "department",
			"/api/v1/admin/positions":      "hr.position",
			"/api/v1/admin/roles":         "admin.role",
			"/api/v1/admin/permissions":    "system.permission",
			"/api/v1/permissions/roles":    "system.role",
			"/api/v1/permissions/overrides": "system.permission_override",
			"/api/v1/messages":             "message",
			"/api/v1/announcements":        "announcement",
		},
	}
}

// PermissionMiddleware 权限中间件
func PermissionMiddleware(
	permCalculator *service.PermissionCalculator,
	overrideService *service.PermissionOverrideService,
	permConfig *PermissionConfig,
	log *zap.Logger,
) gin.HandlerFunc {
	if permConfig == nil {
		permConfig = DefaultPermissionConfig()
	}

	return func(c *gin.Context) {
		traceID := c.GetString("trace_id")
		userID := c.GetString("user_id")
		tenantID := c.GetString("tenant_id")

		// 检查是否为公开路由
		fullPath := c.FullPath()
		if isPublicRoute(fullPath, permConfig.PublicRoutes) {
			c.Next()
			return
		}

		// 如果没有用户信息，跳过权限校验（由 AuthMiddleware 处理）
		if userID == "" {
			c.Next()
			return
		}

		// 解析资源标识
		resource := getResourceFromPath(fullPath, permConfig.ResourceRouteMapping)

		// 解析请求方法到操作
		action := getActionFromMethod(c.Request.Method)

		// 获取用户权限结果
		permResult, err := getUserPermissionResult(
			c.Request.Context(),
			permCalculator,
			overrideService,
			userID,
			tenantID,
			resource,
		)

		if err != nil {
			if log != nil {
				log.Error("failed to get permission result",
					zap.Error(err),
					zap.String("userID", userID),
					zap.String("resource", resource),
				)
			}
			response.Error(c, 500, response.ErrPermissionError, "权限计算失败", nil)
			c.Abort()
			return
		}

		// 检查权限
		permCode := strings.ReplaceAll(resource, ".", "_")
		requiredPerm := fmt.Sprintf("%s_%s", permCode, action)
		if !permResult.Permissions[requiredPerm] {
			response.Forbidden(c, response.ForbiddenResponse{
				Code:               response.ErrPermissionDenied,
				Message:            "当前账号无权限执行该操作",
				Resource:           resource,
				RequiredPermission: requiredPerm,
				ApplyEntry:         fmt.Sprintf("/permissions/apply?resource=%s", resource),
				TraceID:            traceID,
			})
			c.Abort()
			return
		}

		// 设置权限上下文（供 Handler 使用）
		c.Set("permission_result", permResult)
		if permResult.DataScope != nil {
			c.Set("data_scope", permResult.DataScope)
		}
		if permResult.FieldRestrictions != nil {
			c.Set("field_restrictions", permResult.FieldRestrictions)
		}

		c.Next()
	}
}

// isPublicRoute 检查是否为公开路由
func isPublicRoute(path string, publicRoutes map[string]bool) bool {
	// 精确匹配
	if publicRoutes[path] {
		return true
	}

	// 通配符匹配
	for route := range publicRoutes {
		if strings.HasSuffix(route, "*") {
			prefix := strings.TrimSuffix(route, "*")
			if strings.HasPrefix(path, prefix) {
				return true
			}
		}
	}

	return false
}

// getResourceFromPath 从路由路径解析资源标识
func getResourceFromPath(fullPath string, mapping map[string]string) string {
	// 精确匹配
	if resource, ok := mapping[fullPath]; ok {
		return resource
	}

	// 前缀匹配
	for route, resource := range mapping {
		if strings.HasPrefix(fullPath, route) {
			return resource
		}
	}

	// 默认从路径提取
	parts := strings.Split(strings.Trim(fullPath, "/"), "/")
	// /api/v1/module/entity -> module.entity
	// /api/v1/announcements -> announcements
	if len(parts) >= 4 {
		return parts[2] + "." + parts[3]
	}
	if len(parts) >= 3 {
		return parts[2]
	}

	return "unknown"
}

// getActionFromMethod 从 HTTP 方法映射到操作
func getActionFromMethod(method string) string {
	switch method {
	case "GET":
		return "read"
	case "POST":
		return "create"
	case "PUT", "PATCH":
		return "update"
	case "DELETE":
		return "delete"
	default:
		return "unknown"
	}
}

// getUserPermissionResult 获取用户权限结果（角色权限 + 覆盖权限）
func getUserPermissionResult(
	ctx context.Context,
	permCalculator *service.PermissionCalculator,
	overrideService *service.PermissionOverrideService,
	userID, tenantID, resource string,
) (*model.PermissionResult, error) {
	// 1. 获取用户的角色权限
	permSet, err := permCalculator.GetUserPermissions(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user permissions: %w", err)
	}

	// 2. 构建基础权限映射
	basePermissions := make(map[string]bool)
	for code := range permSet.Permissions {
		basePermissions[code] = true
	}

	// 3. 使用 overrideService 获取完整权限结果
	result, err := overrideService.GetPermissionResult(ctx, userID, resource, basePermissions)
	if err != nil {
		// 覆盖权限获取失败时，返回基础权限
		result = &model.PermissionResult{
			Permissions:       basePermissions,
			DataScope:         &model.DataScope{Type: model.DataScopeAll},
			FieldRestrictions: make(model.FieldRestrictionsMap),
			Sources:           make([]model.PermissionSource, 0),
		}
	}

	// 4. 添加角色权限来源
	for _, perm := range permSet.Permissions {
		result.Sources = append(result.Sources, model.PermissionSource{
			PermissionID: perm.ID,
			SourceType:   "role",
			SourceName:   perm.Name,
		})
	}

	return result, nil
}
