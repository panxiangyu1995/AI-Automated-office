package middleware

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/rbac"
	"github.com/ai-office/api/pkg/response"
)

func RequirePermission(perm rbac.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleStr, exists := c.Get(ContextKeyRole)
		if !exists {
			response.Error(c, errors.ErrUnauthorized.WithDetail("未找到用户角色信息，请重新登录"))
			c.Abort()
			return
		}

		role, ok := rbac.ValidateRole(roleStr.(string))
		if !ok {
			response.Error(c, errors.ErrPermissionDenied.WithDetail("无效的用户角色: "+roleStr.(string)))
			c.Abort()
			return
		}

		if !rbac.HasPermission(role, perm) {
			response.Error(c, errors.ErrPermissionDenied.WithDetail("角色 "+string(role)+" 无权限执行该操作"))
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireAnyPermission(perms ...rbac.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleStr, exists := c.Get(ContextKeyRole)
		if !exists {
			response.Error(c, errors.ErrUnauthorized.WithDetail("未找到用户角色信息，请重新登录"))
			c.Abort()
			return
		}

		role, ok := rbac.ValidateRole(roleStr.(string))
		if !ok {
			response.Error(c, errors.ErrPermissionDenied.WithDetail("无效的用户角色: "+roleStr.(string)))
			c.Abort()
			return
		}

		if !rbac.HasAnyPermission(role, perms...) {
			response.Error(c, errors.ErrPermissionDenied.WithDetail("角色 "+string(role)+" 无权限执行该操作"))
			c.Abort()
			return
		}

		c.Next()
	}
}
