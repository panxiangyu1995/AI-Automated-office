package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type AuditLogHandler struct {
	auditLogService *service.AuditLogService
}

func NewAuditLogHandler(auditLogService *service.AuditLogService) *AuditLogHandler {
	return &AuditLogHandler{auditLogService: auditLogService}
}

func (h *AuditLogHandler) List(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	query := model.AuditLogQuery{
		EnterpriseID: enterpriseID,
		UserID:       c.Query("user_id"),
		Action:       c.Query("action"),
		ResourceType: c.Query("resource_type"),
		StartTime:    c.Query("start_time"),
		EndTime:      c.Query("end_time"),
		Page:         page,
		PageSize:     pageSize,
	}

	logs, total, appErr := h.auditLogService.Query(query)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.SuccessWithMeta(c, logs, &response.MetaInfo{
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	})
}
