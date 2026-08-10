package repository

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type auditLogRepo struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &auditLogRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *auditLogRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *auditLogRepo) Create(log *model.AuditLog) error {
	return r.fresh().Create(log).Error
}

func (r *auditLogRepo) FindByID(id, enterpriseID uuid.UUID) (*model.AuditLog, error) {
	var log model.AuditLog
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&log).Error
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

	q := r.fresh().Model(&model.AuditLog{})

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

func (r *auditLogRepo) QueryOperatorActions(enterpriseID uuid.UUID, page, pageSize int, action, userID, startTime, endTime string) ([]map[string]interface{}, int64, error) {
	var total int64

	q := r.fresh().Model(&model.AuditLog{}).Where("enterprise_id = ?", enterpriseID)

	if action != "" {
		q = q.Where("action = ?", action)
	}
	if userID != "" {
		uid, err := uuid.Parse(userID)
		if err == nil {
			q = q.Where("user_id = ?", uid)
		}
	}
	if startTime != "" {
		t, err := time.Parse(time.RFC3339, startTime)
		if err == nil {
			q = q.Where("created_at >= ?", t)
		}
	}
	if endTime != "" {
		t, err := time.Parse(time.RFC3339, endTime)
		if err == nil {
			q = q.Where("created_at <= ?", t)
		}
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count operator actions: %w", err)
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var results []map[string]interface{}
	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&results).Error; err != nil {
		return nil, 0, fmt.Errorf("list operator actions: %w", err)
	}

	return results, total, nil
}

func (r *auditLogRepo) DeleteOldByEnterprise(enterpriseID uuid.UUID, cutoff time.Time) (int64, error) {
	result := r.fresh().Model(&model.AuditLog{}).Where("enterprise_id = ? AND created_at < ?", enterpriseID, cutoff).UpdateColumn("deleted_at", time.Now())
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}
