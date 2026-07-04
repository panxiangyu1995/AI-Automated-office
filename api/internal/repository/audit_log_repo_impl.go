package repository

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
)

type auditLogRepo struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &auditLogRepo{db: db}
}

func (r *auditLogRepo) Create(log *model.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *auditLogRepo) FindByID(id uuid.UUID) (*model.AuditLog, error) {
	var log model.AuditLog
	err := r.db.Where("id = ?", id).First(&log).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &log, nil
}

func (r *auditLogRepo) List(query model.AuditLogQuery) ([]model.AuditLog, int64, error) {
	var logs []model.AuditLog
	var total int64

	q := r.db.Model(&model.AuditLog{})

	if query.EnterpriseID != "" {
		eid, err := uuid.Parse(query.EnterpriseID)
		if err == nil {
			q = q.Where("enterprise_id = ?", eid)
		}
	}

	if query.UserID != "" {
		uid, err := uuid.Parse(query.UserID)
		if err == nil {
			q = q.Where("user_id = ?", uid)
		}
	}

	if query.Action != "" {
		q = q.Where("action = ?", query.Action)
	}

	if query.ResourceType != "" {
		q = q.Where("resource_type = ?", query.ResourceType)
	}

	if query.StartTime != "" {
		t, err := time.Parse(time.RFC3339, query.StartTime)
		if err == nil {
			q = q.Where("created_at >= ?", t)
		}
	}

	if query.EndTime != "" {
		t, err := time.Parse(time.RFC3339, query.EndTime)
		if err == nil {
			q = q.Where("created_at <= ?", t)
		}
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count audit logs: %w", err)
	}

	page, pageSize := query.Page, query.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("list audit logs: %w", err)
	}

	return logs, total, nil
}
