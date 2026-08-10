package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type RepairOrderHandler struct{ svc *service.RepairOrderService }

func NewRepairOrderHandler(svc *service.RepairOrderService) *RepairOrderHandler {
	return &RepairOrderHandler{svc}
}

// svcFor returns a RepairOrderService bound to the request's tenant database.
func (h *RepairOrderHandler) svcFor(c *gin.Context) *service.RepairOrderService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewRepairOrderService(repository.NewRepairOrderRepository(db))
	}
	return h.svc
}

type roCreateReq struct {
	FaultPoint    string `json:"fault_point" binding:"required"`
	RepairContent string `json:"repair_content"`
}

type roUpdateReq struct {
	FaultPoint    *string `json:"fault_point"`
	RepairContent *string `json:"repair_content"`
	TechnicianID  *string `json:"technician_id"`
	Status        *string `json:"status"`
	Notes         *string `json:"notes"`
}

func (h *RepairOrderHandler) Create(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	serviceOrderID := c.Param("service_order_id")
	var req roCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	r, appErr := h.svcFor(c).Create(eid, serviceOrderID, req.FaultPoint, req.RepairContent)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, r)
}

func (h *RepairOrderHandler) Get(c *gin.Context) {
	r, appErr := h.svcFor(c).GetByServiceOrder(c.Param("service_order_id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, r)
}

func (h *RepairOrderHandler) Update(c *gin.Context) {
	var req roUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	input := make(map[string]interface{})
	if req.FaultPoint != nil {
		input["fault_point"] = *req.FaultPoint
	}
	if req.RepairContent != nil {
		input["repair_content"] = *req.RepairContent
	}
	if req.TechnicianID != nil {
		input["technician_id"] = *req.TechnicianID
	}
	if req.Status != nil {
		input["status"] = *req.Status
	}
	if req.Notes != nil {
		input["notes"] = *req.Notes
	}
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	r, appErr := h.svcFor(c).Update(c.Param("id"), eid, input)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, r)
}
