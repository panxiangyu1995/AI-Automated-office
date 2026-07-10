package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type OperationsHandler struct{ svc *service.OperationsService; platformSvc *service.PlatformService }
func NewOperationsHandler(svc *service.OperationsService, platformSvc *service.PlatformService) *OperationsHandler { return &OperationsHandler{svc, platformSvc} }

func (h *OperationsHandler) Dashboard(c *gin.Context) { response.Success(c, gin.H{"status": "ok", "version": "1.0.0"}) }

func (h *OperationsHandler) CreatePlan(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Name, Description, Features string; Price float64; MaxUsers int; MaxStorage int64 }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	p, appErr := h.svc.CreatePlan(eid, req.Name, req.Description, req.Features, req.Price, req.MaxUsers, req.MaxStorage)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, p)
}

func (h *OperationsHandler) ListPlans(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	plans, appErr := h.svc.ListPlans(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, plans)
}

func (h *OperationsHandler) CreateSubscription(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ PlanID string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	sub, appErr := h.svc.CreateSubscription(eid, req.PlanID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, sub)
}

func (h *OperationsHandler) ListSubscriptions(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	subs, appErr := h.svc.ListSubscriptions(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, subs)
}

func (h *OperationsHandler) CreateSkill(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Name, Description, Parameters, APIEndpoint, Module string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	sk, appErr := h.svc.CreateSkill(eid, req.Name, req.Description, req.Parameters, req.APIEndpoint, req.Module)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, sk)
}

func (h *OperationsHandler) ListSkills(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	skills, appErr := h.svc.ListSkills(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, skills)
}

func (h *OperationsHandler) CreateWebhook(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Name, URL, Secret, Events string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	w, appErr := h.svc.CreateWebhook(eid, req.Name, req.URL, req.Secret, req.Events)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, w)
}

func (h *OperationsHandler) ListWebhooks(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	whs, appErr := h.svc.ListWebhooks(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, whs)
}

func (h *OperationsHandler) GetReport(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	report, _ := h.platformSvc.GetReport(eid, c.Param("type"))
	response.Success(c, report)
}

func (h *OperationsHandler) CreateServiceTicket(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ CustomerID, Subject, Description, Priority string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	t, appErr := h.platformSvc.CreateServiceTicket(eid, req.CustomerID, req.Subject, req.Description, req.Priority)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, t)
}

func (h *OperationsHandler) ListServiceTickets(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	tickets, appErr := h.platformSvc.ListServiceTickets(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, tickets)
}

func (h *OperationsHandler) CreateAnnouncement(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Title, Content string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	a, appErr := h.platformSvc.CreateAnnouncement(eid, req.Title, req.Content)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, a)
}

func (h *OperationsHandler) ListAnnouncements(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	anns, appErr := h.platformSvc.ListAnnouncements(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, anns)
}

func (h *OperationsHandler) CreateBill(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Amount float64; Description string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	b, appErr := h.platformSvc.CreateUsageBill(eid, req.Amount, req.Description)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, b)
}

func (h *OperationsHandler) ListBills(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	bills, appErr := h.platformSvc.ListBills(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, bills)
}

func (h *OperationsHandler) GetSLAMetrics(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	metrics, _ := h.platformSvc.GetSLAMetrics(eid)
	response.Success(c, metrics)
}

func (h *OperationsHandler) CreateServiceConfig(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Key, Value string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	sc, appErr := h.platformSvc.CreateServiceConfig(eid, req.Key, req.Value)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, sc)
}

func (h *OperationsHandler) GetServiceConfig(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	sc, appErr := h.platformSvc.GetServiceConfig(eid, c.Param("key"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, sc)
}

func (h *OperationsHandler) ExportData(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	data, contentType, appErr := h.platformSvc.ExportData(eid, c.DefaultQuery("format", "csv"))
	if appErr != nil { response.Error(c, appErr); return }
	c.Data(200, contentType, data)
}

func (h *OperationsHandler) ImportData(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Records []map[string]interface{}; Target string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	count, appErr := h.platformSvc.ImportData(eid, req.Records, req.Target)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, gin.H{"imported": count})
}

func (h *OperationsHandler) ListAuditLogs(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	response.Success(c, []interface{}{})
}
