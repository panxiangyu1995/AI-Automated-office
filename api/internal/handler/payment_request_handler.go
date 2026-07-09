package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type PaymentRequestHandler struct{ svc *service.PaymentRequestService }

func NewPaymentRequestHandler(svc *service.PaymentRequestService) *PaymentRequestHandler {
	return &PaymentRequestHandler{svc}
}

type prCreateReq struct {
	CustomerID   string  `json:"customer_id" binding:"required"`
	ContractID   *string `json:"contract_id"`
	SalesOrderID *string `json:"sales_order_id"`
	Amount       float64 `json:"amount" binding:"required"`
	Notes        string  `json:"notes"`
}

type prUpdateReq struct {
	CustomerID   *string  `json:"customer_id"`
	ContractID   *string  `json:"contract_id"`
	SalesOrderID *string  `json:"sales_order_id"`
	Amount       *float64 `json:"amount"`
	Notes        *string  `json:"notes"`
}

type prApproveReq struct {
	Comment string `json:"comment"`
}

type prRejectReq struct {
	Reason string `json:"reason" binding:"required"`
}

func (h *PaymentRequestHandler) Create(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req prCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	r, appErr := h.svc.Create(eid, req.CustomerID, req.ContractID, req.SalesOrderID, req.Amount, req.Notes)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, r)
}

func (h *PaymentRequestHandler) List(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	items, total, appErr := h.svc.List(eid, p, ps, status)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *PaymentRequestHandler) Get(c *gin.Context) {
	r, appErr := h.svc.Get(c.Param("id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, r)
}

func (h *PaymentRequestHandler) Update(c *gin.Context) {
	var req prUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	input := make(map[string]interface{})
	if req.CustomerID != nil {
		input["customer_id"] = *req.CustomerID
	}
	if req.ContractID != nil {
		input["contract_id"] = *req.ContractID
	}
	if req.SalesOrderID != nil {
		input["sales_order_id"] = *req.SalesOrderID
	}
	if req.Amount != nil {
		input["amount"] = *req.Amount
	}
	if req.Notes != nil {
		input["notes"] = *req.Notes
	}
	r, appErr := h.svc.Update(c.Param("id"), input)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, r)
}

func (h *PaymentRequestHandler) Delete(c *gin.Context) {
	if appErr := h.svc.Delete(c.Param("id")); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *PaymentRequestHandler) SubmitForApproval(c *gin.Context) {
	if appErr := h.svc.SubmitForApproval(c.Param("id")); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *PaymentRequestHandler) Approve(c *gin.Context) {
	userID := c.GetString("user_id")
	if appErr := h.svc.Approve(c.Param("id"), userID); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *PaymentRequestHandler) Reject(c *gin.Context) {
	var req prRejectReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	userID := c.GetString("user_id")
	if appErr := h.svc.Reject(c.Param("id"), userID, req.Reason); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}
