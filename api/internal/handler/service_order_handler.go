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

type ServiceOrderHandler struct{ svc *service.ServiceOrderService }

func NewServiceOrderHandler(svc *service.ServiceOrderService) *ServiceOrderHandler {
	return &ServiceOrderHandler{svc}
}

// svcFor returns a ServiceOrderService bound to the request's tenant database.
func (h *ServiceOrderHandler) svcFor(c *gin.Context) *service.ServiceOrderService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewServiceOrderService(repository.NewServiceOrderRepository(db))
	}
	return h.svc
}

type soCreateReq struct {
	CustomerID  string  `json:"customer_id"`
	ContractID  string  `json:"contract_id"`
	OrderType   string  `json:"order_type"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
}

type svcStatusReq struct {
	Status string `json:"status"`
}

func (h *ServiceOrderHandler) Create(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req soCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	so, appErr := h.svcFor(c).Create(eid, req.CustomerID, req.OrderType, req.Description, req.ContractID, req.Amount)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, so)
}

func (h *ServiceOrderHandler) Get(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	so, appErr := h.svcFor(c).Get(eid, c.Param("service_order_id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, so)
}

func (h *ServiceOrderHandler) Delete(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	if appErr := h.svcFor(c).Delete(eid, c.Param("service_order_id")); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.NoContent(c)
}

func (h *ServiceOrderHandler) ChangeStatus(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req svcStatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	so, appErr := h.svcFor(c).ChangeStatus(eid, c.Param("service_order_id"), req.Status)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, so)
}

func (h *ServiceOrderHandler) Quote(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req struct {
		Amount float64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	so, appErr := h.svcFor(c).Quote(eid, c.Param("service_order_id"), req.Amount)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, so)
}

func (h *ServiceOrderHandler) List(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	sos, total, appErr := h.svcFor(c).List(eid, c.Query("order_type"), c.Query("status"), p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, sos, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *ServiceOrderHandler) Sign(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	so, appErr := h.svcFor(c).Sign(eid, c.Param("service_order_id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, so)
}

func (h *ServiceOrderHandler) UploadAttachment(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.ValidationError(c, "file", "请选择文件")
		return
	}
	defer file.Close()

	meta, appErr := h.svcFor(c).UploadAttachment(eid, c.Param("service_order_id"), header.Filename, header.Header.Get("Content-Type"), file, header.Size)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, meta)
}

func (h *ServiceOrderHandler) ListAttachments(c *gin.Context) {
	files, appErr := h.svcFor(c).ListAttachments(c.Param("service_order_id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, files)
}
