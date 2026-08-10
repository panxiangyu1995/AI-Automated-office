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

type WarehouseHandler struct{ svc *service.WarehouseService }
func NewWarehouseHandler(svc *service.WarehouseService) *WarehouseHandler { return &WarehouseHandler{svc} }

// svcFor returns a WarehouseService bound to the request's tenant database.
func (h *WarehouseHandler) svcFor(c *gin.Context) *service.WarehouseService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewWarehouseService(repository.NewWarehouseRepository(db))
	}
	return h.svc
}

type whReq struct {
	Name    string `json:"name"`
	Code    string `json:"code"`
	Address string `json:"address"`
}

func (h *WarehouseHandler) Create(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req whReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	item, appErr := h.svcFor(c).Create(eid, req.Name, req.Code, req.Address)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, item)
}

func (h *WarehouseHandler) Update(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req whReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	item, appErr := h.svcFor(c).Update(eid, c.Param("id"), req.Name, req.Code, req.Address, c.Query("status"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, item)
}

func (h *WarehouseHandler) Delete(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	if appErr := h.svcFor(c).Delete(eid, c.Param("id")); appErr != nil { response.Error(c, appErr); return }
	response.NoContent(c)
}

func (h *WarehouseHandler) Get(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	item, appErr := h.svcFor(c).Get(eid, c.Param("id")); if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, item)
}

func (h *WarehouseHandler) List(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).List(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
