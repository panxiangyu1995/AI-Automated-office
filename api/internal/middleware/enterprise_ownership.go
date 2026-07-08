package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

const ContextKeyEnterpriseIDFromToken = "enterprise_id_from_token"

type CrossPermChecker func(userID, targetEnterpriseID uuid.UUID) (bool, error)

func EnterpriseOwnership(checkCrossPerm CrossPermChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		enterpriseIDStr := c.GetString(ContextKeyEnterpriseID)
		if enterpriseIDStr == "" {
			response.Error(c, errors.ErrTenantRequired.WithDetail("缺少企业上下文"))
			c.Abort()
			return
		}

		tokenEnterpriseID, exists := c.Get(ContextKeyEnterpriseIDFromToken)
		if !exists {
			response.Error(c, errors.ErrUnauthorized.WithDetail("令牌中缺少企业信息"))
			c.Abort()
			return
		}

		if enterpriseIDStr == tokenEnterpriseID {
			c.Next()
			return
		}

		userIDStr, _ := c.Get(ContextKeyUserID)
		userID, err := uuid.Parse(userIDStr.(string))
		if err != nil {
			response.Error(c, errors.ErrUnauthorized.WithDetail("无效的用户ID"))
			c.Abort()
			return
		}

		targetEnterpriseID, err := uuid.Parse(enterpriseIDStr)
		if err != nil {
			response.Error(c, errors.ErrPermissionDenied.WithDetail("无效的企业ID"))
			c.Abort()
			return
		}

		if checkCrossPerm != nil {
			allowed, cerr := checkCrossPerm(userID, targetEnterpriseID)
			if cerr == nil && allowed {
				c.Next()
				return
			}
		}

		response.Error(c, errors.ErrPermissionDenied.WithDetail("无权访问该企业数据"))
		c.Abort()
	}
}
