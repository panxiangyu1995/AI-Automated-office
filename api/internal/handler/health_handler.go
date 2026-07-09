package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/response"
)

type HealthDashboardHandler struct{ svc *service.HealthService }

func NewHealthDashboardHandler(svc *service.HealthService) *HealthDashboardHandler {
	return &HealthDashboardHandler{svc}
}

func (h *HealthDashboardHandler) GetEnterpriseHealth(c *gin.Context) {
	report, appErr := h.svc.GetEnterpriseHealth(c.Param("id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, report)
}

func (h *HealthDashboardHandler) GetDashboard(c *gin.Context) {
	dashboard, appErr := h.svc.GetDashboard()
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, dashboard)
}
