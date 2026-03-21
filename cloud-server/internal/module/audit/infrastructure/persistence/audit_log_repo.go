package persistence

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/audit/domain/repository"

	"github.com/google/uuid"
)

// AuditLogRepoImpl 审计日志仓储实现
type AuditLogRepoImpl struct {
	db *sql.DB
}

// NewAuditLogRepository 创建审计日志仓储
func NewAuditLogRepository(db *sql.DB) repository.AuditLogRepository {
	return &AuditLogRepoImpl{db: db}
}

// Create 创建审计日志
func (r *AuditLogRepoImpl) Create(ctx context.Context, log *model.AuditLog) error {
	if log.ID == "" {
		log.ID = uuid.New().String()
	}
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now()
	}

	query := `INSERT INTO audit_logs (id, tenant_id, operator_id, operator_name, target_id, target_type,
		                event_type, resource, action, result, old_values, new_values,
		                ip_address, user_agent, trace_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`

	_, err := r.db.ExecContext(ctx, query,
		log.ID, log.TenantID, log.OperatorID, log.OperatorName, log.TargetID, log.TargetType,
		log.EventType, log.Resource, log.Action, log.Result, log.OldValues, log.NewValues,
		log.IPAddress, log.UserAgent, log.TraceID, log.CreatedAt)
	return err
}

// CreateBatch 批量创建审计日志
func (r *AuditLogRepoImpl) CreateBatch(ctx context.Context, logs []*model.AuditLog) error {
	if len(logs) == 0 {
		return nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `INSERT INTO audit_logs (id, tenant_id, operator_id, operator_name, target_id, target_type,
		                event_type, resource, action, result, old_values, new_values,
		                ip_address, user_agent, trace_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`

	stmt, err := tx.PrepareContext(ctx, query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now()
	for _, log := range logs {
		if log.ID == "" {
			log.ID = uuid.New().String()
		}
		if log.CreatedAt.IsZero() {
			log.CreatedAt = now
		}

		_, err := stmt.ExecContext(ctx, log.ID, log.TenantID, log.OperatorID, log.OperatorName,
			log.TargetID, log.TargetType, log.EventType, log.Resource, log.Action, log.Result,
			log.OldValues, log.NewValues, log.IPAddress, log.UserAgent, log.TraceID, log.CreatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// FindByID 根据 ID 查找审计日志
func (r *AuditLogRepoImpl) FindByID(ctx context.Context, id string) (*model.AuditLog, error) {
	query := `SELECT id, tenant_id, operator_id, operator_name, target_id, target_type,
		       event_type, resource, action, result, old_values, new_values,
		       ip_address, user_agent, trace_id, created_at
		FROM audit_logs
		WHERE id = $1`

	log := &model.AuditLog{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&log.ID, &log.TenantID, &log.OperatorID, &log.OperatorName, &log.TargetID, &log.TargetType,
		&log.EventType, &log.Resource, &log.Action, &log.Result, &log.OldValues, &log.NewValues,
		&log.IPAddress, &log.UserAgent, &log.TraceID, &log.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return log, nil
}

// List 查询审计日志列表
func (r *AuditLogRepoImpl) List(ctx context.Context, query *repository.AuditLogQuery) ([]*model.AuditLog, int64, error) {
	// Build WHERE clause
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if query.TenantID != "" {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argIndex)
		args = append(args, query.TenantID)
		argIndex++
	}
	if query.OperatorID != "" {
		whereClause += fmt.Sprintf(" AND operator_id = $%d", argIndex)
		args = append(args, query.OperatorID)
		argIndex++
	}
	if query.TargetID != "" {
		whereClause += fmt.Sprintf(" AND target_id = $%d", argIndex)
		args = append(args, query.TargetID)
		argIndex++
	}
	if query.TargetType != "" {
		whereClause += fmt.Sprintf(" AND target_type = $%d", argIndex)
		args = append(args, query.TargetType)
		argIndex++
	}
	if query.EventType != "" {
		whereClause += fmt.Sprintf(" AND event_type = $%d", argIndex)
		args = append(args, query.EventType)
		argIndex++
	}
	if query.Resource != "" {
		whereClause += fmt.Sprintf(" AND resource = $%d", argIndex)
		args = append(args, query.Resource)
		argIndex++
	}
	if query.Action != "" {
		whereClause += fmt.Sprintf(" AND action = $%d", argIndex)
		args = append(args, query.Action)
		argIndex++
	}
	if query.Result != "" {
		whereClause += fmt.Sprintf(" AND result = $%d", argIndex)
		args = append(args, query.Result)
		argIndex++
	}
	if query.TraceID != "" {
		whereClause += fmt.Sprintf(" AND trace_id = $%d", argIndex)
		args = append(args, query.TraceID)
		argIndex++
	}
	if query.StartTime != nil {
		whereClause += fmt.Sprintf(" AND created_at >= $%d", argIndex)
		args = append(args, query.StartTime)
		argIndex++
	}
	if query.EndTime != nil {
		whereClause += fmt.Sprintf(" AND created_at <= $%d", argIndex)
		args = append(args, query.EndTime)
		argIndex++
	}

	// Count total
	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM audit_logs %s", whereClause)
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Build ORDER BY
	orderBy := "created_at"
	if query.OrderBy != "" {
		orderBy = query.OrderBy
	}
	orderDir := "ASC"
	if query.OrderDesc {
		orderDir = "DESC"
	}

	// Pagination
	page := query.Page
	if page < 1 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	offset := (page - 1) * pageSize

	// Query list
	listQuery := fmt.Sprintf(`SELECT id, tenant_id, operator_id, operator_name, target_id, target_type,
		       event_type, resource, action, result, old_values, new_values,
		       ip_address, user_agent, trace_id, created_at
		FROM audit_logs %s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d`, whereClause, orderBy, orderDir, argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []*model.AuditLog
	for rows.Next() {
		log := &model.AuditLog{}
		err := rows.Scan(
			&log.ID, &log.TenantID, &log.OperatorID, &log.OperatorName, &log.TargetID, &log.TargetType,
			&log.EventType, &log.Resource, &log.Action, &log.Result, &log.OldValues, &log.NewValues,
			&log.IPAddress, &log.UserAgent, &log.TraceID, &log.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		logs = append(logs, log)
	}

	return logs, total, nil
}

// DeleteBefore 删除指定时间之前的审计日志
func (r *AuditLogRepoImpl) DeleteBefore(ctx context.Context, before time.Time) (int64, error) {
	query := `DELETE FROM audit_logs WHERE created_at < $1`
	result, err := r.db.ExecContext(ctx, query, before)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}