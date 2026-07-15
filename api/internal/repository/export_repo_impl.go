package repository

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type exportRepo struct {
	db *gorm.DB
}

func NewExportRepository(db *gorm.DB) ExportRepository {
	return &exportRepo{db: db}
}

func (r *exportRepo) CreateTask(task *model.ExportTask) error {
	return r.db.Create(task).Error
}

func (r *exportRepo) FindTaskByID(id, enterpriseID uuid.UUID) (*model.ExportTask, error) {
	var task model.ExportTask
	q := r.db.Where("id = ?", id)
	if enterpriseID != uuid.Nil {
		q = q.Where("enterprise_id = ?", enterpriseID)
	}
	err := q.First(&task).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &task, nil
}

func (r *exportRepo) FindTaskByIDAndEnterprise(id uuid.UUID, enterpriseID uuid.UUID) (*model.ExportTask, error) {
	var task model.ExportTask
	err := r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&task).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &task, nil
}

func (r *exportRepo) UpdateTask(task *model.ExportTask, enterpriseID uuid.UUID) error {
	var existing model.ExportTask
	if err := r.db.Where("id = ? AND enterprise_id = ?", task.ID, enterpriseID).First(&existing).Error; err != nil {
		return err
	}
	return r.db.Save(task).Error
}

func (r *exportRepo) ListTasksByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.ExportTask, int64, error) {
	var tasks []model.ExportTask
	var total int64

	q := r.db.Model(&model.ExportTask{}).Where("enterprise_id = ?", enterpriseID)

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count export tasks: %w", err)
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&tasks).Error; err != nil {
		return nil, 0, fmt.Errorf("list export tasks: %w", err)
	}

	return tasks, total, nil
}

func (r *exportRepo) ListPendingTasks(limit int) ([]model.ExportTask, error) {
	var tasks []model.ExportTask
	if err := r.db.Where("status = ?", "pending").Order("created_at ASC").Limit(limit).Find(&tasks).Error; err != nil {
		return nil, fmt.Errorf("list pending export tasks: %w", err)
	}
	return tasks, nil
}

func (r *exportRepo) CreateHistory(h *model.ExportHistory) error {
	return r.db.Create(h).Error
}

func (r *exportRepo) ListHistoryByTask(taskID uuid.UUID) ([]model.ExportHistory, error) {
	var histories []model.ExportHistory
	if err := r.db.Where("task_id = ?", taskID).Order("created_at DESC").Find(&histories).Error; err != nil {
		return nil, fmt.Errorf("list export history: %w", err)
	}
	return histories, nil
}

func (r *exportRepo) QueryTable(table string, fields []string, enterpriseID uuid.UUID, filters map[string]interface{}, entityID string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := r.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", enterpriseID).
		Select(strings.Join(fields, ", "))
	if entityID != "" {
		query = query.Where("id = ?", entityID)
	}
	for k, v := range filters {
		query = query.Where(k+" = ?", v)
	}
	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query %s: %w", table, err)
	}
	return results, nil
}

func (r *exportRepo) QueryRelatedTable(table string, fields []string, enterpriseID uuid.UUID, anchorType, anchorID string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := r.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", enterpriseID).
		Select(strings.Join(fields, ", "))
	switch anchorType {
	case "customer":
		query = query.Where("customer_id = ?", anchorID)
	default:
		query = query.Where("id = ?", anchorID)
	}
	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query related %s: %w", table, err)
	}
	return results, nil
}

func (r *exportRepo) QueryEmployeeDimensionTable(table string, fields []string, enterpriseID uuid.UUID) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := r.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", enterpriseID).
		Select(strings.Join(fields, ", "))
	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query employee dimension %s: %w", table, err)
	}
	return results, nil
}

func (r *exportRepo) QueryAuditLogs(enterpriseID uuid.UUID, userID string, fields []string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	if err := r.db.Table("audit_logs").
		Where("enterprise_id = ? AND user_id = ? AND deleted_at IS NULL", enterpriseID, userID).
		Select(strings.Join(fields, ", ")).
		Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query audit logs: %w", err)
	}
	return results, nil
}
