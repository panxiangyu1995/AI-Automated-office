package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type OwnerHandler struct{ svc *service.OwnerService }

func NewOwnerHandler(svc *service.OwnerService) *OwnerHandler {
	return &OwnerHandler{svc}
}

type arCreateReq struct {
	Dimension string  `json:"dimension" binding:"required"`
	Metric    string  `json:"metric" binding:"required"`
	Operator  string  `json:"operator" binding:"required"`
	Threshold float64 `json:"threshold" binding:"required"`
}

type arUpdateReq struct {
	Dimension *string  `json:"dimension"`
	Metric    *string  `json:"metric"`
	Operator  *string  `json:"operator"`
	Threshold *float64 `json:"threshold"`
	Enabled   *bool    `json:"enabled"`
}

func (h *OwnerHandler) Signals(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	report, appErr := h.svc.GetSignals(eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, report)
}

func (h *OwnerHandler) KPI(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	period := c.DefaultQuery("period", "month")
	report, appErr := h.svc.GetKPI(eid, period)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, report)
}

func (h *OwnerHandler) CreateAlertRule(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req arCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	rule, appErr := h.svc.CreateAlertRule(eid, req.Dimension, req.Metric, req.Operator, req.Threshold)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, rule)
}

func (h *OwnerHandler) UpdateAlertRule(c *gin.Context) {
	var req arUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	input := make(map[string]interface{})
	if req.Dimension != nil {
		input["dimension"] = *req.Dimension
	}
	if req.Metric != nil {
		input["metric"] = *req.Metric
	}
	if req.Operator != nil {
		input["operator"] = *req.Operator
	}
	if req.Threshold != nil {
		input["threshold"] = *req.Threshold
	}
	if req.Enabled != nil {
		input["enabled"] = *req.Enabled
	}
	rule, appErr := h.svc.UpdateAlertRule(c.Param("id"), input)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, rule)
}

func (h *OwnerHandler) ListAlertRules(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	rules, appErr := h.svc.ListAlertRules(eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, rules)
}
