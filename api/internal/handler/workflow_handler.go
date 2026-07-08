package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/service"
	apperrors "github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type WorkflowHandler struct {
	wfService *service.WorkflowService
}

func NewWorkflowHandler(wfService *service.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{wfService: wfService}
}

func (h *WorkflowHandler) CreateDefinition(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if entIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	entID, _ := uuid.Parse(entIDStr)

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		FlowConfig  string `json:"flow_config" binding:"required"`
		Category    string `json:"category"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	def := &model.WfDefinition{
		Name:        req.Name,
		Description: req.Description,
		FlowConfig:  req.FlowConfig,
		Category:    req.Category,
	}
	def.EnterpriseID = entID

	if appErr := h.wfService.CreateDefinition(def); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, def)
}

func (h *WorkflowHandler) ListDefinitions(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, err := uuid.Parse(entIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	defs, total, appErr := h.wfService.ListDefinitions(entID, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, defs, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *WorkflowHandler) GetDefinition(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程定义ID无效")
		return
	}

	def, appErr := h.wfService.GetDefinition(id)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, def)
}

func (h *WorkflowHandler) SubmitWorkflow(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)

	var req struct {
		DefinitionID string `json:"definition_id" binding:"required"`
		BusinessID   string `json:"business_id" binding:"required"`
		BusinessType string `json:"business_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	defID, _ := uuid.Parse(req.DefinitionID)
	userIDStr := c.GetString(middleware.ContextKeyUserID)

	inst, appErr := h.wfService.SubmitWorkflow(defID, entID, req.BusinessID, req.BusinessType, userIDStr)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, inst)
}

func (h *WorkflowHandler) ListPending(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	userIDStr := c.GetString(middleware.ContextKeyUserID)

	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	insts, total, appErr := h.wfService.ListPending(entID, userIDStr, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, insts, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *WorkflowHandler) Approve(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程实例ID无效")
		return
	}

	var req struct {
		Comment string `json:"comment"`
	}
	c.ShouldBindJSON(&req)

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	inst, appErr := h.wfService.Approve(id, userIDStr, req.Comment)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, inst)
}

func (h *WorkflowHandler) Reject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程实例ID无效")
		return
	}

	var req struct {
		Comment string `json:"comment"`
	}
	c.ShouldBindJSON(&req)

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	inst, appErr := h.wfService.Reject(id, userIDStr, req.Comment)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, inst)
}

func (h *WorkflowHandler) History(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程实例ID无效")
		return
	}

	approvals, appErr := h.wfService.GetHistory(id)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, approvals)
}
