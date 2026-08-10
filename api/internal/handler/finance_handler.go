package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type FinanceHandler struct{ svc *service.FinanceService }
func NewFinanceHandler(svc *service.FinanceService) *FinanceHandler { return &FinanceHandler{svc} }

// svcFor returns a FinanceService bound to the request's tenant database.
func (h *FinanceHandler) svcFor(c *gin.Context) *service.FinanceService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewFinanceService(repository.NewFinanceRepository(db))
	}
	return h.svc
}

type payReq struct {
	CustomerID    string  `json:"customer_id"`
	ContractID    string  `json:"contract_id"`
	PaymentMethod string  `json:"payment_method"`
	Notes         string  `json:"notes"`
	Amount        float64 `json:"amount"`
}
type expReq struct {
	Category     string  `json:"category"`
	Description  string  `json:"description"`
	SubmittedBy  string  `json:"submitted_by"`
	Amount       float64 `json:"amount"`
	InvoiceType  string  `json:"invoice_type"`
}
type recvReq struct {
	CustomerID    string  `json:"customer_id" binding:"required"`
	SalesOrderID  *string `json:"sales_order_id"`
	ContractID    *string `json:"contract_id"`
	Amount        float64 `json:"amount" binding:"required"`
	DueDate       *string `json:"due_date"`
}
type payblReq struct {
	SupplierID      string  `json:"supplier_id" binding:"required"`
	PurchaseOrderID *string `json:"purchase_order_id"`
	Amount          float64 `json:"amount" binding:"required"`
	DueDate         *string `json:"due_date"`
}
type invReq struct {
	CustomerID  string  `json:"customer_id"`
	Notes       string  `json:"notes"`
	Amount      float64 `json:"amount"`
	TaxAmount   float64 `json:"tax_amount"`
	InvoiceType string  `json:"invoice_type"`
}

func (h *FinanceHandler) CreatePayment(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req payReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	r, appErr := h.svcFor(c).CreatePayment(eid, req.CustomerID, req.ContractID, req.PaymentMethod, req.Notes, req.Amount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ListPayments(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).ListPayments(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *FinanceHandler) CreateExpense(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req expReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	if req.SubmittedBy == "" {
		req.SubmittedBy = middleware.GetUserID(c)
	}
	r, appErr := h.svcFor(c).CreateExpense(eid, req.Category, req.Description, req.SubmittedBy, req.Amount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ApproveExpense(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	r, appErr := h.svcFor(c).ApproveExpense(c.Param("id"), eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, r)
}

func (h *FinanceHandler) ListExpenses(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).ListExpenses(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *FinanceHandler) CreateInvoice(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req invReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	r, appErr := h.svcFor(c).CreateInvoice(eid, req.CustomerID, req.Notes, req.Amount, req.TaxAmount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ListInvoices(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).ListInvoices(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *FinanceHandler) CreateReceivable(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req recvReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	r, appErr := h.svcFor(c).CreateReceivable(eid, req.CustomerID, req.SalesOrderID, req.ContractID, req.Amount, req.DueDate)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, r)
}

func (h *FinanceHandler) ListReceivables(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	entID, err := uuid.Parse(eid)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "无效")
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).ListReceivables(entID, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *FinanceHandler) CreatePayable(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req payblReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	r, appErr := h.svcFor(c).CreatePayable(eid, req.SupplierID, req.PurchaseOrderID, req.Amount, req.DueDate)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, r)
}

func (h *FinanceHandler) ListPayables(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	entID, err := uuid.Parse(eid)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "无效")
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).ListPayables(entID, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
