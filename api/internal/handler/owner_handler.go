package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type OwnerHandler struct{ svc *service.OwnerService }

func NewOwnerHandler(svc *service.OwnerService) *OwnerHandler {
	return &OwnerHandler{svc}
}

// svcFor returns a OwnerService bound to the request's tenant database.
func (h *OwnerHandler) svcFor(c *gin.Context) *service.OwnerService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewOwnerService(repository.NewOwnerRepository(db))
	}
	return h.svc
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
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	report, appErr := h.svcFor(c).GetSignals(eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, report)
}

func (h *OwnerHandler) KPI(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	period := c.DefaultQuery("period", "month")
	report, appErr := h.svcFor(c).GetKPI(eid, period)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, report)
}

func (h *OwnerHandler) CreateAlertRule(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req arCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	rule, appErr := h.svcFor(c).CreateAlertRule(eid, req.Dimension, req.Metric, req.Operator, req.Threshold)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, rule)
}

func (h *OwnerHandler) UpdateAlertRule(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
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
	rule, appErr := h.svcFor(c).UpdateAlertRule(c.Param("id"), eid, input)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, rule)
}

func (h *OwnerHandler) ListAlertRules(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	rules, appErr := h.svcFor(c).ListAlertRules(eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, rules)
}
