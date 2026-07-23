package repository

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

var allowedExportColumns = map[string]map[string]bool{
	"employees": {
		"id": true, "enterprise_id": true, "name": true, "email": true, "phone": true,
		"position": true, "employee_no": true, "role": true, "status": true,
		"department_id": true, "hire_date": true, "created_at": true, "updated_at": true,
	},
	"customers": {
		"id": true, "enterprise_id": true, "name": true, "contact_person": true,
		"email": true, "phone": true, "status": true, "created_at": true, "updated_at": true,
	},
	"contracts": {
		"id": true, "enterprise_id": true, "contract_no": true, "name": true,
		"customer_id": true, "amount": true, "status": true, "start_date": true,
		"end_date": true, "created_at": true, "updated_at": true,
	},
	"purchase_orders": {
		"id": true, "enterprise_id": true, "order_no": true, "supplier_id": true,
		"total_amount": true, "status": true, "created_at": true, "updated_at": true,
	},
	"sales_orders": {
		"id": true, "enterprise_id": true, "order_no": true, "customer_id": true,
		"total_amount": true, "status": true, "created_at": true, "updated_at": true,
	},
	"products": {
		"id": true, "enterprise_id": true, "name": true, "sku": true, "category": true,
		"price": true, "status": true, "created_at": true, "updated_at": true,
	},
	"audit_logs": {
		"id": true, "enterprise_id": true, "user_id": true, "action": true,
		"resource_type": true, "resource_id": true, "detail": true,
		"created_at": true,
	},
}

func sanitizeFields(table string, fields []string) []string {
	allowed, ok := allowedExportColumns[table]
	if !ok {
		return []string{"*"}
	}
	safe := make([]string, 0, len(fields))
	for _, f := range fields {
		f = strings.TrimSpace(f)
		if allowed[f] {
			safe = append(safe, f)
		}
	}
	if len(safe) == 0 {
		safe = []string{"*"}
	}
	return safe
}

func sanitizeFilterKeys(table string, filters map[string]interface{}) map[string]interface{} {
	allowed, ok := allowedExportColumns[table]
	if !ok {
		return map[string]interface{}{"enterprise_id": filters["enterprise_id"]}
	}
	safe := make(map[string]interface{}, len(filters))
	for k, v := range filters {
		if allowed[k] {
			safe[k] = v
		}
	}
	return safe
}

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
	safeFields := sanitizeFields(table, fields)
	safeFilters := sanitizeFilterKeys(table, filters)
	query := r.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", enterpriseID).
		Select(strings.Join(safeFields, ", "))
	if entityID != "" {
		query = query.Where("id = ?", entityID)
	}
	for k, v := range safeFilters {
		query = query.Where(k+" = ?", v)
	}
	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query %s: %w", table, err)
	}
	return results, nil
}

func (r *exportRepo) QueryRelatedTable(table string, fields []string, enterpriseID uuid.UUID, anchorType, anchorID string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	safeFields := sanitizeFields(table, fields)
	query := r.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", enterpriseID).
		Select(strings.Join(safeFields, ", "))
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
	safeFields := sanitizeFields(table, fields)
	query := r.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", enterpriseID).
		Select(strings.Join(safeFields, ", "))
	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query employee dimension %s: %w", table, err)
	}
	return results, nil
}

func (r *exportRepo) QueryAuditLogs(enterpriseID uuid.UUID, userID string, fields []string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	safeFields := sanitizeFields("audit_logs", fields)
	if err := r.db.Table("audit_logs").
		Where("enterprise_id = ? AND user_id = ? AND deleted_at IS NULL", enterpriseID, userID).
		Select(strings.Join(safeFields, ", ")).
		Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query audit logs: %w", err)
	}
	return results, nil
}
