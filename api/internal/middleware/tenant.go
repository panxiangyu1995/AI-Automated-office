package middleware

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/ai-office/api/pkg/tenant"
)

const (
	ContextKeyEnterpriseID = "enterprise_id"
	ContextKeySchema       = "schema"
	ContextKeyTenantDB     = "tenant_db"
)

func Tenant() gin.HandlerFunc {
	return func(c *gin.Context) {
		enterpriseID := c.GetHeader("X-Enterprise-ID")
		if enterpriseID == "" {
			enterpriseID = c.Query("enterprise_id")
		}
		if enterpriseID == "" {
			enterpriseID = c.Param("enterprise_id")
		}

		if enterpriseID != "" {
			c.Set(ContextKeyEnterpriseID, enterpriseID)
			schema := tenant.SchemaName(enterpriseID)
			c.Set(ContextKeySchema, schema)

			if tenant.GlobalDB != nil {
				tenantDB := tenant.UseSchema(tenant.GlobalDB, enterpriseID)
				c.Set(ContextKeyTenantDB, tenantDB)
				tenant.SetEnterpriseContext(tenantDB, enterpriseID)
				defer tenant.ResetSearchPath(tenant.GlobalDB)
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

func GetTenantDB(c *gin.Context) *gorm.DB {
	db, exists := c.Get(ContextKeyTenantDB)
	if !exists || db == nil {
		return nil
	}
	return db.(*gorm.DB)
}
