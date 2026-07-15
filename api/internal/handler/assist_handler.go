package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type AssistHandler struct {
	assistService *service.AssistService
}

func NewAssistHandler(assistService *service.AssistService) *AssistHandler {
	return &AssistHandler{assistService: assistService}
}

func (h *AssistHandler) TodoAggregation(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, err := uuid.Parse(entIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userID := middleware.GetUserID(c)
	if userID == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	todo, svcErr := h.assistService.GetTodoAggregation(entID, userID)
	if svcErr != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail("查询待办聚合失败"))
		return
	}
	response.Success(c, todo)
}

func (h *AssistHandler) ProcessGuide(c *gin.Context) {
	processType := c.Query("process_type")
	if processType == "" {
		response.ValidationError(c, "process_type", "流程类型不能为空")
		return
	}

	guide, svcErr := h.assistService.GetProcessGuide(processType)
	if svcErr != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail("查询流程指南失败"))
		return
	}
	if guide == nil {
		response.Error(c, apperrors.ErrNotFound.WithDetail("未找到该流程类型的指南"))
		return
	}
	response.Success(c, guide)
}

func (h *AssistHandler) WorkReport(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, err := uuid.Parse(entIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userID := middleware.GetUserID(c)
	if userID == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	startDateStr := c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		response.ValidationError(c, "start_date", "开始日期格式错误，应为YYYY-MM-DD")
		return
	}
	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		response.ValidationError(c, "end_date", "结束日期格式错误，应为YYYY-MM-DD")
		return
	}
	endDate = endDate.Add(24*time.Hour - time.Second)

	report, svcErr := h.assistService.GenerateWorkReport(entID, userID, startDate, endDate)
	if svcErr != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail("生成工作报告失败"))
		return
	}
	response.Success(c, report)
}
