package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type OrderHandler struct {
	svc            *service.OrderService
	contractSvc    *service.ContractService
	autoArchiveSvc *service.AutoArchiveService
}
func NewOrderHandler(svc *service.OrderService, contractSvc *service.ContractService, autoArchiveSvc *service.AutoArchiveService) *OrderHandler {
	return &OrderHandler{svc, contractSvc, autoArchiveSvc}
}

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

type transferReq struct {
	SourceWhID string `json:"source_wh_id"`
	TargetWhID string `json:"target_wh_id"`
	MaterialID string `json:"material_id"`
	Quantity   int    `json:"quantity"`
}
type reqReq struct {
	ApplicantID string `json:"applicant_id"`
	WarehouseID string `json:"warehouse_id"`
	MaterialID  string `json:"material_id"`
	Quantity    int    `json:"quantity"`
	Notes       string `json:"notes"`
}

func (h *OrderHandler) CreatePurchaseOrder(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req poReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	order, appErr := h.svc.CreatePurchaseOrder(eid, req.SupplierID, req.Notes, req.Items)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, order)
}

func (h *OrderHandler) ReceivePurchase(c *gin.Context) {
	poID := c.Param("id")
	whID := c.Query("warehouse_id")
	requireInspection := c.Query("require_inspection") == "true"
	if whID == "" {
		var body struct {
			WarehouseID        string `json:"warehouse_id"`
			RequireInspection  *bool  `json:"require_inspection"`
		}
		if err := c.ShouldBindJSON(&body); err == nil {
			whID = body.WarehouseID
			if body.RequireInspection != nil && *body.RequireInspection {
				requireInspection = true
			}
		}
	}
	if poID == "" || whID == "" { response.ValidationError(c, "id/warehouse_id", "参数不完整"); return }
	order, appErr := h.svc.ReceivePurchase(poID, whID, requireInspection)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, order)
}

func (h *OrderHandler) CreateSalesOrder(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req soReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	order, appErr := h.svc.CreateSalesOrder(eid, req.CustomerID, req.Notes, req.Items)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, order)
}

func (h *OrderHandler) ShipSalesOrder(c *gin.Context) {
	soID := c.Param("id")
	whID := c.Query("warehouse_id")
	if whID == "" {
		var body struct{ WarehouseID string `json:"warehouse_id"` }
		if err := c.ShouldBindJSON(&body); err == nil { whID = body.WarehouseID }
	}
	if soID == "" || whID == "" { response.ValidationError(c, "id/warehouse_id", "参数不完整"); return }
	order, appErr := h.svc.ShipSalesOrder(soID, whID)
	if appErr != nil { response.Error(c, appErr); return }
	if h.autoArchiveSvc != nil {
		eid := middleware.GetEnterpriseID(c)
		go h.autoArchiveSvc.OnBusinessEvent("sales_completed", soID, eid)
	}
	response.Success(c, order)
}

func (h *OrderHandler) CreateTransfer(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
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
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
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
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	orders, total, appErr := h.svc.ListOrders(eid, c.Query("type"), p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, orders, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

type soStatusReq struct{ Status string `json:"status"` }

func (h *OrderHandler) BindContract(c *gin.Context) {
	soID := c.Param("id")
	var req struct{ ContractID string `json:"contract_id"` }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	if req.ContractID == "" { response.ValidationError(c, "contract_id", "不能为空"); return }
	eid := middleware.GetEnterpriseID(c)
	ref, appErr := h.contractSvc.LinkDocument(eid, req.ContractID, "sales_order", soID, "")
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, ref)
}

func (h *OrderHandler) Delivery(c *gin.Context) {
	whID := c.Query("warehouse_id")
	if whID == "" { response.ValidationError(c, "warehouse_id", "不能为空"); return }
	order, appErr := h.svc.ShipSalesOrder(c.Param("id"), whID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, order)
}

func (h *OrderHandler) ChangeSalesOrderStatus(c *gin.Context) {
	var req soStatusReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	order, appErr := h.svc.ChangeSalesOrderStatus(c.Param("id"), req.Status)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, order)
}

func (h *OrderHandler) ListStockFlows(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	flows, total, appErr := h.svc.ListStockFlows(eid, c.Query("warehouse_id"), c.Query("material_id"), p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, flows, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
