package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type TemplateHandler struct {
	templateService *service.TemplateService
	renderService   *service.TemplateRenderService
}

func NewTemplateHandler(templateService *service.TemplateService, renderService *service.TemplateRenderService) *TemplateHandler {
	return &TemplateHandler{templateService: templateService, renderService: renderService}
}

func (h *TemplateHandler) Create(c *gin.Context) {
	var req struct {
		Name            string `json:"name" binding:"required"`
		Industry        string `json:"industry" binding:"required"`
		Description     string `json:"description"`
		PresetSkills    string `json:"preset_skills"`
		PresetFields    string `json:"preset_fields"`
		PresetWorkflows string `json:"preset_workflows"`
		PresetRoles     string `json:"preset_roles"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	tpl := &model.IndustryTemplate{
		Name:            req.Name,
		Industry:        req.Industry,
		Description:     req.Description,
		PresetSkills:    req.PresetSkills,
		PresetFields:    req.PresetFields,
		PresetWorkflows: req.PresetWorkflows,
		PresetRoles:     req.PresetRoles,
	}

	if err := h.templateService.CreateTemplate(tpl); err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.Created(c, tpl)
}

func (h *TemplateHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	tpls, total, err := h.templateService.ListTemplates(page, pageSize)
	if err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.SuccessWithMeta(c, tpls, &response.MetaInfo{
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	})
}

func (h *TemplateHandler) Get(c *gin.Context) {
	id := c.Param("id")
	tid, err := uuid.Parse(id)
	if err != nil {
		response.ValidationError(c, "id", "无效的模板ID")
		return
	}

	tpl, err := h.templateService.GetTemplate(tid)
	if err != nil {
		response.Error(c, apperrors.ErrNotFound.WithDetail(err.Error()))
		return
	}
	response.Success(c, tpl)
}

func (h *TemplateHandler) Apply(c *gin.Context) {
	id := c.Param("id")
	entID := c.GetString(middleware.ContextKeyEnterpriseID)
	if entID == "" {
		var req struct {
			EnterpriseID string `json:"enterprise_id" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			response.ValidationError(c, "enterprise_id", "企业ID不能为空")
			return
		}
		entID = req.EnterpriseID
	}

	if err := h.templateService.ApplyTemplate(id, entID); err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.Success(c, gin.H{"message": "模板应用成功"})
}

func (h *TemplateHandler) CreateFromEnterprise(c *gin.Context) {
	entID := c.GetString(middleware.ContextKeyEnterpriseID)
	if entID == "" {
		var req struct {
			EnterpriseID string `json:"enterprise_id" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			response.ValidationError(c, "enterprise_id", "企业ID不能为空")
			return
		}
		entID = req.EnterpriseID
	}

	tpl, appErr := h.templateService.CreateFromEnterprise(entID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, tpl)
}

func (h *TemplateHandler) CreateClaudeMD(c *gin.Context) {
	var req struct {
		Name      string `json:"name" binding:"required"`
		Content   string `json:"content" binding:"required"`
		IsDefault bool   `json:"is_default"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	userID := c.GetString(middleware.ContextKeyUserID)
	tpl := &model.ClaudeMDTemplate{
		OperatorID: userID,
		Name:       req.Name,
		Content:    req.Content,
		IsDefault:  req.IsDefault,
	}

	if err := h.renderService.CreateTemplate(tpl); err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.Created(c, tpl)
}

func (h *TemplateHandler) ListClaudeMD(c *gin.Context) {
	tpls, err := h.renderService.ListTemplates()
	if err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.Success(c, tpls)
}
