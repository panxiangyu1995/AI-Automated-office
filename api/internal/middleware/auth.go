package middleware

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/pkg/auth"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/redis"
	"github.com/ai-office/api/pkg/response"
)

const (
	ContextKeyUserID = "user_id"
	ContextKeyRole   = "role"
	ContextKeyEmail  = "email"
)

func GetUserID(c *gin.Context) string {
	id, ok := c.Get(ContextKeyUserID)
	if !ok || id == nil {
		return ""
	}
	s, ok := id.(string)
	if !ok {
		return ""
	}
	return s
}

func GetRole(c *gin.Context) string {
	r, ok := c.Get(ContextKeyRole)
	if !ok || r == nil {
		return ""
	}
	s, ok := r.(string)
	if !ok {
		return ""
	}
	return s
}

func AuthRequired(jwtManager *auth.JWTManager, tokenBlacklist *redis.TokenBlacklist) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, errors.ErrUnauthorized.WithDetail("缺少 Authorization 请求头"))
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Error(c, errors.ErrUnauthorized.WithDetail("Authorization 格式应为 Bearer <token>"))
			c.Abort()
			return
		}

		claims, err := jwtManager.ValidateToken(parts[1])
		if err != nil {
			response.Error(c, errors.ErrTokenInvalid.WithDetail(err.Error()))
			c.Abort()
			return
		}

		if tokenBlacklist != nil && claims.ID != "" {
			blacklisted, err := tokenBlacklist.IsBlacklisted(context.Background(), claims.ID)
			if err != nil {
				response.Error(c, errors.ErrInternal.WithDetail("token 验证服务不可用，请稍后重试"))
				c.Abort()
				return
			}
			if blacklisted {
				response.Error(c, errors.ErrTokenInvalid.WithDetail("token has been revoked"))
				c.Abort()
				return
			}
		}

		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyRole, claims.Role)
		c.Set(ContextKeyEmail, claims.Email)
		c.Set(ContextKeyEnterpriseIDFromToken, claims.EnterpriseID)

		c.Next()
	}
}
