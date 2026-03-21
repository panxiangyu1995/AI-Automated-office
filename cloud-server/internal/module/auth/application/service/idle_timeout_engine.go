package service

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"
)

// IdleTimeoutEngine 空闲超时引擎
// 定期检查空闲超时的会话并自动撤销
type IdleTimeoutEngine struct {
	sessionService *SessionService
	config         SessionConfig
	logger         *zap.Logger

	running bool
	mu      sync.Mutex
	cancel  context.CancelFunc
	wg      sync.WaitGroup
}

// NewIdleTimeoutEngine 创建空闲超时引擎
func NewIdleTimeoutEngine(
	sessionService *SessionService,
	config SessionConfig,
	logger *zap.Logger,
) *IdleTimeoutEngine {
	return &IdleTimeoutEngine{
		sessionService: sessionService,
		config:         config,
		logger:         logger,
	}
}

// Start 启动超时引擎
func (e *IdleTimeoutEngine) Start(ctx context.Context) error {
	e.mu.Lock()
	if e.running {
		e.mu.Unlock()
		return nil
	}
	e.running = true
	e.mu.Unlock()

	ctx, cancel := context.WithCancel(context.Background())
	e.cancel = cancel

	e.wg.Add(1)
	go e.run(ctx)

	e.logger.Info("idle timeout engine started",
		zap.Duration("idle_timeout", e.config.IdleTimeout),
		zap.Duration("cleanup_interval", e.config.CleanupInterval))

	return nil
}

// Stop 停止超时引擎
func (e *IdleTimeoutEngine) Stop() error {
	e.mu.Lock()
	if !e.running {
		e.mu.Unlock()
		return nil
	}
	e.running = false
	e.mu.Unlock()

	if e.cancel != nil {
		e.cancel()
	}
	e.wg.Wait()

	e.logger.Info("idle timeout engine stopped")
	return nil
}

// run 主循环
func (e *IdleTimeoutEngine) run(ctx context.Context) {
	defer e.wg.Done()

	ticker := time.NewTicker(e.config.CleanupInterval)
	defer ticker.Stop()

	// Run immediately on start
	e.processTick(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			e.processTick(ctx)
		}
	}
}

// processTick 处理每个周期的任务
func (e *IdleTimeoutEngine) processTick(ctx context.Context) {
	startTime := time.Now()

	// Process idle timeouts
	idleCount, err := e.sessionService.ProcessIdleTimeouts(ctx)
	if err != nil {
		e.logger.Error("failed to process idle timeouts", zap.Error(err))
	}

	// Process expired sessions
	expiredCount, err := e.sessionService.ProcessExpiredSessions(ctx)
	if err != nil {
		e.logger.Error("failed to process expired sessions", zap.Error(err))
	}

	// Cleanup old sessions
	cleanedCount, err := e.sessionService.CleanupOldSessions(ctx)
	if err != nil {
		e.logger.Error("failed to cleanup old sessions", zap.Error(err))
	}

	duration := time.Since(startTime)
	if idleCount > 0 || expiredCount > 0 || cleanedCount > 0 {
		e.logger.Info("session maintenance completed",
			zap.Int("idle_timeouts", idleCount),
			zap.Int("expired", expiredCount),
			zap.Int64("cleaned", cleanedCount),
			zap.Duration("duration", duration))
	}
}

// IsRunning 返回引擎是否正在运行
func (e *IdleTimeoutEngine) IsRunning() bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.running
}

// RunOnce 执行一次超时检查（用于测试或手动触发）
func (e *IdleTimeoutEngine) RunOnce(ctx context.Context) (idleCount, expiredCount int, cleanedCount int64, err error) {
	idleCount, err = e.sessionService.ProcessIdleTimeouts(ctx)
	if err != nil {
		return
	}

	expiredCount, err = e.sessionService.ProcessExpiredSessions(ctx)
	if err != nil {
		return
	}

	cleanedCount, err = e.sessionService.CleanupOldSessions(ctx)
	return
}
