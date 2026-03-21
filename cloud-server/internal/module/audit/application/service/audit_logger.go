package service

import (
	"context"
	"sync"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/audit/domain/repository"

	"go.uber.org/zap"
)

// AuditLoggerConfig 审计日志器配置
type AuditLoggerConfig struct {
	QueueSize     int           // 队列大小
	FlushInterval time.Duration // 刷新间隔
	BatchSize     int           // 批量写入大小
}

// DefaultAuditLoggerConfig 默认配置
func DefaultAuditLoggerConfig() AuditLoggerConfig {
	return AuditLoggerConfig{
		QueueSize:     10000,
		FlushInterval: 5 * time.Second,
		BatchSize:     100,
	}
}

// AuditLogger 审计日志器（异步批量写入）
type AuditLogger struct {
	repo   repository.AuditLogRepository
	config AuditLoggerConfig
	logger *zap.Logger

	queue   chan *model.AuditLog
	stopCh  chan struct{}
	stopped bool
	mu      sync.Mutex
	wg      sync.WaitGroup
}

// NewAuditLogger 创建审计日志器
func NewAuditLogger(
	repo repository.AuditLogRepository,
	config AuditLoggerConfig,
	logger *zap.Logger,
) *AuditLogger {
	return &AuditLogger{
		repo:   repo,
		config: config,
		logger: logger,
		queue:  make(chan *model.AuditLog, config.QueueSize),
		stopCh: make(chan struct{}),
	}
}

// Start 启动后台写入
func (l *AuditLogger) Start() {
	l.mu.Lock()
	defer l.mu.Unlock()

	if !l.stopped {
		return
	}

	l.stopped = false
	l.stopCh = make(chan struct{})
	l.wg.Add(1)
	go l.run()
}

// Stop 停止后台写入
func (l *AuditLogger) Stop() {
	l.mu.Lock()
	if l.stopped {
		l.mu.Unlock()
		return
	}
	l.stopped = true
	close(l.stopCh)
	l.mu.Unlock()

	l.wg.Wait()
}

// Log 记录审计日志（异步）
func (l *AuditLogger) Log(log *model.AuditLog) {
	select {
	case l.queue <- log:
	default:
		// 队列满，丢弃日志并记录警告
		l.logger.Warn("audit log queue full, dropping log",
			zap.String("event_type", log.EventType),
			zap.String("resource", log.Resource),
			zap.String("action", log.Action),
		)
	}
}

// LogSync 同步记录审计日志
func (l *AuditLogger) LogSync(ctx context.Context, log *model.AuditLog) error {
	return l.repo.Create(ctx, log)
}

// LogBatch 批量记录审计日志
func (l *AuditLogger) LogBatch(logs []*model.AuditLog) {
	for _, log := range logs {
		l.Log(log)
	}
}

// run 后台处理协程
func (l *AuditLogger) run() {
	defer l.wg.Done()

	ticker := time.NewTicker(l.config.FlushInterval)
	defer ticker.Stop()

	batch := make([]*model.AuditLog, 0, l.config.BatchSize)

	flush := func() {
		if len(batch) == 0 {
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := l.repo.CreateBatch(ctx, batch); err != nil {
			l.logger.Error("failed to write audit logs batch", zap.Error(err), zap.Int("count", len(batch)))
		}

		batch = batch[:0]
	}

	for {
		select {
		case <-l.stopCh:
			// 停止前刷新剩余日志
			for {
				select {
				case log := <-l.queue:
					batch = append(batch, log)
					if len(batch) >= l.config.BatchSize {
						flush()
					}
				default:
					flush()
					return
				}
			}
		case log := <-l.queue:
			batch = append(batch, log)
			if len(batch) >= l.config.BatchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		}
	}
}

// GetQueueSize 获取当前队列大小
func (l *AuditLogger) GetQueueSize() int {
	return len(l.queue)
}

// IsQueueFull 检查队列是否已满
func (l *AuditLogger) IsQueueFull() bool {
	return len(l.queue) >= l.config.QueueSize
}
