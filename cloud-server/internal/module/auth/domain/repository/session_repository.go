package repository

import (
	"context"
	"time"

	"cloud-server/internal/model"
)

// SessionRepository 会话仓储接口
type SessionRepository interface {
	// Create 创建会话
	Create(ctx context.Context, session *model.Session) error

	// FindByID 根据 ID 查找会话
	FindByID(ctx context.Context, sessionID string) (*model.Session, error)

	// FindByTokenHash 根据 Token Hash 查找会话
	FindByTokenHash(ctx context.Context, tokenHash string) (*model.Session, error)

	// FindByUserID 查找用户的所有会话
	FindByUserID(ctx context.Context, userID string) ([]*model.Session, error)

	// FindActiveByUserID 查找用户的所有活跃会话
	FindActiveByUserID(ctx context.Context, userID string) ([]*model.Session, error)

	// FindIdleSessions 查找空闲超时的会话
	FindIdleSessions(ctx context.Context, idleTimeout time.Duration, limit int) ([]*model.Session, error)

	// FindExpiredSessions 查找过期的会话
	FindExpiredSessions(ctx context.Context, limit int) ([]*model.Session, error)

	// UpdateLastActivity 更新最后活动时间
	UpdateLastActivity(ctx context.Context, sessionID string) error

	// UpdateStatus 更新会话状态
	UpdateStatus(ctx context.Context, sessionID string, status model.SessionStatus, reason string) error

	// Revoke 撤销会话
	Revoke(ctx context.Context, sessionID, reason string) error

	// RevokeAllByUserID 撤销用户所有会话
	RevokeAllByUserID(ctx context.Context, userID, reason string) error

	// RevokeOtherSessions 撤销用户除指定会话外的所有会话
	RevokeOtherSessions(ctx context.Context, userID, excludeSessionID, reason string) (int64, error)

	// DeleteExpired 删除过期会话
	DeleteExpired(ctx context.Context) (int64, error)

	// CountActiveByUserID 统计用户活跃会话数
	CountActiveByUserID(ctx context.Context, userID string) (int64, error)

	// ListSessionsWithPagination 分页查询会话列表
	ListSessionsWithPagination(ctx context.Context, tenantID string, userID *string, status *model.SessionStatus, page, pageSize int) ([]*model.Session, int64, error)
}
