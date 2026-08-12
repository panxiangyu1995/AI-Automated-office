package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type PaymentPlanHandler struct{ svc *service.PaymentPlanService }

func NewPaymentPlanHandler(svc *service.PaymentPlanService) *PaymentPlanHandler {
	return &PaymentPlanHandler{svc}
}

// svcFor returns a PaymentPlanService bound to the request's tenant database.
func (h *PaymentPlanHandler) svcFor(c *gin.Context) *service.PaymentPlanService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewPaymentPlanService(repository.NewPaymentPlanRepository(db))
	}
	return h.svc
}

type ppCreateBatchReq struct {
	Plans []service.PaymentPlanItem `json:"plans" binding:"required"`
}

type ppUpdateReq struct {
	DueDate *string  `json:"due_date"`
	Amount  *float64 `json:"amount"`
	Status  *string  `json:"status"`
	Notes   *string  `json:"notes"`
}

func (h *PaymentPlanHandler) CreateBatch(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	contractID := c.Param("contract_id")
	var req ppCreateBatchReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	plans, appErr := h.svcFor(c).CreateBatch(eid, contractID, req.Plans)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, plans)
}

func (h *PaymentPlanHandler) List(c *gin.Context) {
	plans, appErr := h.svcFor(c).List(c.Param("contract_id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, plans)
}

func (h *PaymentPlanHandler) Update(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req ppUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	input := make(map[string]interface{})
	if req.DueDate != nil {
		input["due_date"] = *req.DueDate
	}
	if req.Amount != nil {
		input["amount"] = *req.Amount
	}
	if req.Status != nil {
		input["status"] = *req.Status
	}
	if req.Notes != nil {
		input["notes"] = *req.Notes
	}
	plan, appErr := h.svcFor(c).Update(c.Param("id"), eid, input)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, plan)
}

func (h *PaymentPlanHandler) Delete(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	if appErr := h.svcFor(c).Delete(c.Param("id"), eid); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *PaymentPlanHandler) ListOverdue(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	plans, appErr := h.svcFor(c).ListOverdue(eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, plans)
}
