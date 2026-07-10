package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type InventoryHandler struct{ svc *service.InventoryService }
func NewInventoryHandler(svc *service.InventoryService) *InventoryHandler { return &InventoryHandler{svc} }

type setInvReq struct {
	WarehouseID string `json:"warehouse_id"`
	MaterialID  string `json:"material_id"`
	Quantity    int    `json:"quantity"`
	SafetyStock int    `json:"safety_stock"`
	InTransit   int    `json:"in_transit"`
}

func (h *InventoryHandler) Set(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req setInvReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	inv, appErr := h.svc.Set(eid, req.WarehouseID, req.MaterialID, req.Quantity, req.SafetyStock, req.InTransit)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, inv)
}

func (h *InventoryHandler) ByWarehouse(c *gin.Context) {
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.QueryByWarehouse(c.Param("warehouse_id"), p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *InventoryHandler) ByMaterial(c *gin.Context) {
	items, appErr := h.svc.QueryByMaterial(c.Param("material_id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, items)
}

func (h *InventoryHandler) LowStock(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.LowStockAlerts(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
