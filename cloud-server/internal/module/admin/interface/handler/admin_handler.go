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
	UserService       *service.UserService
	DepartmentService *service.DepartmentService
	PositionService   *service.PositionService
	AuditLogger       service.AuditLogger
	Logger            *zap.Logger
}

// NewAdminHandler 创建管理处理器
func NewAdminHandler(userService *service.UserService, departmentService *service.DepartmentService, positionService *service.PositionService, auditLogger service.AuditLogger, logger *zap.Logger) *AdminHandler {
	return &AdminHandler{
		UserService:       userService,
		DepartmentService: departmentService,
		PositionService:   positionService,
		AuditLogger:       auditLogger,
		Logger:            logger,
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

// ==================== 部门相关方法 ====================

// GetDepartmentTree 获取部门树
// GET /api/admin/departments/tree
func (h *AdminHandler) GetDepartmentTree(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	tree, err := h.DepartmentService.GetDepartmentTree(c.Request.Context(), tenantID)
	if err != nil {
		h.Logger.Error("failed to get department tree", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取部门树失败", nil)
		return
	}

	response.Success(c, tree, "")
}

// ListDepartments 部门列表
// GET /api/admin/departments
func (h *AdminHandler) ListDepartments(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	req := &service.ListDepartmentsRequest{
		Page:     page,
		PageSize: pageSize,
		Name:     c.Query("name"),
		Code:     c.Query("code"),
		Status:   c.Query("status"),
	}

	result, err := h.DepartmentService.ListDepartments(c.Request.Context(), tenantID, req)
	if err != nil {
		h.Logger.Error("failed to list departments", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取部门列表失败", nil)
		return
	}

	response.Success(c, result, "")
}

// GetDepartment 部门详情
// GET /api/admin/departments/:id
func (h *AdminHandler) GetDepartment(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	departmentID := c.Param("id")
	if departmentID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "部门ID不能为空", nil)
		return
	}

	result, err := h.DepartmentService.GetDepartmentDetail(c.Request.Context(), tenantID, departmentID)
	if err != nil {
		if errors.Is(err, service.ErrDepartmentNotFound) {
			response.Error(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "部门不存在", nil)
			return
		}
		h.Logger.Error("failed to get department", zap.Error(err), zap.String("departmentID", departmentID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取部门详情失败", nil)
		return
	}

	response.Success(c, result, "")
}

// CreateDepartment 创建部门
// POST /api/admin/departments
func (h *AdminHandler) CreateDepartment(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	var req service.CreateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 去除空白
	req.Name = strings.TrimSpace(req.Name)
	req.Code = strings.TrimSpace(req.Code)

	result, err := h.DepartmentService.CreateDepartment(c.Request.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, service.ErrDuplicateCode) {
			response.Error(c, http.StatusConflict, "DUPLICATE_CODE", "部门编码已存在", nil)
			return
		}
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to create department", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "创建部门失败", nil)
		return
	}

	response.Success(c, result, "部门创建成功")
}

// UpdateDepartment 更新部门
// PUT /api/admin/departments/:id
func (h *AdminHandler) UpdateDepartment(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	departmentID := c.Param("id")
	if departmentID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "部门ID不能为空", nil)
		return
	}

	var req service.UpdateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 去除空白
	req.Name = strings.TrimSpace(req.Name)
	req.Code = strings.TrimSpace(req.Code)

	err := h.DepartmentService.UpdateDepartment(c.Request.Context(), tenantID, departmentID, &req)
	if err != nil {
		if errors.Is(err, service.ErrDepartmentNotFound) {
			response.Error(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "部门不存在", nil)
			return
		}
		if errors.Is(err, service.ErrDuplicateCode) {
			response.Error(c, http.StatusConflict, "DUPLICATE_CODE", "部门编码已存在", nil)
			return
		}
		h.Logger.Error("failed to update department", zap.Error(err), zap.String("departmentID", departmentID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "更新部门失败", nil)
		return
	}

	response.Success(c, gin.H{"id": departmentID}, "部门更新成功")
}

// MoveDepartment 移动部门
// PUT /api/admin/departments/:id/move
func (h *AdminHandler) MoveDepartment(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	departmentID := c.Param("id")
	if departmentID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "部门ID不能为空", nil)
		return
	}

	var req service.MoveDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	err := h.DepartmentService.MoveDepartment(c.Request.Context(), tenantID, departmentID, &req)
	if err != nil {
		if errors.Is(err, service.ErrDepartmentNotFound) {
			response.Error(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "部门不存在", nil)
			return
		}
		if errors.Is(err, service.ErrCircularReference) {
			response.Error(c, http.StatusBadRequest, "CIRCULAR_REFERENCE", "移动后会产生循环引用", nil)
			return
		}
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to move department", zap.Error(err), zap.String("departmentID", departmentID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "移动部门失败", nil)
		return
	}

	response.Success(c, gin.H{"id": departmentID}, "部门移动成功")
}

// DeleteDepartment 删除部门
// DELETE /api/admin/departments/:id
func (h *AdminHandler) DeleteDepartment(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	departmentID := c.Param("id")
	if departmentID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "部门ID不能为空", nil)
		return
	}

	err := h.DepartmentService.DeleteDepartment(c.Request.Context(), tenantID, departmentID)
	if err != nil {
		if errors.Is(err, service.ErrDepartmentNotFound) {
			response.Error(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "部门不存在", nil)
			return
		}
		if errors.Is(err, service.ErrDepartmentHasChildren) {
			response.Error(c, http.StatusBadRequest, "DEPARTMENT_HAS_CHILDREN", "该部门下存在子部门，无法删除", nil)
			return
		}
		if errors.Is(err, service.ErrDepartmentHasUsers) {
			response.Error(c, http.StatusBadRequest, "DEPARTMENT_HAS_USERS", "该部门下存在员工，无法删除", nil)
			return
		}
		h.Logger.Error("failed to delete department", zap.Error(err), zap.String("departmentID", departmentID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "删除部门失败", nil)
		return
	}

	response.Success(c, gin.H{"id": departmentID}, "部门删除成功")
}

