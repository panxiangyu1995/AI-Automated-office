package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/response"
)

type SummaryHandler struct {
	summaryService *service.SummaryService
}

func NewSummaryHandler(summaryService *service.SummaryService) *SummaryHandler {
	return &SummaryHandler{summaryService: summaryService}
}

func (h *SummaryHandler) GroupSummary(c *gin.Context) {
	groupID := c.Param("group_id")
	if groupID == "" {
		response.ValidationError(c, "group_id", "集团ID不能为空")
		return
	}

	summary, appErr := h.summaryService.GetGroupSummary(groupID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, summary)
}
