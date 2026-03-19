package logging

import "go.uber.org/zap"

type AuthLogger struct {
	logger *zap.Logger
}

func NewAuthLogger(logger *zap.Logger) *AuthLogger {
	return &AuthLogger{logger: logger}
}

func (l *AuthLogger) LogLogin(userID, tenantID, result string) {
	l.logger.Info(
		"auth_login",
		zap.String("event_type", "auth.login"),
		zap.String("user_id", userID),
		zap.String("tenant_id", tenantID),
		zap.String("result", result),
	)
}

func (l *AuthLogger) LogLogout(userID, sessionID string) {
	l.logger.Info(
		"auth_logout",
		zap.String("event_type", "auth.logout"),
		zap.String("user_id", userID),
		zap.String("session_id", sessionID),
	)
}

func (l *AuthLogger) LogRefresh(userID, tenantID, result string) {
	l.logger.Info(
		"auth_refresh",
		zap.String("event_type", "auth.refresh"),
		zap.String("user_id", userID),
		zap.String("tenant_id", tenantID),
		zap.String("result", result),
	)
}