// ==================== 岗位相关方法 ====================

// ListPositions 岗位列表
// GET /api/admin/positions
func (h *AdminHandler) ListPositions(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	req := &service.ListPositionsRequest{
		Page:         page,
		PageSize:     pageSize,
		Name:         c.Query("name"),
		Code:         c.Query("code"),
		DepartmentID: c.Query("department_id"),
		Status:       c.Query("status"),
	}

	result, err := h.PositionService.ListPositions(c.Request.Context(), tenantID, req)
	if err != nil {
		h.Logger.Error("failed to list positions", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取岗位列表失败", nil)
		return
	}

	response.Success(c, result, "")
}

// GetPosition 岗位详情
// GET /api/admin/positions/:id
func (h *AdminHandler) GetPosition(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	positionID := c.Param("id")
	if positionID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "岗位ID不能为空", nil)
		return
	}

	result, err := h.PositionService.GetPositionDetail(c.Request.Context(), tenantID, positionID)
	if err != nil {
		if errors.Is(err, service.ErrPositionNotFound) {
			response.Error(c, http.StatusNotFound, "POSITION_NOT_FOUND", "岗位不存在", nil)
			return
		}
		h.Logger.Error("failed to get position", zap.Error(err), zap.String("positionID", positionID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取岗位详情失败", nil)
		return
	}

	response.Success(c, result, "")
}

// CreatePosition 创建岗位
// POST /api/admin/positions
func (h *AdminHandler) CreatePosition(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	var req service.CreatePositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 去除空白
	req.Name = strings.TrimSpace(req.Name)
	req.Code = strings.TrimSpace(req.Code)
	req.Description = strings.TrimSpace(req.Description)

	result, err := h.PositionService.CreatePosition(c.Request.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, service.ErrDuplicateCode) {
			response.Error(c, http.StatusConflict, "DUPLICATE_CODE", "岗位编码已存在", nil)
			return
		}
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to create position", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "创建岗位失败", nil)
		return
	}

	response.Success(c, result, "岗位创建成功")
}

// UpdatePosition 更新岗位
// PUT /api/admin/positions/:id
func (h *AdminHandler) UpdatePosition(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	positionID := c.Param("id")
	if positionID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "岗位ID不能为空", nil)
		return
	}

	var req service.UpdatePositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 去除空白
	req.Name = strings.TrimSpace(req.Name)
	req.Code = strings.TrimSpace(req.Code)
	req.Description = strings.TrimSpace(req.Description)

	err := h.PositionService.UpdatePosition(c.Request.Context(), tenantID, positionID, &req)
	if err != nil {
		if errors.Is(err, service.ErrPositionNotFound) {
			response.Error(c, http.StatusNotFound, "POSITION_NOT_FOUND", "岗位不存在", nil)
			return
		}
		if errors.Is(err, service.ErrDuplicateCode) {
			response.Error(c, http.StatusConflict, "DUPLICATE_CODE", "岗位编码已存在", nil)
			return
		}
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to update position", zap.Error(err), zap.String("positionID", positionID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "更新岗位失败", nil)
		return
	}

	response.Success(c, gin.H{"id": positionID}, "岗位更新成功")
}

// DeletePosition 删除岗位
// DELETE /api/admin/positions/:id
func (h *AdminHandler) DeletePosition(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	positionID := c.Param("id")
	if positionID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "岗位ID不能为空", nil)
		return
	}

	err := h.PositionService.DeletePosition(c.Request.Context(), tenantID, positionID)
	if err != nil {
		if errors.Is(err, service.ErrPositionNotFound) {
			response.Error(c, http.StatusNotFound, "POSITION_NOT_FOUND", "岗位不存在", nil)
			return
		}
		if errors.Is(err, service.ErrPositionHasUsers) {
			response.Error(c, http.StatusBadRequest, "POSITION_HAS_USERS", "该岗位下存在员工，无法删除", nil)
			return
		}
		h.Logger.Error("failed to delete position", zap.Error(err), zap.String("positionID", positionID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "删除岗位失败", nil)
		return
	}

	response.Success(c, gin.H{"id": positionID}, "岗位删除成功")
}

// RegisterRoutes 注册路由
func (h *AdminHandler) RegisterRoutes(r *gin.RouterGroup) {
	// 用户路由
	users := r.Group("/admin/users")
	{
		users.GET("", h.ListUsers)
		users.GET("/:id", h.GetUser)
		users.POST("", h.CreateUser)
		users.PUT("/:id", h.UpdateUser)
		users.PATCH("/:id/status", h.UpdateUserStatus)
	}

	// 部门路由
	departments := r.Group("/admin/departments")
	{
		departments.GET("/tree", h.GetDepartmentTree)
		departments.GET("", h.ListDepartments)
		departments.GET("/:id", h.GetDepartment)
		departments.POST("", h.CreateDepartment)
		departments.PUT("/:id", h.UpdateDepartment)
		departments.PUT("/:id/move", h.MoveDepartment)
		departments.DELETE("/:id", h.DeleteDepartment)
	}

	// 岗位路由
	positions := r.Group("/admin/positions")
	{
		positions.GET("", h.ListPositions)
		positions.GET("/:id", h.GetPosition)
		positions.POST("", h.CreatePosition)
		positions.PUT("/:id", h.UpdatePosition)
		positions.DELETE("/:id", h.DeletePosition)
	}
}
