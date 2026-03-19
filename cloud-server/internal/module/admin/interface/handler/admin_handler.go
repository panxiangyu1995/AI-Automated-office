package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"cloud-server/internal/module/admin/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// AdminHandler 管理处理器
type AdminHandler struct {
	UserService *service.UserService
	AuditLogger service.AuditLogger
	Logger      *zap.Logger
}

// NewAdminHandler 创建管理处理器
func NewAdminHandler(userService *service.UserService, auditLogger service.AuditLogger, logger *zap.Logger) *AdminHandler {
	return &AdminHandler{
		UserService: userService,
		AuditLogger: auditLogger,
		Logger:      logger,
	}
}

// getOperatorInfo 获取操作者信息
func (h *AdminHandler) getOperatorInfo(c *gin.Context) (operatorID, operatorName string) {
	if id, exists := c.Get("user_id"); exists {
		operatorID, _ = id.(string)
	}
	if name, exists := c.Get("user_name"); exists {
		operatorName, _ = name.(string)
	}
	return
}

// getTraceID 获取或生成 trace ID
func getTraceID(c *gin.Context) string {
	traceID := c.GetHeader("X-Trace-ID")
	if traceID == "" {
		traceID = uuid.New().String()
	}
	return traceID
}

// ListUsers 用户列表
// GET /api/admin/users
func (h *AdminHandler) ListUsers(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	req := &service.ListUsersRequest{
		Page:         page,
		PageSize:     pageSize,
		Name:         c.Query("name"),
		EmployeeCode: c.Query("employee_code"),
		DepartmentID: c.Query("department_id"),
		Status:       c.Query("status"),
	}

	result, err := h.UserService.ListUsers(c.Request.Context(), tenantID, req)
	if err != nil {
		h.Logger.Error("failed to list users", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取用户列表失败", nil)
		return
	}

	response.Success(c, result, "")
}

// GetUser 用户详情
// GET /api/admin/users/:id
func (h *AdminHandler) GetUser(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	result, err := h.UserService.GetUserDetail(c.Request.Context(), tenantID, userID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在", nil)
			return
		}
		h.Logger.Error("failed to get user", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取用户详情失败", nil)
		return
	}

	response.Success(c, result, "")
}

// CreateUser 创建用户
// POST /api/admin/users
func (h *AdminHandler) CreateUser(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	var req service.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 去除空白
	req.Username = strings.TrimSpace(req.Username)
	req.RealName = strings.TrimSpace(req.RealName)
	req.EmployeeCode = strings.TrimSpace(req.EmployeeCode)
	req.Email = strings.TrimSpace(req.Email)
	req.Phone = strings.TrimSpace(req.Phone)

	result, err := h.UserService.CreateUser(c.Request.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, service.ErrDuplicateUsername) {
			response.Error(c, http.StatusConflict, "DUPLICATE_USERNAME", "用户名已存在", nil)
			return
		}
		if errors.Is(err, service.ErrDuplicateEmployeeCode) {
			response.Error(c, http.StatusConflict, "DUPLICATE_EMPLOYEE_CODE", "工号已存在", nil)
			return
		}
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to create user", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "创建用户失败", nil)
		return
	}

	// 记录审计日志
	if h.AuditLogger != nil {
		operatorID, operatorName := h.getOperatorInfo(c)
		traceID := getTraceID(c)
		h.AuditLogger.LogUserCreate(
			c.Request.Context(),
			tenantID,
			operatorID,
			operatorName,
			result.ID,
			map[string]interface{}{
				"username":      result.Username,
				"real_name":     result.RealName,
				"employee_code": req.EmployeeCode,
			},
			c.ClientIP(),
			c.GetHeader("User-Agent"),
			traceID,
		)
	}

	response.Success(c, result, "用户创建成功")
}

// UpdateUser 更新用户
// PUT /api/admin/users/:id
func (h *AdminHandler) UpdateUser(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	var req service.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 去除空白
	req.RealName = strings.TrimSpace(req.RealName)
	req.Email = strings.TrimSpace(req.Email)
	req.Phone = strings.TrimSpace(req.Phone)

	err := h.UserService.UpdateUser(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在", nil)
			return
		}
		h.Logger.Error("failed to update user", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "更新用户失败", nil)
		return
	}

	// 记录审计日志
	if h.AuditLogger != nil {
		operatorID, operatorName := h.getOperatorInfo(c)
		traceID := getTraceID(c)
		h.AuditLogger.LogUserUpdate(
			c.Request.Context(),
			tenantID,
			operatorID,
			operatorName,
			userID,
			nil, // old values - could be fetched before update
			map[string]interface{}{
				"real_name": req.RealName,
				"email":     req.Email,
				"phone":     req.Phone,
			},
			c.ClientIP(),
			c.GetHeader("User-Agent"),
			traceID,
		)
	}

	response.Success(c, gin.H{"id": userID}, "用户更新成功")
}

// UpdateUserStatus 更新用户状态
// PATCH /api/admin/users/:id/status
func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	var req service.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 校验状态值
	req.Status = strings.TrimSpace(req.Status)
	if req.Status == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "状态不能为空", nil)
		return
	}

	// 获取旧状态用于审计日志
	detail, _ := h.UserService.GetUserDetail(c.Request.Context(), tenantID, userID)
	oldStatus := ""
	if detail != nil {
		oldStatus = detail.Status
	}

	err := h.UserService.UpdateStatus(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在", nil)
			return
		}
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to update user status", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "更新用户状态失败", nil)
		return
	}

	// 记录审计日志
	if h.AuditLogger != nil {
		operatorID, operatorName := h.getOperatorInfo(c)
		traceID := getTraceID(c)
		h.AuditLogger.LogUserStatusChange(
			c.Request.Context(),
			tenantID,
			operatorID,
			operatorName,
			userID,
			oldStatus,
			req.Status,
			c.ClientIP(),
			c.GetHeader("User-Agent"),
			traceID,
		)
	}

	response.Success(c, gin.H{"id": userID, "status": req.Status}, "用户状态更新成功")
}

// getTenantID 从上下文获取租户ID
func getTenantID(c *gin.Context) string {
	// 从上下文获取租户ID（由认证中间件注入）
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		return ""
	}
	if id, ok := tenantID.(string); ok {
		return id
	}
	return ""
}

// RegisterRoutes 注册路由
func (h *AdminHandler) RegisterRoutes(r *gin.RouterGroup) {
	users := r.Group("/admin/users")
	{
		users.GET("", h.ListUsers)
		users.GET("/:id", h.GetUser)
		users.POST("", h.CreateUser)
		users.PUT("/:id", h.UpdateUser)
		users.PATCH("/:id/status", h.UpdateUserStatus)
	}
}
