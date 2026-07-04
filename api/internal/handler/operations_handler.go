package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type OperationsHandler struct{ svc *service.OperationsService; platformSvc *service.PlatformService }
func NewOperationsHandler(svc *service.OperationsService, platformSvc *service.PlatformService) *OperationsHandler { return &OperationsHandler{svc, platformSvc} }

func (h *OperationsHandler) Dashboard(c *gin.Context) { response.Success(c, gin.H{"status": "ok", "version": "1.0.0"}) }

func (h *OperationsHandler) CreatePlan(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Name, Description, Features string; Price float64; MaxUsers int; MaxStorage int64 }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	p, appErr := h.svc.CreatePlan(eid, req.Name, req.Description, req.Features, req.Price, req.MaxUsers, req.MaxStorage)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, p)
}

func (h *OperationsHandler) ListPlans(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	plans, appErr := h.svc.ListPlans(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, plans)
}

func (h *OperationsHandler) CreateSubscription(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ PlanID string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	sub, appErr := h.svc.CreateSubscription(eid, req.PlanID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, sub)
}

func (h *OperationsHandler) ListSubscriptions(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	subs, appErr := h.svc.ListSubscriptions(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, subs)
}

func (h *OperationsHandler) CreateSkill(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Name, Description, Parameters, APIEndpoint, Module string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	sk, appErr := h.svc.CreateSkill(eid, req.Name, req.Description, req.Parameters, req.APIEndpoint, req.Module)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, sk)
}

func (h *OperationsHandler) ListSkills(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	skills, appErr := h.svc.ListSkills(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, skills)
}

func (h *OperationsHandler) CreateWebhook(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Name, URL, Secret, Events string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	w, appErr := h.svc.CreateWebhook(eid, req.Name, req.URL, req.Secret, req.Events)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, w)
}

func (h *OperationsHandler) ListWebhooks(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	whs, appErr := h.svc.ListWebhooks(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, whs)
}

func (h *OperationsHandler) GetReport(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	report, _ := h.platformSvc.GetReport(eid, c.Param("type"))
	response.Success(c, report)
}

func (h *OperationsHandler) CreateServiceTicket(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	response.Created(c, gin.H{"id": "", "status": "created"})
}

func (h *OperationsHandler) ListServiceTickets(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	response.Success(c, []interface{}{})
}

func (h *OperationsHandler) CreateAnnouncement(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	response.Created(c, gin.H{"id": "", "status": "created"})
}

func (h *OperationsHandler) ListAnnouncements(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	response.Success(c, []interface{}{})
}

func (h *OperationsHandler) ListAuditLogs(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	response.Success(c, []interface{}{})
}
