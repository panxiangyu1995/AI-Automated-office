package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type WorkflowHandler struct {
	wfService *service.WorkflowService
}

func NewWorkflowHandler(wfService *service.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{wfService: wfService}
}

// svcFor returns a WorkflowService bound to the request's tenant database.
func (h *WorkflowHandler) svcFor(c *gin.Context) *service.WorkflowService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewWorkflowService(repository.NewWorkflowRepository(db))
	}
	return h.wfService
}

func (h *WorkflowHandler) GetInstance(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, err := uuid.Parse(entIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程实例ID无效")
		return
	}
	inst, appErr := h.svcFor(c).GetInstance(id, entID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, inst)
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

	if appErr := h.svcFor(c).CreateDefinition(def); appErr != nil {
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

	defs, total, appErr := h.svcFor(c).ListDefinitions(entID, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, defs, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *WorkflowHandler) GetDefinition(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程定义ID无效")
		return
	}

	def, appErr := h.svcFor(c).GetDefinition(id, entID)
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

	inst, appErr := h.svcFor(c).SubmitWorkflow(defID, entID, req.BusinessID, req.BusinessType, userIDStr)
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

	insts, total, appErr := h.svcFor(c).ListPending(entID, userIDStr, p, ps)
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
		Comment    string `json:"comment"`
		BranchName string `json:"branch_name"`
	}
	c.ShouldBindJSON(&req)

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	inst, appErr := h.svcFor(c).Approve(id, entID, userIDStr, req.Comment, req.BranchName)
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
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	inst, appErr := h.svcFor(c).Reject(id, entID, userIDStr, req.Comment)
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

	approvals, appErr := h.svcFor(c).GetHistory(id)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, approvals)
}

func (h *WorkflowHandler) Transfer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程实例ID无效")
		return
	}
	var req struct {
		ToApproverID string `json:"to_approver_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}
	userIDStr := c.GetString(middleware.ContextKeyUserID)
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	if appErr := h.svcFor(c).Transfer(id, entID, userIDStr, req.ToApproverID); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *WorkflowHandler) Return(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程实例ID无效")
		return
	}
	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)
	userIDStr := c.GetString(middleware.ContextKeyUserID)
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	if appErr := h.svcFor(c).ReturnToApplicant(id, entID, userIDStr, req.Reason); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *WorkflowHandler) Resubmit(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程实例ID无效")
		return
	}
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	if appErr := h.svcFor(c).Resubmit(id, entID); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *WorkflowHandler) GetParallelStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "流程实例ID无效")
		return
	}
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	statuses, appErr := h.svcFor(c).GetParallelStatus(id, entID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, statuses)
}
