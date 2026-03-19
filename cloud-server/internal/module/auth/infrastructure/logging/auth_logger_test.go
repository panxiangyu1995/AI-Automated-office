package logging

import (
	"testing"

	"go.uber.org/zap"
)

func TestAuthLoggerMethods(t *testing.T) {
	t.Parallel()
	logger := NewAuthLogger(zap.NewNop())
	logger.LogLogin("user-1", "tenant-a", "success")
	logger.LogLogout("user-1", "session-1")
	logger.LogRefresh("user-1", "tenant-a", "success")
}
