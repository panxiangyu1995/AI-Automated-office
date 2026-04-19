package middleware

import (
	"net/http"

	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func RecoveryMiddleware(log *zap.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		if log != nil {
			log.Error("panic recovered", zap.Any("error", recovered))
		}
		response.Error(c, http.StatusInternalServerError, "ERR_INTERNAL", "服务器内部错误", nil)
		c.Abort()
	})
}
