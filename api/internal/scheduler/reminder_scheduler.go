package scheduler

import (
	"sync"
	"time"

	"github.com/ai-office/api/internal/service"
	"go.uber.org/zap"
)

type ReminderScheduler struct {
	planService *service.PaymentPlanService
	logger      *zap.Logger
	stopCh      chan struct{}
	once        sync.Once
}

func NewReminderScheduler(planService *service.PaymentPlanService, logger *zap.Logger) *ReminderScheduler {
	return &ReminderScheduler{
		planService: planService,
		logger:      logger,
		stopCh:      make(chan struct{}),
	}
}

func (s *ReminderScheduler) Start() {
	s.logger.Info("回款计划提醒调度器已启动")
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.planService.CheckAndRemindOverdue()
		case <-s.stopCh:
			s.logger.Info("回款计划提醒调度器已停止")
			return
		}
	}
}

func (s *ReminderScheduler) Stop() {
	s.once.Do(func() {
		close(s.stopCh)
	})
}
