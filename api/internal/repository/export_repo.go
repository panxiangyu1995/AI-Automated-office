package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ExportRepository interface {
	CreateTask(task *model.ExportTask) error
	FindTaskByID(id uuid.UUID) (*model.ExportTask, error)
	FindTaskByIDAndEnterprise(id uuid.UUID, enterpriseID uuid.UUID) (*model.ExportTask, error)
	UpdateTask(task *model.ExportTask) error
	ListTasksByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.ExportTask, int64, error)
	ListPendingTasks(limit int) ([]model.ExportTask, error)
	CreateHistory(h *model.ExportHistory) error
	ListHistoryByTask(taskID uuid.UUID) ([]model.ExportHistory, error)
}
