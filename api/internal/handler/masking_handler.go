package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/masking"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type MaskingHandler struct {
	maskingService *service.MaskingService
}

func NewMaskingHandler(maskingService *service.MaskingService) *MaskingHandler {
	return &MaskingHandler{maskingService: maskingService}
}

func (h *MaskingHandler) GetRules(c *gin.Context) {
	enterpriseIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	enterpriseID, err := uuid.Parse(enterpriseIDStr)
	if err != nil {
		response.Error(c, apperrors.NewValidationError("enterprise_id", "企业ID无效"))
		return
	}

	rules, appErr := h.maskingService.GetRules(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, rules)
}

func (h *MaskingHandler) SetRules(c *gin.Context) {
	enterpriseIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	enterpriseID, err := uuid.Parse(enterpriseIDStr)
	if err != nil {
		response.Error(c, apperrors.NewValidationError("enterprise_id", "企业ID无效"))
		return
	}

	var rules []masking.MaskingRule
	if bindErr := c.ShouldBindJSON(&rules); bindErr != nil {
		response.ValidationError(c, "rules", "规则格式错误")
		return
	}

	appErr := h.maskingService.SetRules(enterpriseID, rules)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, gin.H{"message": "脱敏规则已更新"})
}
