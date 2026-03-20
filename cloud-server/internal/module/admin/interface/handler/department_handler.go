package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"cloud-server/internal/module/admin/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// DepartmentHandler 部门处理器
type DepartmentHandler struct {
	DepartmentService *service.DepartmentService
	Logger            *zap.Logger
}

// NewDepartmentHandler 创建部门处理器
func NewDepartmentHandler(deptService *service.DepartmentService, logger *zap.Logger) *DepartmentHandler {
	return &DepartmentHandler{
		DepartmentService: deptService,
		Logger:            logger,
	}
}

// GetDepartmentTree 获取部门树
// GET /api/admin/departments/tree
func (h *DepartmentHandler) GetDepartmentTree(c *gin.Context) {
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
func (h *DepartmentHandler) ListDepartments(c *gin.Context) {
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
func (h *DepartmentHandler) GetDepartment(c *gin.Context) {
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
func (h *DepartmentHandler) CreateDepartment(c *gin.Context) {
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
func (h *DepartmentHandler) UpdateDepartment(c *gin.Context) {
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
func (h *DepartmentHandler) MoveDepartment(c *gin.Context) {
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
func (h *DepartmentHandler) DeleteDepartment(c *gin.Context) {
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

// RegisterRoutes 注册路由
func (h *DepartmentHandler) RegisterRoutes(r *gin.RouterGroup) {
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
}
