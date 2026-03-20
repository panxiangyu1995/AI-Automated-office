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

// PositionHandler 岗位处理器
type PositionHandler struct {
	PositionService *service.PositionService
	Logger          *zap.Logger
}

// NewPositionHandler 创建岗位处理器
func NewPositionHandler(positionService *service.PositionService, logger *zap.Logger) *PositionHandler {
	return &PositionHandler{
		PositionService: positionService,
		Logger:          logger,
	}
}

// ListPositions 岗位列表
// GET /api/admin/positions
func (h *PositionHandler) ListPositions(c *gin.Context) {
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
func (h *PositionHandler) GetPosition(c *gin.Context) {
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
func (h *PositionHandler) CreatePosition(c *gin.Context) {
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
func (h *PositionHandler) UpdatePosition(c *gin.Context) {
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
func (h *PositionHandler) DeletePosition(c *gin.Context) {
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

// GetPositionsByDepartment 获取部门下的岗位
// GET /api/admin/departments/:id/positions
func (h *PositionHandler) GetPositionsByDepartment(c *gin.Context) {
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

	result, err := h.PositionService.GetPositionsByDepartment(c.Request.Context(), tenantID, departmentID)
	if err != nil {
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to get positions by department", zap.Error(err), zap.String("departmentID", departmentID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取部门岗位失败", nil)
		return
	}

	response.Success(c, result, "")
}

// RegisterRoutes 注册路由
func (h *PositionHandler) RegisterRoutes(r *gin.RouterGroup) {
	positions := r.Group("/admin/positions")
	{
		positions.GET("", h.ListPositions)
		positions.GET("/:id", h.GetPosition)
		positions.POST("", h.CreatePosition)
		positions.PUT("/:id", h.UpdatePosition)
		positions.DELETE("/:id", h.DeletePosition)
	}
}
