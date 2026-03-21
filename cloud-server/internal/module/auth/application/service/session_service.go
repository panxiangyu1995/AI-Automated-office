package service

import (
	"context"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/auth/domain/repository"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// SessionConfig 会话配置
type SessionConfig struct {
	IdleTimeout       time.Duration // 空闲超时时间（默认 30 分钟）
	MaxSessionsPerUser int          // 每个用户最大会话数
	CleanupInterval    time.Duration // 清理间隔
}

// DefaultSessionConfig 默认会话配置
func DefaultSessionConfig() SessionConfig {
	return SessionConfig{
		IdleTimeout:       30 * time.Minute,
		MaxSessionsPerUser: 5,
		CleanupInterval:    5 * time.Minute,
	}
}

// SessionService 会话服务
type SessionService struct {
	sessionRepo repository.SessionRepository
	config      SessionConfig
	logger      *zap.Logger
}

// NewSessionService 创建会话服务
func NewSessionService(
	sessionRepo repository.SessionRepository,
	config SessionConfig,
	logger *zap.Logger,
) *SessionService {
	return &SessionService{
		sessionRepo: sessionRepo,
		config:      config,
		logger:      logger,
	}
}

// CreateSession 创建新会话
func (s *SessionService) CreateSession(ctx context.Context, userID, tenantID, tokenHash, refreshTokenHash, ipAddress, userAgent string) (*model.Session, error) {
	// Check active sessions count
	count, err := s.sessionRepo.CountActiveByUserID(ctx, userID)
	if err != nil {
		s.logger.Error("failed to count active sessions", zap.Error(err), zap.String("user_id", userID))
	}

	// If exceeds max, revoke oldest sessions
	if count >= int64(s.config.MaxSessionsPerUser) {
		activeSessions, err := s.sessionRepo.FindActiveByUserID(ctx, userID)
		if err != nil {
			s.logger.Error("failed to find active sessions", zap.Error(err))
		} else if len(activeSessions) > 0 {
			// Revoke oldest session
			oldest := activeSessions[len(activeSessions)-1]
			err = s.sessionRepo.Revoke(ctx, oldest.ID, "max_sessions_exceeded")
			if err != nil {
				s.logger.Error("failed to revoke oldest session", zap.Error(err))
			} else {
				s.logger.Info("revoked oldest session due to max sessions limit",
					zap.String("user_id", userID),
					zap.String("session_id", oldest.ID))
			}
		}
	}

	session := &model.Session{
		ID:               uuid.New().String(),
		UserID:           userID,
		TenantID:         tenantID,
		TokenHash:        tokenHash,
		RefreshTokenHash: refreshTokenHash,
		IPAddress:        ipAddress,
		UserAgent:        userAgent,
		Status:           model.SessionStatusActive,
		ExpiresAt:        time.Now().Add(24 * time.Hour * 7), // 7 days
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, err
	}

	s.logger.Info("session created",
		zap.String("session_id", session.ID),
		zap.String("user_id", userID))

	return session, nil
}

// ValidateSession 验证会话有效性
func (s *SessionService) ValidateSession(ctx context.Context, tokenHash string) (*model.Session, error) {
	session, err := s.sessionRepo.FindByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, err
	}

	if session == nil {
		return nil, ErrSessionNotFound
	}

	// Check if revoked
	if session.IsRevoked() {
		return nil, ErrSessionRevoked
	}

	// Check if expired
	if session.IsExpired() {
		// Update status to expired
		_ = s.sessionRepo.UpdateStatus(ctx, session.ID, model.SessionStatusExpired, "token_expired")
		return nil, ErrSessionExpired
	}

	// Check idle timeout
	if session.IsIdleTimedOut(s.config.IdleTimeout) {
		// Mark as idle timeout
		_ = s.sessionRepo.UpdateStatus(ctx, session.ID, model.SessionStatusIdleTimeout, "idle_timeout")
		return nil, ErrSessionIdleTimeout
	}

	return session, nil
}

// UpdateActivity 更新会话活动时间
func (s *SessionService) UpdateActivity(ctx context.Context, sessionID string) error {
	return s.sessionRepo.UpdateLastActivity(ctx, sessionID)
}

