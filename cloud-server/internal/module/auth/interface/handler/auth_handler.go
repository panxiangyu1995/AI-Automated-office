package handler

import (
	"net/http"

	"cloud-server/internal/module/auth/application/dto"
	"cloud-server/internal/module/auth/application/service"
	auditService "cloud-server/internal/module/audit/application/service"

	"github.com/gin-gonic/gin"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	authService  *service.AuthService
	auditService *auditService.AuditService
}

// NewAuthHandler 创建认证处理器
func NewAuthHandler(authService *service.AuthService, auditSvc *auditService.AuditService) *AuthHandler {
	return &AuthHandler{
		authService:  authService,
		auditService: auditSvc,
	}
}

// Login 登录
// @Summary 用户登录
// @Description 用户使用邮箱和密码登录
// @Tags 认证
// @Accept json
// @Produce json
// @Param request body dto.LoginRequest true "登录请求"
// @Success 200 {object} dto.LoginResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request body",
		})
		return
	}

	// 如果请求中没有租户 ID，从 header 获取
	if req.TenantID == "" {
		req.TenantID = c.GetHeader("X-Tenant-ID")
	}

	// 执行登录
	resp, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		// 记录登录失败审计日志
		if h.auditService != nil {
			h.auditService.LogLogin(c.Request.Context(), req.TenantID, "", req.Username, c.ClientIP(), c.GetHeader("User-Agent"), false)
		}
		h.handleError(c, err)
		return
	}

	// 记录登录成功审计日志
	if h.auditService != nil && resp.User != nil && resp.Tenant != nil {
		h.auditService.LogLogin(c.Request.Context(), resp.Tenant.ID, resp.User.ID, resp.User.RealName, c.ClientIP(), c.GetHeader("User-Agent"), true)
	}

	c.JSON(http.StatusOK, resp)
}

// Logout 登出
// @Summary 用户登出
// @Description 用户登出，撤销当前会话
// @Tags 认证
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// 从上下文获取用户信息
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	// 获取用户名
	username, _ := c.Get("username")
	usernameStr := ""
	if username != nil {
		usernameStr = username.(string)
	}

	// 获取租户 ID
	tenantID, _ := c.Get("tenant_id")
	tenantIDStr := ""
	if tenantID != nil {
		tenantIDStr = tenantID.(string)
	}

	// 获取会话 ID
	sessionID := c.GetHeader("X-Session-ID")

	// 检查是否登出所有会话
	var allSessions bool
	if c.GetHeader("X-All-Sessions") == "true" {
		allSessions = true
	}

	if sessionID != "" || allSessions {
		err := h.authService.Logout(c.Request.Context(), userID.(string), sessionID, allSessions)
		if err != nil {
			h.handleError(c, err)
			return
		}
	}

	// 记录登出审计日志
	if h.auditService != nil {
		h.auditService.LogLogout(c.Request.Context(), tenantIDStr, userID.(string), usernameStr)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
		"user_id": userID,
	})
}

// RefreshToken 刷新令牌
// @Summary 刷新访问令牌
// @Description 使用刷新令牌获取新的访问令牌
// @Tags 认证
// @Accept json
// @Produce json
// @Param request body dto.RefreshTokenRequest true "刷新请求"
// @Success 200 {object} dto.TokenPair
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request body",
		})
		return
	}

	resp, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetProfile 获取用户信息
// @Summary 获取当前用户信息
// @Description 获取当前登录用户的详细信息
// @Tags 用户
// @Produce json
// @Security BearerAuth
// @Success 200 {object} dto.UserProfile
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/auth/profile [get]
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	// TODO: 实现获取用户信息逻辑
	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"message": "Profile endpoint - to be implemented",
	})
}

// Register 注册
// @Summary 用户注册
// @Description 创建新用户账户
// @Tags 认证
// @Accept json
// @Produce json
// @Param request body dto.RegisterRequest true "注册请求"
// @Success 201 {object} dto.UserProfile
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request body",
		})
		return
	}

	profile, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, profile)
}

// handleError 处理错误响应
func (h *AuthHandler) handleError(c *gin.Context, err error) {
	// Map errors to HTTP status codes and error codes
	switch err.Error() {
	case "invalid credentials":
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "invalid_credentials",
			"message": "Invalid email or password",
		})
		return
	case "account is disabled":
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "account_disabled",
			"message": "Your account has been disabled. Please contact administrator.",
		})
		return
	case "account is locked":
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "account_locked",
			"message": "Your account has been locked due to too many failed login attempts. Please try again later.",
		})
		return
	case "token has expired":
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "token_expired",
			"message": "Your session has expired. Please log in again.",
		})
		return
	case "token is invalid", "token is malformed":
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "token_invalid",
			"message": "Invalid authentication token.",
		})
		return
	case "tenant not found":
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "tenant_not_found",
			"message": "Invalid tenant ID.",
		})
		return
	}

	// Default to internal server error
	c.JSON(http.StatusInternalServerError, gin.H{
		"error":   "internal_error",
		"message": "An unexpected error occurred. Please try again later.",
	})
}
