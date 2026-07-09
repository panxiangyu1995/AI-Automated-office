package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type SupplierHandler struct{ svc *service.SupplierService }
func NewSupplierHandler(svc *service.SupplierService) *SupplierHandler { return &SupplierHandler{svc} }

type supReq struct {
	Name         string `json:"name"`
	ContactName  string `json:"contact_name"`
	ContactPhone string `json:"contact_phone"`
	ContactEmail string `json:"contact_email"`
	Address      string `json:"address"`
}

func (h *SupplierHandler) Create(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req supReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	item, appErr := h.svc.Create(eid, req.Name, req.ContactName, req.ContactPhone, req.ContactEmail, req.Address)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, item)
}

func (h *SupplierHandler) Update(c *gin.Context) {
	var req supReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	item, appErr := h.svc.Update(c.Param("id"), req.Name, req.ContactName, req.ContactPhone, req.ContactEmail, req.Address, c.Query("status"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, item)
}

func (h *SupplierHandler) Delete(c *gin.Context) {
	if appErr := h.svc.Delete(c.Param("id")); appErr != nil { response.Error(c, appErr); return }
	response.NoContent(c)
}

func (h *SupplierHandler) Get(c *gin.Context) {
	item, appErr := h.svc.Get(c.Param("id")); if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, item)
}

func (h *SupplierHandler) List(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.List(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
