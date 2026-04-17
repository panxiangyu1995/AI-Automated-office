package handler

import (
	"time"

	"cloud-server/internal/module/sync/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// SyncHandler 同步处理器
type SyncHandler struct {
	syncService *service.SyncService
	logger      *zap.Logger
}

// NewSyncHandler 创建同步处理器
func NewSyncHandler(logger *zap.Logger) *SyncHandler {
	return &SyncHandler{
		syncService: service.NewSyncService(),
		logger:      logger,
	}
}

// PushRequest 推送请求
type PushRequest struct {
	DeviceID string                  `json:"device_id" binding:"required"`
	Changes  []service.EntityChange  `json:"changes" binding:"required"`
}

// Push 推送本地变更到云端
func (h *SyncHandler) Push(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.BadRequest(c, "ERR_TENANT_REQUIRED", "缺少租户标识", nil)
		return
	}

	var req PushRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "ERR_BAD_REQUEST", "请求参数错误", nil)
		return
	}

	syncReq := &service.SyncRequest{
		TenantID:   tenantID,
		DeviceID:   req.DeviceID,
		Direction:  service.SyncDirectionPush,
	}

	result, err := h.syncService.Push(c.Request.Context(), syncReq, req.Changes)
	if err != nil {
		h.logger.Error("sync push failed", zap.Error(err))
		response.InternalError(c, "ERR_SYNC_FAILED", "同步失败")
		return
	}

	response.Success(c, result, "同步成功")
}

// PullRequest 拉取请求
type PullRequest struct {
	DeviceID     string `json:"device_id" binding:"required"`
	LastSyncTime string `json:"last_sync_time" binding:"required"`
}

// Pull 从云端拉取变更
func (h *SyncHandler) Pull(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.BadRequest(c, "ERR_TENANT_REQUIRED", "缺少租户标识", nil)
		return
	}

	var req PullRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "ERR_BAD_REQUEST", "请求参数错误", nil)
		return
	}

	syncReq := &service.SyncRequest{
		TenantID:    tenantID,
		DeviceID:    req.DeviceID,
		Direction:   service.SyncDirectionPull,
	}

	result, err := h.syncService.Pull(c.Request.Context(), syncReq)
	if err != nil {
		h.logger.Error("sync pull failed", zap.Error(err))
		response.InternalError(c, "ERR_SYNC_FAILED", "同步失败")
		return
	}

	response.Success(c, result, "同步成功")
}

// Status 获取同步状态
func (h *SyncHandler) Status(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.BadRequest(c, "ERR_TENANT_REQUIRED", "缺少租户标识", nil)
		return
	}

	status := map[string]interface{}{
		"server_version": time.Now().Unix(),
		"sync_time":      time.Now(),
		"connected":      true,
	}

	response.Success(c, status, "获取成功")
}

// RegisterRoutes 注册路由
func (h *SyncHandler) RegisterRoutes(rg *gin.RouterGroup) {
	sync := rg.Group("/sync")
	{
		sync.POST("/push", h.Push)
		sync.POST("/pull", h.Pull)
		sync.GET("/status", h.Status)
	}
}
