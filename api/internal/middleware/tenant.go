package middleware

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/pkg/tenant"
)

const (
	ContextKeyEnterpriseID = "enterprise_id"
	ContextKeySchema       = "schema"
)

func Tenant() gin.HandlerFunc {
	return func(c *gin.Context) {
		enterpriseID := c.GetHeader("X-Enterprise-ID")
		if enterpriseID == "" {
			enterpriseID = c.Query("enterprise_id")
		}

		if enterpriseID != "" {
			c.Set(ContextKeyEnterpriseID, enterpriseID)
			schema := tenant.SchemaName(enterpriseID)
			c.Set(ContextKeySchema, schema)

			if tenant.GlobalDB != nil {
				tenant.UseSchema(tenant.GlobalDB, enterpriseID)
			}
		}

		c.Next()
	}
}

func GetEnterpriseID(c *gin.Context) string {
	id, _ := c.Get(ContextKeyEnterpriseID)
	if id == nil {
		return ""
	}
	return id.(string)
}

func GetSchema(c *gin.Context) string {
	s, _ := c.Get(ContextKeySchema)
	if s == nil {
		return ""
	}
	return s.(string)
}
