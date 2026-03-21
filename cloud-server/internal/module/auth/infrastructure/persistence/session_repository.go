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
	if session.Status == "" {
		session.Status = model.SessionStatusActive
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO sessions (id, user_id, tenant_id, token_hash, refresh_token_hash, 
		                      device_info, ip_address, user_agent, status, expires_at, created_at, last_activity_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`, session.ID, session.UserID, session.TenantID, session.TokenHash, session.RefreshTokenHash,
		session.DeviceInfo, session.IPAddress, session.UserAgent, session.Status, session.ExpiresAt,
		session.CreatedAt, session.LastActivityAt,
	)
	return err
}

// scanSession scans a session from database row
func scanSession(scanner interface {
	Scan(dest ...interface{}) error
}) (*model.Session, error) {
	session := &model.Session{}
	err := scanner.Scan(
		&session.ID, &session.UserID, &session.TenantID, &session.TokenHash, &session.RefreshTokenHash,
		&session.DeviceInfo, &session.IPAddress, &session.UserAgent, &session.Status,
		&session.RevokedAt, &session.RevokedReason, &session.ExpiresAt,
		&session.CreatedAt, &session.LastActivityAt, &session.DeletedAt,
	)
	if err != nil {
		return nil, err
	}
	return session, nil
}

// FindByID 根据 ID 查找会话
func (r *SessionRepositoryImpl) FindByID(ctx context.Context, sessionID string) (*model.Session, error) {
	session, err := scanSession(r.db.QueryRowContext(ctx, `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, status, revoked_at, revoked_reason, expires_at, 
		       created_at, last_activity_at, deleted_at
		FROM sessions
		WHERE id = $1 AND deleted_at IS NULL
		LIMIT 1
	`, sessionID))
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
	session, err := scanSession(r.db.QueryRowContext(ctx, `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, status, revoked_at, revoked_reason, expires_at, 
		       created_at, last_activity_at, deleted_at
		FROM sessions
		WHERE token_hash = $1 AND deleted_at IS NULL
		LIMIT 1
	`, tokenHash))
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
		       ip_address, user_agent, status, revoked_at, revoked_reason, expires_at, 
		       created_at, last_activity_at, deleted_at
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
		session, err := scanSession(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}
	return sessions, nil
}

// FindActiveByUserID 查找用户的所有活跃会话
func (r *SessionRepositoryImpl) FindActiveByUserID(ctx context.Context, userID string) ([]*model.Session, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, status, revoked_at, revoked_reason, expires_at, 
		       created_at, last_activity_at, deleted_at
		FROM sessions
		WHERE user_id = $1 AND deleted_at IS NULL AND status = 'active' AND expires_at > NOW()
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*model.Session
	for rows.Next() {
		session, err := scanSession(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}
	return sessions, nil
}

// FindIdleSessions 查找空闲超时的会话
func (r *SessionRepositoryImpl) FindIdleSessions(ctx context.Context, idleTimeout time.Duration, limit int) ([]*model.Session, error) {
	idleThreshold := time.Now().Add(-idleTimeout)
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, status, revoked_at, revoked_reason, expires_at, 
		       created_at, last_activity_at, deleted_at
		FROM sessions
		WHERE deleted_at IS NULL 
		  AND status = 'active' 
		  AND last_activity_at < $1
		  AND expires_at > NOW()
		ORDER BY last_activity_at ASC
		LIMIT $2
	`, idleThreshold, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*model.Session
	for rows.Next() {
		session, err := scanSession(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}
	return sessions, nil
}

// FindExpiredSessions 查找过期的会话
func (r *SessionRepositoryImpl) FindExpiredSessions(ctx context.Context, limit int) ([]*model.Session, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, status, revoked_at, revoked_reason, expires_at, 
		       created_at, last_activity_at, deleted_at
		FROM sessions
		WHERE deleted_at IS NULL 
		  AND status = 'active' 
		  AND expires_at <= NOW()
		ORDER BY expires_at ASC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*model.Session
	for rows.Next() {
		session, err := scanSession(rows)
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

// UpdateStatus 更新会话状态
func (r *SessionRepositoryImpl) UpdateStatus(ctx context.Context, sessionID string, status model.SessionStatus, reason string) error {
	now := time.Now()
	if status == model.SessionStatusRevoked || status == model.SessionStatusIdleTimeout {
		_, err := r.db.ExecContext(ctx, `
			UPDATE sessions SET status = $1, revoked_at = $2, revoked_reason = $3 WHERE id = $4
		`, status, now, reason, sessionID)
		return err
	}
	_, err := r.db.ExecContext(ctx, `
		UPDATE sessions SET status = $1, revoked_reason = $2 WHERE id = $3
	`, status, reason, sessionID)
	return err
}

// Revoke 撤销会话
func (r *SessionRepositoryImpl) Revoke(ctx context.Context, sessionID, reason string) error {
	return r.UpdateStatus(ctx, sessionID, model.SessionStatusRevoked, reason)
}

// RevokeAllByUserID 撤销用户所有会话
func (r *SessionRepositoryImpl) RevokeAllByUserID(ctx context.Context, userID, reason string) error {
	now := time.Now()
	_, err := r.db.ExecContext(ctx, `
		UPDATE sessions 
		SET status = 'revoked', revoked_at = $1, revoked_reason = $2 
		WHERE user_id = $3 AND deleted_at IS NULL AND status = 'active'
	`, now, reason, userID)
	return err
}

// RevokeOtherSessions 撤销用户除指定会话外的所有会话
func (r *SessionRepositoryImpl) RevokeOtherSessions(ctx context.Context, userID, excludeSessionID, reason string) (int64, error) {
	now := time.Now()
	result, err := r.db.ExecContext(ctx, `
		UPDATE sessions 
		SET status = 'revoked', revoked_at = $1, revoked_reason = $2 
		WHERE user_id = $3 AND id != $4 AND deleted_at IS NULL AND status = 'active'
	`, now, reason, userID, excludeSessionID)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// DeleteExpired 删除过期会话
func (r *SessionRepositoryImpl) DeleteExpired(ctx context.Context) (int64, error) {
	result, err := r.db.ExecContext(ctx, `
		DELETE FROM sessions 
		WHERE (expires_at < NOW() OR status IN ('expired', 'revoked', 'idle_timeout')) 
		AND deleted_at IS NULL
	`)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// CountActiveByUserID 统计用户活跃会话数
func (r *SessionRepositoryImpl) CountActiveByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM sessions 
		WHERE user_id = $1 AND deleted_at IS NULL AND status = 'active' AND expires_at > NOW()
	`, userID).Scan(&count)
	return count, err
}

// ListSessionsWithPagination 分页查询会话列表
func (r *SessionRepositoryImpl) ListSessionsWithPagination(ctx context.Context, tenantID string, userID *string, status *model.SessionStatus, page, pageSize int) ([]*model.Session, int64, error) {
	offset := (page - 1) * pageSize

	// Build the WHERE clause
	whereClause := "WHERE tenant_id = $1 AND deleted_at IS NULL"
	args := []interface{}{tenantID}
	argIndex := 2

	if userID != nil {
		whereClause += " AND user_id = $" + string(rune('0'+argIndex))
		args = append(args, *userID)
		argIndex++
	}

	if status != nil {
		whereClause += " AND status = $" + string(rune('0'+argIndex))
		args = append(args, *status)
		argIndex++
	}

	// Get total count
	var total int64
	countQuery := "SELECT COUNT(*) FROM sessions " + whereClause
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	query := `
		SELECT id, user_id, tenant_id, token_hash, refresh_token_hash, device_info, 
		       ip_address, user_agent, status, revoked_at, revoked_reason, expires_at, 
		       created_at, last_activity_at, deleted_at
		FROM sessions 
		` + whereClause + `
		ORDER BY created_at DESC
		LIMIT $` + string(rune('0'+argIndex)) + ` OFFSET $` + string(rune('0'+argIndex+1))

	args = append(args, pageSize, offset)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var sessions []*model.Session
	for rows.Next() {
		session, err := scanSession(rows)
		if err != nil {
			return nil, 0, err
		}
		sessions = append(sessions, session)
	}

	return sessions, total, nil
}