// RevokeSession 撤销会话
func (s *SessionService) RevokeSession(ctx context.Context, sessionID, reason string) error {
	err := s.sessionRepo.Revoke(ctx, sessionID, reason)
	if err != nil {
		return err
	}

	s.logger.Info("session revoked",
		zap.String("session_id", sessionID),
		zap.String("reason", reason))

	return nil
}

// RevokeAllUserSessions 撤销用户所有会话
func (s *SessionService) RevokeAllUserSessions(ctx context.Context, userID, reason string) error {
	err := s.sessionRepo.RevokeAllByUserID(ctx, userID, reason)
	if err != nil {
		return err
	}

	s.logger.Info("all user sessions revoked",
		zap.String("user_id", userID),
		zap.String("reason", reason))

	return nil
}

// RevokeOtherSessions 撤销除当前会话外的其他会话
func (s *SessionService) RevokeOtherSessions(ctx context.Context, userID, currentSessionID, reason string) (int64, error) {
	count, err := s.sessionRepo.RevokeOtherSessions(ctx, userID, currentSessionID, reason)
	if err != nil {
		return 0, err
	}

	s.logger.Info("other sessions revoked",
		zap.String("user_id", userID),
		zap.Int64("count", count),
		zap.String("reason", reason))

	return count, nil
}

// GetUserSessions 获取用户会话列表
func (s *SessionService) GetUserSessions(ctx context.Context, userID string) ([]*model.Session, error) {
	return s.sessionRepo.FindByUserID(ctx, userID)
}

// GetActiveUserSessions 获取用户活跃会话列表
func (s *SessionService) GetActiveUserSessions(ctx context.Context, userID string) ([]*model.Session, error) {
	return s.sessionRepo.FindActiveByUserID(ctx, userID)
}

// ListSessions 分页查询会话列表
func (s *SessionService) ListSessions(ctx context.Context, tenantID string, userID *string, status *model.SessionStatus, page, pageSize int) ([]*model.Session, int64, error) {
	return s.sessionRepo.ListSessionsWithPagination(ctx, tenantID, userID, status, page, pageSize)
}

// ProcessIdleTimeouts 处理空闲超时会话
func (s *SessionService) ProcessIdleTimeouts(ctx context.Context) (int, error) {
	sessions, err := s.sessionRepo.FindIdleSessions(ctx, s.config.IdleTimeout, 100)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, session := range sessions {
		err := s.sessionRepo.UpdateStatus(ctx, session.ID, model.SessionStatusIdleTimeout, "idle_timeout")
		if err != nil {
			s.logger.Error("failed to mark session as idle timeout",
				zap.Error(err),
				zap.String("session_id", session.ID))
			continue
		}
		count++

		s.logger.Info("session marked as idle timeout",
			zap.String("session_id", session.ID),
			zap.String("user_id", session.UserID))
	}

	return count, nil
}

// ProcessExpiredSessions 处理过期会话
func (s *SessionService) ProcessExpiredSessions(ctx context.Context) (int, error) {
	sessions, err := s.sessionRepo.FindExpiredSessions(ctx, 100)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, session := range sessions {
		err := s.sessionRepo.UpdateStatus(ctx, session.ID, model.SessionStatusExpired, "token_expired")
		if err != nil {
			s.logger.Error("failed to mark session as expired",
				zap.Error(err),
				zap.String("session_id", session.ID))
			continue
		}
		count++
	}

	return count, nil
}

// CleanupOldSessions 清理旧的会话记录
func (s *SessionService) CleanupOldSessions(ctx context.Context) (int64, error) {
	count, err := s.sessionRepo.DeleteExpired(ctx)
	if err != nil {
		return 0, err
	}

	if count > 0 {
		s.logger.Info("cleaned up old sessions", zap.Int64("count", count))
	}

	return count, nil
}

// 会话相关错误
var (
	ErrSessionNotFound    = &SessionError{Message: "session not found"}
	ErrSessionExpired     = &SessionError{Message: "session has expired"}
	ErrSessionRevoked     = &SessionError{Message: "session has been revoked"}
	ErrSessionIdleTimeout = &SessionError{Message: "session timed out due to inactivity"}
)

// SessionError 会话错误
type SessionError struct {
	Message string
}

func (e *SessionError) Error() string {
	return e.Message
}
