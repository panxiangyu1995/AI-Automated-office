package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type CollectionHandler struct{ svc *service.CollectionService }

func NewCollectionHandler(svc *service.CollectionService) *CollectionHandler {
	return &CollectionHandler{svc}
}

// svcFor returns a CollectionService bound to the request's tenant database.
func (h *CollectionHandler) svcFor(c *gin.Context) *service.CollectionService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewCollectionService(repository.NewCollectionRepository(db))
	}
	return h.svc
}

type colCreateReq struct {
	InvoiceID        *string `json:"invoice_id"`
	Amount           float64 `json:"amount" binding:"required"`
	CollectionMethod string  `json:"collection_method"`
	CollectedAt      string  `json:"collected_at"`
	Notes            string  `json:"notes"`
}

func (h *CollectionHandler) Create(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req colCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	if req.CollectionMethod == "" {
		req.CollectionMethod = "bank_transfer"
	}
	r, appErr := h.svcFor(c).Create(eid, req.InvoiceID, req.Amount, req.CollectionMethod, req.CollectedAt, req.Notes)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, r)
}

func (h *CollectionHandler) List(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).List(eid, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *CollectionHandler) Get(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	r, appErr := h.svcFor(c).Get(c.Param("id"), eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, r)
}
