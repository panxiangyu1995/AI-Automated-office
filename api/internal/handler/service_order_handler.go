package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type ServiceOrderHandler struct{ svc *service.ServiceOrderService }
func NewServiceOrderHandler(svc *service.ServiceOrderService) *ServiceOrderHandler { return &ServiceOrderHandler{svc} }

type soCreateReq struct {
	CustomerID string  `json:"customer_id"`
	ContractID string  `json:"contract_id"`
	OrderType  string  `json:"order_type"`
	Description string `json:"description"`
	Amount     float64 `json:"amount"`
}

type svcStatusReq struct{ Status string `json:"status"` }

func (h *ServiceOrderHandler) Create(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req soCreateReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	so, appErr := h.svc.Create(eid, req.CustomerID, req.OrderType, req.Description, req.ContractID, req.Amount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, so)
}

func (h *ServiceOrderHandler) Get(c *gin.Context) {
	so, appErr := h.svc.Get(c.Param("id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, so)
}

func (h *ServiceOrderHandler) Delete(c *gin.Context) {
	if appErr := h.svc.Delete(c.Param("id")); appErr != nil { response.Error(c, appErr); return }
	response.NoContent(c)
}

func (h *ServiceOrderHandler) ChangeStatus(c *gin.Context) {
	var req svcStatusReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	so, appErr := h.svc.ChangeStatus(c.Param("id"), req.Status)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, so)
}

func (h *ServiceOrderHandler) Quote(c *gin.Context) {
	var req struct{ Amount float64 `json:"amount"` }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	so, appErr := h.svc.Quote(c.Param("id"), req.Amount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, so)
}

func (h *ServiceOrderHandler) List(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	sos, total, appErr := h.svc.List(eid, c.Query("order_type"), c.Query("status"), p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, sos, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
