package middleware

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
)

type AuditMiddleware struct {
	auditLogService *service.AuditLogService
	undoService     *service.UndoService
	undoRepo        repository.UndoRepository
}

func NewAuditMiddleware(auditLogService *service.AuditLogService) *AuditMiddleware {
	return &AuditMiddleware{auditLogService: auditLogService}
}

func NewAuditMiddlewareWithUndo(auditLogService *service.AuditLogService, undoService *service.UndoService, undoRepo repository.UndoRepository) *AuditMiddleware {
	return &AuditMiddleware{
		auditLogService: auditLogService,
		undoService:     undoService,
		undoRepo:        undoRepo,
	}
}

func (m *AuditMiddleware) Record() gin.HandlerFunc {
	return func(c *gin.Context) {
		if m.auditLogService == nil {
			c.Next()
			return
		}

		var beforeState string
		if m.undoService != nil && m.undoRepo != nil {
			method := c.Request.Method
			if method == "PUT" || method == "PATCH" || method == "DELETE" {
				beforeState = captureBeforeState(c, m.undoRepo)
			}
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

		details := fmt.Sprintf("%s %s", method, path)

		m.auditLogService.Create(
			enterpriseID,
			userID,
			action,
			resourceType,
			resourceID,
			details,
			c.ClientIP(),
			c.Request.UserAgent(),
		)

		if m.undoService != nil && beforeState != "" && resourceID != "" && (method == "PUT" || method == "PATCH") {
			m.undoService.RecordOperation(userID, resourceType, resourceID, action, beforeState)
		}
	}
}

func captureBeforeState(c *gin.Context, undoRepo repository.UndoRepository) string {
	path := c.Request.URL.Path
	resourceType, resourceID := parseResource(path)
	if resourceType == "" || resourceID == "" {
		return ""
	}

	result, err := undoRepo.FindBeforeState(resourceType, resourceID)
	if err != nil {
		return ""
	}

	data, err := json.Marshal(result)
	if err != nil {
		return ""
	}
	return string(data)
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
