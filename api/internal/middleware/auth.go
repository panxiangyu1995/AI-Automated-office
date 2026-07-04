package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/pkg/auth"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

const (
	ContextKeyUserID = "user_id"
	ContextKeyRole   = "role"
	ContextKeyEmail  = "email"
)

func AuthRequired(jwtManager *auth.JWTManager) gin.HandlerFunc {
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

		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyRole, claims.Role)
		c.Set(ContextKeyEmail, claims.Email)

		c.Next()
	}
}
