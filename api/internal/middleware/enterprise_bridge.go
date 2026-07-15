package middleware

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
)

func ResolveEnterpriseContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		existing := c.GetString(ContextKeyEnterpriseID)
		if existing != "" {
			c.Next()
			return
		}

		tokenEID, exists := c.Get(ContextKeyEnterpriseIDFromToken)
		if !exists {
			c.Next()
			return
		}

		eid, ok := tokenEID.(string)
		if !ok || eid == "" {
			c.Next()
			return
		}

		c.Set(ContextKeyEnterpriseID, eid)
		schema, _ := tenant.SchemaName(eid)
		c.Set(ContextKeySchema, schema)

		if tenant.GlobalDB != nil {
			tenantDB := tenant.UseSchema(tenant.GlobalDB, eid)
			c.Set(ContextKeyTenantDB, tenantDB)
			tenant.SetEnterpriseContext(tenantDB, eid)
			defer tenant.ResetSearchPath(tenant.GlobalDB)
		}

		c.Next()
	}
}
