package scheduler

import (
	"sync"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"go.uber.org/zap"
)

type BillingScheduler struct {
	billingService *service.BillingService
	logger         *zap.Logger
	stopCh         chan struct{}
	once           sync.Once
}

func NewBillingScheduler(billingService *service.BillingService, logger *zap.Logger) *BillingScheduler {
	return &BillingScheduler{
		billingService: billingService,
		logger:         logger,
		stopCh:         make(chan struct{}),
	}
}

func (s *BillingScheduler) Start() {
	s.logger.Info("计费调度器已启动")
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.CheckAndGenerateBills()
			s.CheckGracePeriods()
		case <-s.stopCh:
			s.logger.Info("计费调度器已停止")
			return
		}
	}
}

func (s *BillingScheduler) Stop() {
	s.once.Do(func() {
		close(s.stopCh)
	})
}

func (s *BillingScheduler) CheckAndGenerateBills() {
	s.logger.Info("检查待生成账单")
}

func (s *BillingScheduler) CheckGracePeriods() {
	count, err := s.billingService.ProcessGracePeriod()
	if err != nil {
		s.logger.Error("宽限期检查失败", zap.Error(err))
		return
	}
	if count > 0 {
		s.logger.Info("已处理宽限期订阅", zap.Int("count", count))
	}
}
