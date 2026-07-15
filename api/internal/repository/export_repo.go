package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ExportRepository interface {
	CreateTask(task *model.ExportTask) error
	FindTaskByID(id, enterpriseID uuid.UUID) (*model.ExportTask, error)
	FindTaskByIDAndEnterprise(id uuid.UUID, enterpriseID uuid.UUID) (*model.ExportTask, error)
	UpdateTask(task *model.ExportTask, enterpriseID uuid.UUID) error
	ListTasksByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.ExportTask, int64, error)
	ListPendingTasks(limit int) ([]model.ExportTask, error)
	CreateHistory(h *model.ExportHistory) error
	ListHistoryByTask(taskID uuid.UUID) ([]model.ExportHistory, error)
	QueryTable(table string, fields []string, enterpriseID uuid.UUID, filters map[string]interface{}, entityID string) ([]map[string]interface{}, error)
	QueryRelatedTable(table string, fields []string, enterpriseID uuid.UUID, anchorType, anchorID string) ([]map[string]interface{}, error)
	QueryEmployeeDimensionTable(table string, fields []string, enterpriseID uuid.UUID) ([]map[string]interface{}, error)
	QueryAuditLogs(enterpriseID uuid.UUID, userID string, fields []string) ([]map[string]interface{}, error)
}
