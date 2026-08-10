package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type SupplierHandler struct{ svc *service.SupplierService }
func NewSupplierHandler(svc *service.SupplierService) *SupplierHandler { return &SupplierHandler{svc} }

// svcFor returns a SupplierService bound to the request's tenant database.
func (h *SupplierHandler) svcFor(c *gin.Context) *service.SupplierService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewSupplierService(repository.NewSupplierRepository(db))
	}
	return h.svc
}

type supReq struct {
	Name         string `json:"name"`
	ContactName  string `json:"contact_name"`
	ContactPhone string `json:"contact_phone"`
	ContactEmail string `json:"contact_email"`
	Address      string `json:"address"`
}

func (h *SupplierHandler) Create(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req supReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	item, appErr := h.svcFor(c).Create(eid, req.Name, req.ContactName, req.ContactPhone, req.ContactEmail, req.Address)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, item)
}

func (h *SupplierHandler) Update(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req supReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	item, appErr := h.svcFor(c).Update(eid, c.Param("id"), req.Name, req.ContactName, req.ContactPhone, req.ContactEmail, req.Address, c.Query("status"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, item)
}

func (h *SupplierHandler) Delete(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	if appErr := h.svcFor(c).Delete(eid, c.Param("id")); appErr != nil { response.Error(c, appErr); return }
	response.NoContent(c)
}

func (h *SupplierHandler) Get(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	item, appErr := h.svcFor(c).Get(eid, c.Param("id")); if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, item)
}

func (h *SupplierHandler) List(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).List(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
