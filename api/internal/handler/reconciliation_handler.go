package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type ReconciliationHandler struct{ svc *service.ReconciliationService }

func NewReconciliationHandler(svc *service.ReconciliationService) *ReconciliationHandler {
	return &ReconciliationHandler{svc}
}

func (h *ReconciliationHandler) GetReconciliation(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	customerID := c.Query("customer_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	if customerID == "" || startDate == "" || endDate == "" {
		response.ValidationError(c, "query", "customer_id, start_date, end_date 均为必填")
		return
	}
	report, appErr := h.svc.GetReconciliation(eid, customerID, startDate, endDate)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, report)
}
