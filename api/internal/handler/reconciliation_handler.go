package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type ReconciliationHandler struct {
	svc *service.ReconciliationService
}

func NewReconciliationHandler(svc *service.ReconciliationService) *ReconciliationHandler {
	return &ReconciliationHandler{svc}
}

// svcFor returns a ReconciliationService bound to the request's tenant database.
func (h *ReconciliationHandler) svcFor(c *gin.Context) *service.ReconciliationService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewReconciliationService(repository.NewReconciliationRepository(db))
	}
	return h.svc
}

func (h *ReconciliationHandler) GetReconciliation(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
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
	report, appErr := h.svcFor(c).GetReconciliation(eid, customerID, startDate, endDate)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, report)
}
