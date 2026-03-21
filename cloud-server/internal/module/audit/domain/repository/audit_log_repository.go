package repository

import (
	"context"
	"time"

	"cloud-server/internal/model"
)

// AuditLogRepository 审计日志仓储接口
type AuditLogRepository interface {
	// Create 创建审计日志
	Create(ctx context.Context, log *model.AuditLog) error
	
	// CreateBatch 批量创建审计日志
	CreateBatch(ctx context.Context, logs []*model.AuditLog) error
	
	// FindByID 根据 ID 查找审计日志
	FindByID(ctx context.Context, id string) (*model.AuditLog, error)
	
	// List 查询审计日志列表
	List(ctx context.Context, query *AuditLogQuery) ([]*model.AuditLog, int64, error)
	
	// DeleteBefore 删除指定时间之前的审计日志
	DeleteBefore(ctx context.Context, before time.Time) (int64, error)
}

// AuditLogQuery 审计日志查询条件
type AuditLogQuery struct {
	TenantID    string
	OperatorID  string
	TargetID    string
	TargetType  string
	EventType   string
	Resource    string
	Action      string
	Result      string
	TraceID     string
	StartTime   *time.Time
	EndTime     *time.Time
	Page        int
	PageSize    int
	OrderBy     string
	OrderDesc   bool
}
