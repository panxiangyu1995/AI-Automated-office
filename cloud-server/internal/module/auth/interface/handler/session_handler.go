package handler

import (
	"net/http"

	"cloud-server/internal/model"
	"cloud-server/internal/module/auth/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// SessionHandler 会话处理器
type SessionHandler struct {
	sessionService *service.SessionService
	logger         *zap.Logger
}

// NewSessionHandler 创建会话处理器
func NewSessionHandler(
	sessionService *service.SessionService,
	logger *zap.Logger,
) *SessionHandler {
	return &SessionHandler{
		sessionService: sessionService,
		logger:         logger,
	}
}

// SessionListRequest 会话列表请求
type SessionListRequest struct {
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"page_size" binding:"min=1,max=100"`
	UserID   string `form:"user_id"`
	Status   string `form:"status"`
}

// SessionListResponse 会话列表响应
type SessionListResponse struct {
	Items      []SessionItem `json:"items"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	PageSize   int           `json:"page_size"`
	TotalPages int           `json:"total_pages"`
}

// SessionItem 会话项
type SessionItem struct {
	ID             string `json:"id"`
	UserID         string `json:"user_id"`
	IPAddress      string `json:"ip_address"`
	UserAgent      string `json:"user_agent"`
	Status         string `json:"status"`
	CreatedAt      string `json:"created_at"`
	LastActivityAt string `json:"last_activity_at"`
	ExpiresAt      string `json:"expires_at"`
	RevokedAt      string `json:"revoked_at,omitempty"`
	RevokedReason  string `json:"revoked_reason,omitempty"`
}

// RevokeSessionRequest 撤销会话请求
type RevokeSessionRequest struct {
	Reason string `json:"reason" binding:"required"`
}

// RevokeAllSessionsRequest 撤销所有会话请求
type RevokeAllSessionsRequest struct {
	Reason string `json:"reason"`
}

// ListSessions 获取会话列表
func (h *SessionHandler) ListSessions(c *gin.Context) {
	var req SessionListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "参数错误: "+err.Error(), nil)
		return
	}

	// Set defaults
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 20
	}

	// Get tenant ID from context
	tid, exists := c.Get("tenant_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权", nil)
		return
	}
	tenantID := tid.(string)

	// Parse status filter
	var statusFilter *model.SessionStatus
	if req.Status != "" {
		s := model.SessionStatus(req.Status)
		statusFilter = &s
	}

	// Parse user ID filter
	var userIDFilter *string
	if req.UserID != "" {
		userIDFilter = &req.UserID
	}

	// Query sessions
	sessions, total, err := h.sessionService.ListSessions(
		c.Request.Context(),
		tenantID,
		userIDFilter,
		statusFilter,
		req.Page,
		req.PageSize,
	)
	if err != nil {
		h.logger.Error("failed to list sessions", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "查询会话列表失败", nil)
		return
	}

	// Calculate total pages
	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	// Convert to response
	items := make([]SessionItem, len(sessions))
	for i, s := range sessions {
		items[i] = SessionItem{
			ID:             s.ID,
			UserID:         s.UserID,
			IPAddress:      s.IPAddress,
			UserAgent:      s.UserAgent,
			Status:         string(s.Status),
			CreatedAt:      s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			LastActivityAt: s.LastActivityAt.Format("2006-01-02T15:04:05Z07:00"),
			ExpiresAt:      s.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
		}
		if s.RevokedAt != nil {
			items[i].RevokedAt = s.RevokedAt.Format("2006-01-02T15:04:05Z07:00")
			items[i].RevokedReason = s.RevokedReason
		}
	}

	response.Success(c, SessionListResponse{
		Items:      items,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, "获取成功")
}

// GetMySessions 获取当前用户的会话列表
func (h *SessionHandler) GetMySessions(c *gin.Context) {
	uid, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权", nil)
		return
	}
	userID := uid.(string)

	sessions, err := h.sessionService.GetUserSessions(c.Request.Context(), userID)
	if err != nil {
		h.logger.Error("failed to get user sessions", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取会话列表失败", nil)
		return
	}

	// Get current session ID
	currentSessionID, _ := c.Get("session_id")

	// Convert to response
	items := make([]SessionItem, len(sessions))
	for i, s := range sessions {
		items[i] = SessionItem{
			ID:             s.ID,
			UserID:         s.UserID,
			IPAddress:      s.IPAddress,
			UserAgent:      s.UserAgent,
			Status:         string(s.Status),
			CreatedAt:      s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			LastActivityAt: s.LastActivityAt.Format("2006-01-02T15:04:05Z07:00"),
			ExpiresAt:      s.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
		}
		if s.RevokedAt != nil {
			items[i].RevokedAt = s.RevokedAt.Format("2006-01-02T15:04:05Z07:00")
			items[i].RevokedReason = s.RevokedReason
		}

		// Mark current session
		if currentSessionID != nil && s.ID == currentSessionID.(string) {
			items[i].Status = string(s.Status) + " (current)"
		}
	}

	response.Success(c, items, "获取成功")
}

