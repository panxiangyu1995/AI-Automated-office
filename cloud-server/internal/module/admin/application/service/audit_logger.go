package service

import "context"

// AuditLogger 审计日志接口
type AuditLogger interface {
	// LogUserCreate 记录用户创建事件
	LogUserCreate(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, newValues interface{}, ipAddress, userAgent, traceID string) error

	// LogUserUpdate 记录用户更新事件
	LogUserUpdate(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, oldValues, newValues interface{}, ipAddress, userAgent, traceID string) error

	// LogUserStatusChange 记录用户状态变更事件
	LogUserStatusChange(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, oldStatus, newStatus string, ipAddress, userAgent, traceID string) error
}
