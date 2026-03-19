package service

import (
	"context"

	"cloud-server/internal/module/auth/domain/entity"
)

// SessionManager defines the session lifecycle contract for auth.
type SessionManager interface {
	Create(ctx context.Context, session *entity.Session) error
	Get(ctx context.Context, sessionID string) (*entity.Session, error)
	UpdateLastActive(ctx context.Context, sessionID string) error
	Revoke(ctx context.Context, sessionID string, reason string) error
}
