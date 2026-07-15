package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type SkillHandler struct {
	skillService *service.SkillService
}

func NewSkillHandler(skillService *service.SkillService) *SkillHandler {
	return &SkillHandler{skillService: skillService}
}

func (h *SkillHandler) List(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, err := uuid.Parse(entIDStr)
	if err != nil {
		entID = uuid.Nil
	}

	skills, appErr := h.skillService.ListSkills(entID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, skills)
}

func (h *SkillHandler) GetDetail(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		response.ValidationError(c, "name", "Skill名称不能为空")
		return
	}

	roleStr := c.Query("role")
	if roleStr == "" {
		roleStr = c.GetString(middleware.ContextKeyRole)
	}

	var detail *service.SkillDetailResponse
	var appErr *apperrors.AppError

	if roleStr != "" {
		detail, appErr = h.skillService.GetByRole(name, roleStr)
	} else {
		detail, appErr = h.skillService.GetSkillDetail(name, roleStr)
	}

	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, detail)
}

func (h *SkillHandler) Create(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Category    string `json:"category"`
		APIEndpoint string `json:"api_endpoint"`
		Method      string `json:"method"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	skill := &model.Skill{
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		APIEndpoint: req.APIEndpoint,
		Method:      req.Method,
	}
	skill.EnterpriseID = entID

	if appErr := h.skillService.CreateSkill(skill); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, skill)
}
