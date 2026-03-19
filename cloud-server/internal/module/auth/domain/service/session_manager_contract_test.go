package service

import (
	"context"
	"testing"

	"cloud-server/internal/module/auth/domain/entity"
)

type stubSessionManager struct{}

func (stubSessionManager) Create(context.Context, *entity.Session) error { return nil }
func (stubSessionManager) Get(context.Context, string) (*entity.Session, error) {
	return &entity.Session{}, nil
}
func (stubSessionManager) UpdateLastActive(context.Context, string) error { return nil }
func (stubSessionManager) Revoke(context.Context, string, string) error   { return nil }

func TestSessionManagerInterface(t *testing.T) {
	t.Parallel()
	var _ SessionManager = (*stubSessionManager)(nil)
}
