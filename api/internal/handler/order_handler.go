package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type OrderHandler struct{ svc *service.OrderService }
func NewOrderHandler(svc *service.OrderService) *OrderHandler { return &OrderHandler{svc} }

type poReq struct {
	SupplierID string                `json:"supplier_id"`
	Notes      string                `json:"notes"`
	Items      []service.OrderItemInput `json:"items"`
}

type soReq struct {
	CustomerID string                `json:"customer_id"`
	Notes      string                `json:"notes"`
	Items      []service.OrderItemInput `json:"items"`
}

type transferReq struct{ SourceWhID, TargetWhID, MaterialID string; Quantity int }
type reqReq struct{ ApplicantID, WarehouseID, MaterialID string; Quantity int; Notes string }

func (h *OrderHandler) CreatePurchaseOrder(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req poReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	order, appErr := h.svc.CreatePurchaseOrder(eid, req.SupplierID, req.Notes, req.Items)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, order)
}

func (h *OrderHandler) ReceivePurchase(c *gin.Context) {
	poID := c.Param("id"); whID := c.Query("warehouse_id")
	if poID == "" || whID == "" { response.ValidationError(c, "id/warehouse_id", "参数不完整"); return }
	order, appErr := h.svc.ReceivePurchase(poID, whID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, order)
}

func (h *OrderHandler) CreateSalesOrder(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req soReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	order, appErr := h.svc.CreateSalesOrder(eid, req.CustomerID, req.Notes, req.Items)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, order)
}

func (h *OrderHandler) ShipSalesOrder(c *gin.Context) {
	soID := c.Param("id"); whID := c.Query("warehouse_id")
	if soID == "" || whID == "" { response.ValidationError(c, "id/warehouse_id", "参数不完整"); return }
	order, appErr := h.svc.ShipSalesOrder(soID, whID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, order)
}

func (h *OrderHandler) CreateTransfer(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req transferReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	order, appErr := h.svc.CreateTransfer(eid, req.SourceWhID, req.TargetWhID, req.MaterialID, req.Quantity)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, order)
}

func (h *OrderHandler) ExecuteTransfer(c *gin.Context) {
	order, appErr := h.svc.ExecuteTransfer(c.Param("id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, order)
}

func (h *OrderHandler) CreateRequisition(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req reqReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	order, appErr := h.svc.CreateRequisition(eid, req.ApplicantID, req.WarehouseID, req.MaterialID, req.Quantity, req.Notes)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, order)
}

func (h *OrderHandler) IssueRequisition(c *gin.Context) {
	issuedQty, _ := strconv.Atoi(c.DefaultQuery("issued_qty", "0"))
	order, appErr := h.svc.IssueRequisition(c.Param("id"), issuedQty)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, order)
}

func (h *OrderHandler) ListOrders(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	orders, total, appErr := h.svc.ListOrders(eid, c.Query("type"), p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, orders, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

type soStatusReq struct{ Status string `json:"status"` }

func (h *OrderHandler) ChangeSalesOrderStatus(c *gin.Context) {
	var req soStatusReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	order, appErr := h.svc.ChangeSalesOrderStatus(c.Param("id"), req.Status)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, order)
}

func (h *OrderHandler) ListStockFlows(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	flows, total, appErr := h.svc.ListStockFlows(eid, c.Query("warehouse_id"), c.Query("material_id"), p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, flows, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
