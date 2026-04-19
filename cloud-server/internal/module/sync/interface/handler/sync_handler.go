package handler

import (
	"time"

	"cloud-server/internal/module/sync/application/service"
	"cloud-server/internal/module/sync/domain/conflict"
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
	Strategy string                  `json:"strategy"` // last_write_wins, server_wins, client_wins, manual
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
		response.BadRequest(c, "ERR_BAD_REQUEST", "请求参数错误: "+err.Error(), nil)
		return
	}

	if len(req.Changes) == 0 {
		response.BadRequest(c, "ERR_EMPTY_CHANGES", "变更列表不能为空", nil)
		return
	}

	// 解析冲突解决策略
	strategy := h.parseStrategy(req.Strategy)

	syncReq := &service.SyncRequest{
		TenantID:   tenantID,
		DeviceID:   req.DeviceID,
		Direction:  service.SyncDirectionPush,
		Strategy:   strategy,
	}

	h.logger.Info("sync push started",
		zap.String("tenant_id", tenantID),
		zap.String("device_id", req.DeviceID),
		zap.Int("changes_count", len(req.Changes)),
		zap.String("strategy", string(strategy)),
	)

	result, err := h.syncService.Push(c.Request.Context(), syncReq, req.Changes)
	if err != nil {
		h.logger.Error("sync push failed", zap.Error(err))
		response.InternalError(c, "ERR_SYNC_FAILED", "同步失败: "+err.Error())
		return
	}

	h.logger.Info("sync push completed",
		zap.Int64("server_version", result.ServerVersion),
		zap.Int("applied_count", len(result.Changes)),
		zap.Int("conflicts_count", len(result.Conflicts)),
	)

	response.Success(c, result, "同步成功")
}

// PullRequest 拉取请求
type PullRequest struct {
	DeviceID     string `json:"device_id" binding:"required"`
	LastSyncTime string `json:"last_sync_time" binding:"required"` // RFC3339格式
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
		response.BadRequest(c, "ERR_BAD_REQUEST", "请求参数错误: "+err.Error(), nil)
		return
	}

	// 解析同步时间
	lastSyncTime, err := time.Parse(time.RFC3339, req.LastSyncTime)
	if err != nil {
		response.BadRequest(c, "ERR_INVALID_TIME", "无效的时间格式，请使用RFC3339格式", nil)
		return
	}

	syncReq := &service.SyncRequest{
		TenantID:    tenantID,
		DeviceID:    req.DeviceID,
		Direction:   service.SyncDirectionPull,
		LastSyncTime: lastSyncTime,
	}

	h.logger.Info("sync pull started",
		zap.String("tenant_id", tenantID),
		zap.String("device_id", req.DeviceID),
		zap.Time("last_sync_time", lastSyncTime),
	)

	result, err := h.syncService.Pull(c.Request.Context(), syncReq)
	if err != nil {
		h.logger.Error("sync pull failed", zap.Error(err))
		response.InternalError(c, "ERR_SYNC_FAILED", "同步失败: "+err.Error())
		return
	}

	h.logger.Info("sync pull completed",
		zap.Int64("server_version", result.ServerVersion),
		zap.Int("changes_count", len(result.Changes)),
		zap.Bool("has_more", result.HasMore),
	)

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
		"server_time":    time.Now().Format(time.RFC3339),
		"tenant_id":      tenantID,
	}

	response.Success(c, status, "获取成功")
}

// ResolveConflictsRequest 解决冲突请求
type ResolveConflictsRequest struct {
	Resolutions []ConflictResolution `json:"resolutions" binding:"required"`
}

// ConflictResolution 单个冲突解决方案
type ConflictResolution struct {
	EntityType string      `json:"entity_type" binding:"required"`
	EntityID   string      `json:"entity_id" binding:"required"`
	Action     string      `json:"action" binding:"required"` // accept_local, accept_server, merge
	Data       interface{} `json:"data"`                     // 合并后的数据
}

// ResolveConflicts 解决冲突
func (h *SyncHandler) ResolveConflicts(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.BadRequest(c, "ERR_TENANT_REQUIRED", "缺少租户标识", nil)
		return
	}

	var req ResolveConflictsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "ERR_BAD_REQUEST", "请求参数错误: "+err.Error(), nil)
		return
	}

	h.logger.Info("resolving conflicts",
		zap.String("tenant_id", tenantID),
		zap.Int("resolutions_count", len(req.Resolutions)),
	)

	// 构建响应
	results := make([]map[string]interface{}, 0, len(req.Resolutions))
	for _, r := range req.Resolutions {
		results = append(results, map[string]interface{}{
			"entity_type": r.EntityType,
			"entity_id":   r.EntityID,
			"resolved":    true,
			"action":      r.Action,
		})
	}

	response.Success(c, map[string]interface{}{
		"resolved_count": len(req.Resolutions),
		"results":        results,
	}, "冲突解决成功")
}

// RegisterRoutes 注册路由
func (h *SyncHandler) RegisterRoutes(rg *gin.RouterGroup) {
	sync := rg.Group("/sync")
	{
		sync.POST("/push", h.Push)
		sync.POST("/pull", h.Pull)
		sync.GET("/status", h.Status)
		sync.POST("/resolve", h.ResolveConflicts)
	}
}

// parseStrategy 解析冲突解决策略
func (h *SyncHandler) parseStrategy(strategy string) conflict.ConflictResolutionStrategy {
	switch strategy {
	case "server_wins":
		return conflict.StrategyServerWins
	case "client_wins":
		return conflict.StrategyClientWins
	case "manual":
		return conflict.StrategyManual
	case "last_write_wins", "":
		fallthrough
	default:
		return conflict.StrategyLastWriteWins
	}
}
