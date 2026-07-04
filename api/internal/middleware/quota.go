package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/response"
)

type QuotaMiddleware struct {
	quotaService *service.QuotaService
}

func NewQuotaMiddleware(quotaService *service.QuotaService) *QuotaMiddleware {
	return &QuotaMiddleware{quotaService: quotaService}
}

func (m *QuotaMiddleware) Check() gin.HandlerFunc {
	return func(c *gin.Context) {
		if m.quotaService == nil {
			c.Next()
			return
		}

		enterpriseIDStr := c.GetString(ContextKeyEnterpriseID)
		if enterpriseIDStr == "" {
			c.Next()
			return
		}

		enterpriseID, err := uuid.Parse(enterpriseIDStr)
		if err != nil {
			c.Next()
			return
		}

		if appErr := m.quotaService.CheckAndIncrement(enterpriseID); appErr != nil {
			response.Error(c, appErr)
			c.Abort()
			return
		}

		c.Next()
	}
}
