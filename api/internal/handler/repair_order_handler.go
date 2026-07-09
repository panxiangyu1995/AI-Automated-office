package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type RepairOrderHandler struct{ svc *service.RepairOrderService }

func NewRepairOrderHandler(svc *service.RepairOrderService) *RepairOrderHandler {
	return &RepairOrderHandler{svc}
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
	eid := c.Param("enterprise_id")
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
	r, appErr := h.svc.Create(eid, serviceOrderID, req.FaultPoint, req.RepairContent)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, r)
}

func (h *RepairOrderHandler) Get(c *gin.Context) {
	r, appErr := h.svc.GetByServiceOrder(c.Param("service_order_id"))
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
	r, appErr := h.svc.Update(c.Param("id"), input)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, r)
}
