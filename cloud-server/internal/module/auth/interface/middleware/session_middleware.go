package middleware

import (
	"net/http"
	"strings"

	"cloud-server/internal/module/auth/application/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// SessionMiddleware 会话验证中间件
// 验证会话有效性并更新活跃时间
type SessionMiddleware struct {
	sessionService *service.SessionService
	logger         *zap.Logger
}

// NewSessionMiddleware 创建会话中间件
func NewSessionMiddleware(
	sessionService *service.SessionService,
	logger *zap.Logger,
) *SessionMiddleware {
	return &SessionMiddleware{
		sessionService: sessionService,
		logger:         logger,
	}
}

// RequireSession 要求有效会话的中间件
func (m *SessionMiddleware) RequireSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "missing authorization header",
			})
			c.Abort()
			return
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Validate session using token hash
		session, err := m.sessionService.ValidateSession(c.Request.Context(), hashToken(token))
		if err != nil {
			m.handleSessionError(c, err)
			return
		}

		// Store session in context
		c.Set("session", session)
		c.Set("session_id", session.ID)
		c.Set("user_id", session.UserID)
		c.Set("tenant_id", session.TenantID)

		// Update last activity time (async for performance)
		go func(sessionID string) {
			ctx := c.Request.Context()
			if err := m.sessionService.UpdateActivity(ctx, sessionID); err != nil {
				m.logger.Debug("failed to update session activity",
					zap.Error(err),
					zap.String("session_id", sessionID))
			}
		}(session.ID)

		c.Next()
	}
}

// OptionalSession 可选会话验证中间件
// 不强制要求会话，但如果存在则验证
func (m *SessionMiddleware) OptionalSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.Next()
			return
		}

		token := parts[1]
		session, err := m.sessionService.ValidateSession(c.Request.Context(), hashToken(token))
		if err != nil {
			// Just log and continue, don't abort
			m.logger.Debug("optional session validation failed", zap.Error(err))
			c.Next()
			return
		}

		c.Set("session", session)
		c.Set("session_id", session.ID)
		c.Set("user_id", session.UserID)
		c.Set("tenant_id", session.TenantID)

		// Update activity async
		go func(sessionID string) {
			if err := m.sessionService.UpdateActivity(c.Request.Context(), sessionID); err != nil {
				m.logger.Debug("failed to update session activity", zap.Error(err))
			}
		}(session.ID)

		c.Next()
	}
}

// handleSessionError 处理会话错误
func (m *SessionMiddleware) handleSessionError(c *gin.Context, err error) {
	switch err {
	case service.ErrSessionNotFound:
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "session_not_found",
			"message": "会话不存在，请重新登录",
			"code":    "SESSION_NOT_FOUND",
		})
	case service.ErrSessionExpired:
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "session_expired",
			"message": "会话已过期，请重新登录",
			"code":    "SESSION_EXPIRED",
		})
	case service.ErrSessionRevoked:
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "session_revoked",
			"message": "会话已被撤销，请重新登录",
			"code":    "SESSION_REVOKED",
		})
	case service.ErrSessionIdleTimeout:
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "session_idle_timeout",
			"message": "会话因长时间未活动已超时，请重新登录",
			"code":    "SESSION_IDLE_TIMEOUT",
		})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": "会话验证失败",
		})
	}
	c.Abort()
}

// hashToken 简单的 token 哈希（与 crypto 包中的方法一致）
func hashToken(token string) string {
	// Use SHA256 for token hashing
	// In production, this should match the token hashing used in auth service
	return token // Placeholder - actual implementation would use proper hashing
}

// GetSession 从上下文获取会话
func GetSession(c *gin.Context) (sessionID, userID, tenantID string, ok bool) {
	sid, exists := c.Get("session_id")
	if !exists {
		return "", "", "", false
	}
	sessionID, ok = sid.(string)
	if !ok {
		return "", "", "", false
	}

	uid, exists := c.Get("user_id")
	if !exists {
		return "", "", "", false
	}
	userID, ok = uid.(string)
	if !ok {
		return "", "", "", false
	}

	tid, exists := c.Get("tenant_id")
	if !exists {
		return "", "", "", false
	}
	tenantID, ok = tid.(string)
	if !ok {
		return "", "", "", false
	}

	return sessionID, userID, tenantID, true
}
