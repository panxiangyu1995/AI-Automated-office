package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"cloud-server/internal/model"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// AuditService 审计日志服务
type AuditService struct {
	db     *sql.DB
	logger *zap.Logger
}

// NewAuditService 创建审计日志服务
func NewAuditService(db *sql.DB, logger *zap.Logger) *AuditService {
	return &AuditService{
		db:     db,
		logger: logger,
	}
}

// AuditEntry 审计日志条目
type AuditEntry struct {
	TenantID     string
	OperatorID   string
	OperatorName string
	TargetID     string
	TargetType   string
	EventType    string
	Resource     string
	Action       string
	Result       string
	OldValues    interface{}
	NewValues    interface{}
	IPAddress    string
	UserAgent    string
	TraceID      string
}

// Log 记录审计日志
func (s *AuditService) Log(ctx context.Context, entry *AuditEntry) error {
	var oldValuesJSON, newValuesJSON []byte
	var err error

	if entry.OldValues != nil {
		oldValuesJSON, err = json.Marshal(entry.OldValues)
		if err != nil {
			s.logger.Warn("failed to marshal old values", zap.Error(err))
		}
	}

	if entry.NewValues != nil {
		newValuesJSON, err = json.Marshal(entry.NewValues)
		if err != nil {
			s.logger.Warn("failed to marshal new values", zap.Error(err))
		}
	}

	result := entry.Result
	if result == "" {
		result = model.ResultSuccess
	}

	query := `
		INSERT INTO audit_logs (
			id, tenant_id, operator_id, operator_name, target_id, target_type,
			event_type, resource, action, result, old_values, new_values,
			ip_address, user_agent, trace_id, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`

	_, err = s.db.ExecContext(ctx, query,
		uuid.New().String(),
		entry.TenantID,
		nullString(entry.OperatorID),
		nullString(entry.OperatorName),
		nullString(entry.TargetID),
		nullString(entry.TargetType),
		entry.EventType,
		entry.Resource,
		entry.Action,
		result,
		nullBytes(oldValuesJSON),
		nullBytes(newValuesJSON),
		nullString(entry.IPAddress),
		nullString(entry.UserAgent),
		nullString(entry.TraceID),
		time.Now(),
	)

	if err != nil {
		s.logger.Error("failed to write audit log",
			zap.Error(err),
			zap.String("eventType", entry.EventType),
			zap.String("targetID", entry.TargetID),
		)
		return err
	}

	s.logger.Debug("audit log written",
		zap.String("eventType", entry.EventType),
		zap.String("targetID", entry.TargetID),
		zap.String("tenantID", entry.TenantID),
	)

	return nil
}

// LogUserCreate 记录用户创建事件
func (s *AuditService) LogUserCreate(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, newValues interface{}, ipAddress, userAgent, traceID string) error {
	return s.Log(ctx, &AuditEntry{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetUserID,
		TargetType:   model.ResourceUser,
		EventType:    model.EventTypeUserCreated,
		Resource:     model.ResourceUser,
		Action:       model.ActionCreate,
		Result:       model.ResultSuccess,
		NewValues:    newValues,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		TraceID:      traceID,
	})
}

// LogUserUpdate 记录用户更新事件
func (s *AuditService) LogUserUpdate(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, oldValues, newValues interface{}, ipAddress, userAgent, traceID string) error {
	return s.Log(ctx, &AuditEntry{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetUserID,
		TargetType:   model.ResourceUser,
		EventType:    model.EventTypeUserUpdated,
		Resource:     model.ResourceUser,
		Action:       model.ActionUpdate,
		Result:       model.ResultSuccess,
		OldValues:    oldValues,
		NewValues:    newValues,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		TraceID:      traceID,
	})
}

// LogUserStatusChange 记录用户状态变更事件
func (s *AuditService) LogUserStatusChange(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, oldStatus, newStatus string, ipAddress, userAgent, traceID string) error {
	return s.Log(ctx, &AuditEntry{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetUserID,
		TargetType:   model.ResourceUser,
		EventType:    model.EventTypeUserStatusChanged,
		Resource:     model.ResourceUser,
		Action:       newStatus,
		Result:       model.ResultSuccess,
		OldValues:    map[string]string{"status": oldStatus},
		NewValues:    map[string]string{"status": newStatus},
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		TraceID:      traceID,
	})
}

// nullString 辅助函数
func nullString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// nullBytes 辅助函数
func nullBytes(b []byte) interface{} {
	if len(b) == 0 {
		return nil
	}
	return b
}
