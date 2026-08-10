package middleware

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
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
			tokenEnterpriseID, _ := c.Get(ContextKeyEnterpriseIDFromToken)
			tokenEID, _ := tokenEnterpriseID.(string)

			role, _ := c.Get(ContextKeyRole)
			roleStr, _ := role.(string)
			isPrivileged := roleStr == string(rbac.RoleOperator) || roleStr == string(rbac.RoleOwner)

			if tokenEID != "" && enterpriseID != tokenEID && !isPrivileged {
				userID, _ := c.Get(ContextKeyUserID)
				userIDStr, _ := userID.(string)
				if userIDStr != "" && !userBelongsToEnterprise(userIDStr, enterpriseID) {
					response.Error(c, errors.ErrPermissionDenied.WithDetail("无权访问该企业数据"))
					c.Abort()
					return
				}
			}

			c.Set(ContextKeyEnterpriseID, enterpriseID)
			schema, err := tenant.SchemaName(enterpriseID)
			if err != nil {
				c.Set(ContextKeySchema, "")
			} else {
				c.Set(ContextKeySchema, schema)
				c.Request = c.Request.WithContext(tenant.WithSchemaContext(c.Request.Context(), schema))
			}

			if tenant.GlobalDB != nil {
				tenantDB := tenant.UseSchema(tenant.GlobalDB, enterpriseID)
				c.Set(ContextKeyTenantDB, tenantDB)
				tenant.SetEnterpriseContext(tenantDB, enterpriseID)
				defer tenant.ReleaseConn(tenantDB)
			}
		}

		c.Next()
	}
}

func userBelongsToEnterprise(userID, enterpriseID string) bool {
	if GlobalTenantDB == nil {
		return false
	}
	var count int64
	GlobalTenantDB.Model(&model.User{}).
		Where("id = ? AND enterprise_id = ?", userID, enterpriseID).
		Count(&count)
	return count > 0
}

var GlobalTenantDB *gorm.DB

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
