package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type EnterpriseSkillHandler struct {
	skillService *service.EnterpriseSkillService
}

func NewEnterpriseSkillHandler(skillService *service.EnterpriseSkillService) *EnterpriseSkillHandler {
	return &EnterpriseSkillHandler{skillService: skillService}
}

func (h *EnterpriseSkillHandler) ConfigureSkill(c *gin.Context) {
	entID := c.Param("enterprise_id")
	if entID == "" {
		entID = c.GetString(middleware.ContextKeyEnterpriseID)
	}
	if entID == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	var req struct {
		SkillName            string `json:"skill_name" binding:"required"`
		IsEnabled            bool   `json:"is_enabled"`
		CustomOpeningMessage string `json:"custom_opening_message"`
		CustomParams         string `json:"custom_params"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	if err := h.skillService.ConfigureSkill(entID, req.SkillName, req.IsEnabled, req.CustomOpeningMessage, req.CustomParams); err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.Success(c, gin.H{"message": "Skill配置成功"})
}

func (h *EnterpriseSkillHandler) ListSkillMatrix(c *gin.Context) {
	entID := c.Param("enterprise_id")
	if entID == "" {
		entID = c.GetString(middleware.ContextKeyEnterpriseID)
	}
	if entID == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	matrices, err := h.skillService.ListSkillMatrix(entID)
	if err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.Success(c, matrices)
}

func (h *EnterpriseSkillHandler) UpdateSkill(c *gin.Context) {
	entID := c.Param("enterprise_id")
	if entID == "" {
		entID = c.GetString(middleware.ContextKeyEnterpriseID)
	}
	if entID == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	skillName := c.Param("skill_name")
	if skillName == "" {
		response.ValidationError(c, "skill_name", "Skill名称不能为空")
		return
	}

	var req struct {
		IsEnabled            *bool  `json:"is_enabled"`
		CustomOpeningMessage string `json:"custom_opening_message"`
		CustomParams         string `json:"custom_params"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	isEnabled := true
	if req.IsEnabled != nil {
		isEnabled = *req.IsEnabled
	}

	if err := h.skillService.ConfigureSkill(entID, skillName, isEnabled, req.CustomOpeningMessage, req.CustomParams); err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.Success(c, gin.H{"message": "Skill更新成功"})
}
