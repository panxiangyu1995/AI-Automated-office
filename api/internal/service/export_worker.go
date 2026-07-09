package service

import (
	"context"
	"time"

	"go.uber.org/zap"

	"github.com/ai-office/api/internal/model"
)

type ExportWorker struct {
	svc    *ExportService
	repo   ExportRepositoryReader
	logger *zap.Logger
	queue  chan string
}

type ExportRepositoryReader interface {
	ListPendingTasks(limit int) ([]model.ExportTask, error)
}

func NewExportWorker(svc *ExportService, repo ExportRepositoryReader, logger *zap.Logger) *ExportWorker {
	return &ExportWorker{
		svc:    svc,
		repo:   repo,
		logger: logger,
		queue:  make(chan string, 100),
	}
}

func (w *ExportWorker) Start(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				w.logger.Info("export worker stopped")
				return
			case taskID := <-w.queue:
				w.processTask(taskID)
			}
		}
	}()

	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				w.pollPendingTasks()
			}
		}
	}()
}

func (w *ExportWorker) Enqueue(taskID string) {
	select {
	case w.queue <- taskID:
		w.logger.Info("export task enqueued", zap.String("task_id", taskID))
	default:
		w.logger.Warn("export queue full, task will be picked up by poller", zap.String("task_id", taskID))
	}
}

func (w *ExportWorker) processTask(taskID string) {
	w.logger.Info("processing export task", zap.String("task_id", taskID))
	if err := w.svc.ExecuteTask(taskID); err != nil {
		w.logger.Error("export task failed", zap.String("task_id", taskID), zap.Error(err))
		return
	}
	w.logger.Info("export task completed", zap.String("task_id", taskID))
}

func (w *ExportWorker) pollPendingTasks() {
	tasks, err := w.repo.ListPendingTasks(10)
	if err != nil {
		w.logger.Error("poll pending export tasks failed", zap.Error(err))
		return
	}
	for _, t := range tasks {
		w.Enqueue(t.ID.String())
	}
}
