package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

func Recovery(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				logger.Error("panic recovered",
					zap.Any("panic", rec),
					zap.String("path", c.Request.URL.Path),
				)
				response.Error(c, errors.ErrInternal.WithDetail("服务器内部异常"))
				c.Abort()
			}
		}()
		c.Next()
	}
}

func RecoveryWithStatus() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": gin.H{
						"code":    "INTERNAL_ERROR",
						"message": "服务器内部错误",
					},
				})
			}
		}()
		c.Next()
	}
}
