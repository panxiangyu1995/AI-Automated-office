package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/service"
	apperrors "github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type AuthHandler struct {
	authService      AuthServiceInterface
	employeeService  *service.EmployeeService
}

type AuthServiceInterface interface {
	Login(req service.LoginRequest) (*service.TokenResponse, *apperrors.AppError)
	Refresh(req service.RefreshRequest) (*service.TokenResponse, *apperrors.AppError)
	GetUser(userID uuid.UUID) (*model.User, *apperrors.AppError)
	SwitchEnterprise(userID, currentEnterpriseID, targetEnterpriseID uuid.UUID) (*service.TokenResponse, *apperrors.AppError)
}

func NewAuthHandler(authService AuthServiceInterface) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func NewAuthHandlerWithEmployee(authService AuthServiceInterface, employeeService *service.EmployeeService) *AuthHandler {
	return &AuthHandler{
		authService:     authService,
		employeeService: employeeService,
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	tokenResp, appErr := h.authService.Login(req)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, tokenResp)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req service.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	tokenResp, appErr := h.authService.Refresh(req)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, tokenResp)
}

type switchEnterpriseRequest struct {
	EnterpriseID string `json:"enterprise_id"`
}

func (h *AuthHandler) SwitchEnterprise(c *gin.Context) {
	userIDStr := c.GetString(middleware.ContextKeyUserID)
	if userIDStr == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}
	currentEnterpriseIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if currentEnterpriseIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	var req switchEnterpriseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}
	if req.EnterpriseID == "" {
		response.ValidationError(c, "enterprise_id", "目标企业ID不能为空")
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTokenInvalid)
		return
	}
	currentEID, err := uuid.Parse(currentEnterpriseIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	targetEID, err := uuid.Parse(req.EnterpriseID)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "目标企业ID无效")
		return
	}

	resp, appErr := h.authService.SwitchEnterprise(userID, currentEID, targetEID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, resp)
}

func (h *AuthHandler) MeProfile(c *gin.Context) {
	if h.employeeService == nil {
		response.Error(c, apperrors.ErrInternal.WithDetail("员工服务未初始化"))
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	if userIDStr == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTokenInvalid)
		return
	}

	user, appErr := h.authService.GetUser(userID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	if user.EmployeeID == nil {
		response.Error(c, apperrors.ErrNotFound.WithDetail("未关联员工档案"))
		return
	}

	emp, appErr := h.employeeService.Get(*user.EmployeeID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, gin.H{
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
		"employee": emp,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userIDStr := c.GetString(middleware.ContextKeyUserID)
	if userIDStr == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTokenInvalid)
		return
	}

	user, appErr := h.authService.GetUser(userID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, gin.H{
		"id":    user.ID,
		"email": user.Email,
		"name":  user.Name,
		"role":  user.Role,
	})
}
