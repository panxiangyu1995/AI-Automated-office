package repository

import (
	"context"

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
	
	// UpdateLastActivity 更新最后活动时间
	UpdateLastActivity(ctx context.Context, sessionID string) error
	
	// Revoke 撤销会话
	Revoke(ctx context.Context, sessionID, reason string) error
	
	// RevokeAllByUserID 撤销用户所有会话
	RevokeAllByUserID(ctx context.Context, userID, reason string) error
	
	// DeleteExpired 删除过期会话
	DeleteExpired(ctx context.Context) error
}