// RevokeSession 撤销指定会话
func (h *SessionHandler) RevokeSession(c *gin.Context) {
	sessionID := c.Param("session_id")
	if sessionID == "" {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "会话ID不能为空", nil)
		return
	}

	var req RevokeSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "参数错误: "+err.Error(), nil)
		return
	}

	err := h.sessionService.RevokeSession(c.Request.Context(), sessionID, req.Reason)
	if err != nil {
		h.logger.Error("failed to revoke session", zap.Error(err), zap.String("session_id", sessionID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "撤销会话失败", nil)
		return
	}

	response.Success[any](c, nil, "撤销成功")
}

// RevokeMyOtherSessions 撤销当前用户的其他会话
func (h *SessionHandler) RevokeMyOtherSessions(c *gin.Context) {
	uid, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权", nil)
		return
	}
	userID := uid.(string)

	sid, exists := c.Get("session_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权", nil)
		return
	}
	sessionID := sid.(string)

	count, err := h.sessionService.RevokeOtherSessions(
		c.Request.Context(),
		userID,
		sessionID,
		"user_revoked_others",
	)
	if err != nil {
		h.logger.Error("failed to revoke other sessions", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "撤销其他会话失败", nil)
		return
	}

	response.Success(c, map[string]int64{"revoked_count": count}, "撤销成功")
}

// RevokeAllUserSessions 撤销用户所有会话（管理员操作）
func (h *SessionHandler) RevokeAllUserSessions(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "BAD_REQUEST", "用户ID不能为空", nil)
		return
	}

	var req RevokeAllSessionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Use default reason if parsing fails
		req.Reason = "admin_revoked"
	}

	if req.Reason == "" {
		req.Reason = "admin_revoked"
	}

	err := h.sessionService.RevokeAllUserSessions(c.Request.Context(), userID, req.Reason)
	if err != nil {
		h.logger.Error("failed to revoke all user sessions", zap.Error(err), zap.String("user_id", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "撤销用户会话失败", nil)
		return
	}

	response.Success[any](c, nil, "撤销成功")
}

// RegisterRoutes 注册路由
func (h *SessionHandler) RegisterRoutes(r *gin.RouterGroup) {
	// User session routes (authenticated user)
	auth := r.Group("/auth")
	{
		auth.GET("/sessions", h.GetMySessions)
		auth.GET("/sessions/status", h.CheckSessionStatus)
		auth.POST("/sessions/revoke-others", h.RevokeMyOtherSessions)
	}

	// Admin session routes
	admin := r.Group("/admin")
	{
		admin.GET("/sessions", h.ListSessions)
		admin.POST("/sessions/:session_id/revoke", h.RevokeSession)
		admin.POST("/users/:user_id/sessions/revoke-all", h.RevokeAllUserSessions)
	}
}

// SessionStatusResponse 会话状态响应
type SessionStatusResponse struct {
	Valid          bool   `json:"valid"`
	SessionID      string `json:"session_id,omitempty"`
	UserID         string `json:"user_id,omitempty"`
	TenantID       string `json:"tenant_id,omitempty"`
	Status         string `json:"status,omitempty"`
	ExpiresAt      string `json:"expires_at,omitempty"`
	LastActivityAt string `json:"last_activity_at,omitempty"`
	Reason         string `json:"reason,omitempty"`
}

// CheckSessionStatus 检查会话状态
func (h *SessionHandler) CheckSessionStatus(c *gin.Context) {
	// Get session ID from context
	sid, exists := c.Get("session_id")
	if !exists {
		response.Success(c, SessionStatusResponse{
			Valid:  false,
			Reason: "no_session",
		}, "会话不存在")
		return
	}
	sessionID := sid.(string)

	// Get tenant ID
	tid, exists := c.Get("tenant_id")
	if !exists {
		response.Success(c, SessionStatusResponse{
			Valid:  false,
			Reason: "no_tenant",
		}, "租户不存在")
		return
	}
	tenantID := tid.(string)

	// Validate session
	session, err := h.sessionService.ValidateSessionByID(c.Request.Context(), sessionID, tenantID)
	if err != nil || session == nil {
		response.Success(c, SessionStatusResponse{
			Valid:  false,
			Reason: "session_invalid",
		}, "会话无效")
		return
	}

	// Return session status
	response.Success(c, SessionStatusResponse{
		Valid:          true,
		SessionID:      session.ID,
		UserID:         session.UserID,
		TenantID:       session.TenantID,
		Status:         string(session.Status),
		ExpiresAt:      session.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
		LastActivityAt: session.LastActivityAt.Format("2006-01-02T15:04:05Z07:00"),
	}, "会话有效")
}
