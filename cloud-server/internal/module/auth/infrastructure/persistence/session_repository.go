package persistence

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/auth/domain/repository"

	"github.com/google/uuid"
)

// SessionRepositoryImpl 会话仓储实现
type SessionRepositoryImpl struct {
	db *sql.DB
}

// NewSessionRepository 创建会话仓储
func NewSessionRepository(db *sql.DB) repository.SessionRepository {
	return &SessionRepositoryImpl{db: db}
}

// Create 创建会话
func (r *SessionRepositoryImpl) Create(ctx context.Context, session *model.Session) error {
	if session.ID == "" {
		session.ID = uuid.New().String()
	}
	now := time.Now()
	session.CreatedAt = now
	session.LastActivityAt = now

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO sessions (id, user_id, tenant_id, token_hash, refresh_token_hash, 
		                      device_info, ip_address, user_agent, expires_at, created_at, last_activity_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, session.ID, session.UserID, session.TenantID, session.TokenHash, session.RefreshTokenHash,
		session.DeviceInfo, session.IPAddress, session.UserAgent, session.ExpiresAt,
		session.CreatedAt, session.LastActivityAt,
	)
	return err
}

// FindByID 根据 ID 查找会话
func (r *SessionRepositoryImpl) FindByID(ctx context.Context, sessionID string) (*model.Session, error) {
	session := &model.Session{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, expires_at, created_at, last_activity_at, deleted_at
		FROM sessions
		WHERE id = $1 AND deleted_at IS NULL
		LIMIT 1
	`, sessionID).Scan(
		&session.ID, &session.UserID, &session.TenantID, &session.TokenHash, &session.RefreshTokenHash,
		&session.DeviceInfo, &session.IPAddress, &session.UserAgent, &session.ExpiresAt,
		&session.CreatedAt, &session.LastActivityAt, &session.DeletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return session, nil
}

// FindByTokenHash 根据 Token Hash 查找会话
func (r *SessionRepositoryImpl) FindByTokenHash(ctx context.Context, tokenHash string) (*model.Session, error) {
	session := &model.Session{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, expires_at, created_at, last_activity_at, deleted_at
		FROM sessions
		WHERE token_hash = $1 AND deleted_at IS NULL
		LIMIT 1
	`, tokenHash).Scan(
		&session.ID, &session.UserID, &session.TenantID, &session.TokenHash, &session.RefreshTokenHash,
		&session.DeviceInfo, &session.IPAddress, &session.UserAgent, &session.ExpiresAt,
		&session.CreatedAt, &session.LastActivityAt, &session.DeletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return session, nil
}

// FindByUserID 查找用户的所有会话
func (r *SessionRepositoryImpl) FindByUserID(ctx context.Context, userID string) ([]*model.Session, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, expires_at, created_at, last_activity_at, deleted_at
		FROM sessions
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*model.Session
	for rows.Next() {
		session := &model.Session{}
		err := rows.Scan(
			&session.ID, &session.UserID, &session.TenantID, &session.TokenHash, &session.RefreshTokenHash,
			&session.DeviceInfo, &session.IPAddress, &session.UserAgent, &session.ExpiresAt,
			&session.CreatedAt, &session.LastActivityAt, &session.DeletedAt,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}
	return sessions, nil
}

// UpdateLastActivity 更新最后活动时间
func (r *SessionRepositoryImpl) UpdateLastActivity(ctx context.Context, sessionID string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE sessions SET last_activity_at = NOW() WHERE id = $1
	`, sessionID)
	return err
}

// Revoke 撤销会话
func (r *SessionRepositoryImpl) Revoke(ctx context.Context, sessionID, reason string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE sessions SET deleted_at = NOW() WHERE id = $1
	`, sessionID)
	return err
}

// RevokeAllByUserID 撤销用户所有会话
func (r *SessionRepositoryImpl) RevokeAllByUserID(ctx context.Context, userID, reason string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE sessions SET deleted_at = NOW() WHERE user_id = $1 AND deleted_at IS NULL
	`, userID)
	return err
}

// DeleteExpired 删除过期会话
func (r *SessionRepositoryImpl) DeleteExpired(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx, `
		DELETE FROM sessions WHERE expires_at < NOW() AND deleted_at IS NULL
	`)
	return err
}
