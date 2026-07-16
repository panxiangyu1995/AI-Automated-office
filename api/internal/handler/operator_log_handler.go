package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type OperatorLogHandler struct {
	logSvc *service.DebugLogService
}

func NewOperatorLogHandler(logSvc *service.DebugLogService) *OperatorLogHandler {
	return &OperatorLogHandler{logSvc: logSvc}
}

func (h *OperatorLogHandler) QueryLogs(c *gin.Context) {
	filter := parseLogFilter(c)
	entries, total, appErr := h.logSvc.QueryLogs(c.Request.Context(), filter)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, entries, &response.MetaInfo{
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalCount: total,
	})
}
