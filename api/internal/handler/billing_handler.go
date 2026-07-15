package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type BillingHandler struct {
	svc *service.BillingService
}

func NewBillingHandler(svc *service.BillingService) *BillingHandler {
	return &BillingHandler{svc: svc}
}

func (h *BillingHandler) CreatePlan(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	entID, err := uuid.Parse(eid)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "无效")
		return
	}
	var plan model.SubscriptionPlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	plan.EnterpriseID = entID
	if appErr := h.svc.CreatePlan(&plan); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, plan)
}

func (h *BillingHandler) ListPlans(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	entID, err := uuid.Parse(eid)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "无效")
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.ListPlans(entID, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *BillingHandler) Subscribe(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	entID, err := uuid.Parse(eid)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "无效")
		return
	}
	var req struct {
		PlanID       string `json:"plan_id"`
		BillingCycle string `json:"billing_cycle"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	planID, err := uuid.Parse(req.PlanID)
	if err != nil {
		response.ValidationError(c, "plan_id", "无效")
		return
	}
	sub, appErr := h.svc.Subscribe(entID, planID, req.BillingCycle)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, sub)
}

func (h *BillingHandler) UpgradePlan(c *gin.Context) {
	subID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "无效")
		return
	}
	var req struct {
		NewPlanID string `json:"new_plan_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	newPlanID, err := uuid.Parse(req.NewPlanID)
	if err != nil {
		response.ValidationError(c, "new_plan_id", "无效")
		return
	}
	record, appErr := h.svc.UpgradePlan(subID, newPlanID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, record)
}

func (h *BillingHandler) DowngradePlan(c *gin.Context) {
	subID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "无效")
		return
	}
	var req struct {
		NewPlanID string `json:"new_plan_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	newPlanID, err := uuid.Parse(req.NewPlanID)
	if err != nil {
		response.ValidationError(c, "new_plan_id", "无效")
		return
	}
	record, appErr := h.svc.DowngradePlan(subID, newPlanID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, record)
}

func (h *BillingHandler) RenewSubscription(c *gin.Context) {
	subID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "无效")
		return
	}
	sub, appErr := h.svc.RenewSubscription(subID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, sub)
}

func (h *BillingHandler) ListBills(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	entID, err := uuid.Parse(eid)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "无效")
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.ListBills(entID, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *BillingHandler) GetBill(c *gin.Context) {
	billID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "无效")
		return
	}
	record, appErr := h.svc.GetBill(billID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, record)
}

func (h *BillingHandler) Refund(c *gin.Context) {
	billID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "无效")
		return
	}
	record, appErr := h.svc.Refund(billID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, record)
}

func (h *BillingHandler) GetRevenueSummary(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	entID, err := uuid.Parse(eid)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "无效")
		return
	}
	period := c.DefaultQuery("period", "monthly")
	summary, appErr := h.svc.GetRevenueSummary(entID, period)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, summary)
}
