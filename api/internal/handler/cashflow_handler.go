package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type CashFlowHandler struct{ svc *service.CashFlowService }

func NewCashFlowHandler(svc *service.CashFlowService) *CashFlowHandler {
	return &CashFlowHandler{svc}
}

func (h *CashFlowHandler) Forecast(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	months, _ := strconv.Atoi(c.DefaultQuery("months", "3"))
	report, appErr := h.svc.Forecast(eid, months)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, report)
}
