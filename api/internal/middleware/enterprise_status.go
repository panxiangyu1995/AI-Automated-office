package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

var GlobalEnterpriseDB *gorm.DB

type enterpriseStatusContext struct{}

func EnterpriseStatusMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		eidStr := c.GetString("enterprise_id")
		if eidStr == "" {
			c.Next()
			return
		}

		if GlobalEnterpriseDB == nil {
			c.Next()
			return
		}

		var enterprise model.Enterprise
		if err := GlobalEnterpriseDB.Where("id = ?", eidStr).First(&enterprise).Error; err != nil {
			c.Next()
			return
		}

	switch enterprise.Status {
	case "active", "trial":
		c.Next()
		return
	case "suspended":
		path := c.Request.URL.Path
		if isAllowedWhenSuspended(path) {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error":             "ENTERPRISE_SUSPENDED",
			"error_description": "企业服务已暂停，仅可访问认证和状态相关接口",
		})
		return
	case "frozen":
		path := c.Request.URL.Path
		if isAllowedWhenSuspended(path) {
			c.Next()
			return
		}
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":             "ENTERPRISE_FROZEN",
				"error_description": "企业服务已冻结，所有API访问已禁止",
			})
			return
	case "expired":
		path := c.Request.URL.Path
		if isAllowedWhenSuspended(path) {
			c.Next()
			return
		}
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":             "ENTERPRISE_EXPIRED",
				"error_description": "企业订阅已过期，请续费",
			})
			return
		case "cancelled":
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":             "ENTERPRISE_CANCELLED",
				"error_description": "企业已取消，所有API访问已禁止",
			})
			return
		default:
			c.Next()
		}
	}
}

func isAllowedWhenSuspended(path string) bool {
	allowedPrefixes := []string{
		"/api/v1/auth/",
		"/api/v1/health",
		"/api/v1/ready",
	}
	for _, prefix := range allowedPrefixes {
		if len(path) >= len(prefix) && path[:len(prefix)] == prefix {
			return true
		}
	}
	allowedSuffixes := []string{
		"/status-log",
		"/status",
	}
	for _, suffix := range allowedSuffixes {
		if len(path) >= len(suffix) && path[len(path)-len(suffix):] == suffix {
			return true
		}
	}
	return false
}
