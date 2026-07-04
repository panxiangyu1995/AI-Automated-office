package middleware

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
)

type AuditMiddleware struct {
	auditLogService *service.AuditLogService
}

func NewAuditMiddleware(auditLogService *service.AuditLogService) *AuditMiddleware {
	return &AuditMiddleware{auditLogService: auditLogService}
}

func (m *AuditMiddleware) Record() gin.HandlerFunc {
	return func(c *gin.Context) {
		if m.auditLogService == nil {
			c.Next()
			return
		}

		c.Next()

		if c.Writer.Status() >= 400 {
			return
		}

		enterpriseID := c.GetString(ContextKeyEnterpriseID)
		userID := c.GetString(ContextKeyUserID)
		if enterpriseID == "" || userID == "" {
			return
		}

		method := c.Request.Method
		path := c.Request.URL.Path

		resourceType, resourceID := parseResource(path)
		action := methodToAction(method)

		m.auditLogService.Create(
			enterpriseID,
			userID,
			action,
			resourceType,
			resourceID,
			fmt.Sprintf("%s %s", method, path),
			c.ClientIP(),
			c.Request.UserAgent(),
		)
	}
}

func parseResource(path string) (resourceType, resourceID string) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 3 {
		return "", ""
	}

	apiParts := parts[2:]
	if len(apiParts) == 0 {
		return "", ""
	}

	if len(apiParts) >= 2 && isUUID(apiParts[len(apiParts)-1]) {
		resourceID = apiParts[len(apiParts)-1]
		resourceType = apiParts[len(apiParts)-2]
	} else {
		resourceType = apiParts[len(apiParts)-1]
	}

	if strings.HasSuffix(resourceType, "s") || strings.HasSuffix(resourceType, "logs") {
	}

	return resourceType, resourceID
}

func isUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, c := range s {
		if i == 8 || i == 13 || i == 18 || i == 23 {
			if c != '-' {
				return false
			}
		} else if (c < '0' || c > '9') && (c < 'a' || c > 'f') && (c < 'A' || c > 'F') {
			return false
		}
	}
	return true
}

func methodToAction(method string) string {
	switch method {
	case "GET":
		return "read"
	case "POST":
		return "create"
	case "PUT":
		return "update"
	case "PATCH":
		return "update"
	case "DELETE":
		return "delete"
	default:
		return strings.ToLower(method)
	}
}
