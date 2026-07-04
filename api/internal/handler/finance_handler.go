package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type FinanceHandler struct{ svc *service.FinanceService }
func NewFinanceHandler(svc *service.FinanceService) *FinanceHandler { return &FinanceHandler{svc} }

type payReq struct{ CustomerID, ContractID, PaymentMethod, Notes string; Amount float64 }
type expReq struct{ Category, Description, SubmittedBy string; Amount float64 }
type invReq struct{ CustomerID, Notes string; Amount, TaxAmount float64 }

func (h *FinanceHandler) CreatePayment(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req payReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	r, appErr := h.svc.CreatePayment(eid, req.CustomerID, req.ContractID, req.PaymentMethod, req.Notes, req.Amount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ListPayments(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.ListPayments(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *FinanceHandler) CreateExpense(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req expReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	r, appErr := h.svc.CreateExpense(eid, req.Category, req.Description, req.SubmittedBy, req.Amount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ApproveExpense(c *gin.Context) {
	r, appErr := h.svc.ApproveExpense(c.Param("id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, r)
}

func (h *FinanceHandler) ListExpenses(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.ListExpenses(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *FinanceHandler) CreateInvoice(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req invReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	r, appErr := h.svc.CreateInvoice(eid, req.CustomerID, req.Notes, req.Amount, req.TaxAmount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ListInvoices(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.ListInvoices(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
