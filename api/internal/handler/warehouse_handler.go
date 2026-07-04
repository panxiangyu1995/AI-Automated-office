package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type WarehouseHandler struct{ svc *service.WarehouseService }
func NewWarehouseHandler(svc *service.WarehouseService) *WarehouseHandler { return &WarehouseHandler{svc} }

type whReq struct{ Name, Code, Address string }

func (h *WarehouseHandler) Create(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req whReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	item, appErr := h.svc.Create(eid, req.Name, req.Code, req.Address)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, item)
}

func (h *WarehouseHandler) Update(c *gin.Context) {
	var req whReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	item, appErr := h.svc.Update(c.Param("id"), req.Name, req.Code, req.Address, c.Query("status"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, item)
}

func (h *WarehouseHandler) Delete(c *gin.Context) {
	if appErr := h.svc.Delete(c.Param("id")); appErr != nil { response.Error(c, appErr); return }
	response.NoContent(c)
}

func (h *WarehouseHandler) Get(c *gin.Context) {
	item, appErr := h.svc.Get(c.Param("id")); if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, item)
}

func (h *WarehouseHandler) List(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.List(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
