package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type FeatureFlagMiddleware struct {
	quotaService *service.QuotaService
}

func NewFeatureFlagMiddleware(quotaService *service.QuotaService) *FeatureFlagMiddleware {
	return &FeatureFlagMiddleware{quotaService: quotaService}
}

func (m *FeatureFlagMiddleware) Require(featureKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if m.quotaService == nil {
			c.Next()
			return
		}

		enterpriseIDStr := c.GetString(ContextKeyEnterpriseID)
		if enterpriseIDStr == "" {
			response.Error(c, errors.ErrTenantRequired)
			c.Abort()
			return
		}

		enterpriseID, err := uuid.Parse(enterpriseIDStr)
		if err != nil {
			c.Next()
			return
		}

		if appErr := m.quotaService.CheckFeature(enterpriseID, featureKey); appErr != nil {
			response.Error(c, appErr)
			c.Abort()
			return
		}

		c.Next()
	}
}
