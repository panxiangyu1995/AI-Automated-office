package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type MFAHandler struct {
	mfaService *service.MFAService
}

func NewMFAHandler(mfaService *service.MFAService) *MFAHandler {
	return &MFAHandler{mfaService: mfaService}
}

func (h *MFAHandler) Enable(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	if userID == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	var req struct {
		Method string `json:"method"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Method = "totp"
	}
	if req.Method == "" {
		req.Method = "totp"
	}

	result, appErr := h.mfaService.EnableMFA(userID, req.Method)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, result)
}

func (h *MFAHandler) Verify(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	if userID == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	var req struct {
		Code string `json:"code"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "code", "验证码不能为空")
		return
	}

	valid, appErr := h.mfaService.VerifyMFA(userID, req.Code)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	if !valid {
		response.Error(c, apperrors.ErrForbidden.WithDetail("验证码错误"))
		return
	}

	if markErr := middleware.MarkMFAVerified(c.Request.Context(), userID); markErr != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail("MFA验证状态保存失败"))
		return
	}

	response.Success(c, gin.H{"verified": true})
}

func (h *MFAHandler) Disable(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	if userID == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	appErr := h.mfaService.DisableMFA(userID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	_ = middleware.ClearMFAVerified(c.Request.Context(), userID)

	response.Success(c, gin.H{"message": "MFA已禁用"})
}

func (h *MFAHandler) Status(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	if userID == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	status, appErr := h.mfaService.GetMFAStatus(userID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, status)
}
