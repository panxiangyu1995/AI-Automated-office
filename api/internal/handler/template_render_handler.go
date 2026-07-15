package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type TemplateRenderHandler struct {
	renderService *service.TemplateRenderService
}

func NewTemplateRenderHandler(renderService *service.TemplateRenderService) *TemplateRenderHandler {
	return &TemplateRenderHandler{renderService: renderService}
}

func (h *TemplateRenderHandler) CreateTemplate(c *gin.Context) {
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

func (h *TemplateRenderHandler) ListTemplates(c *gin.Context) {
	tpls, err := h.renderService.ListTemplates()
	if err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.Success(c, tpls)
}
