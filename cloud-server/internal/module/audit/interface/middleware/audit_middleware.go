package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"strings"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/audit/application/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/datatypes"
)

// AuditMiddlewareConfig 审计中间件配置
type AuditMiddlewareConfig struct {
	SkipPaths    []string // 跳过的路径
	SkipPrefixes []string // 跳过的路径前缀
	LogBody      bool     // 是否记录请求体
	LogResponse  bool     // 是否记录响应体
}

// DefaultAuditMiddlewareConfig 默认配置
func DefaultAuditMiddlewareConfig() AuditMiddlewareConfig {
	return AuditMiddlewareConfig{
		SkipPaths: []string{
			"/api/health",
			"/api/metrics",
		},
		SkipPrefixes: []string{
			"/api/auth/sessions/check",
		},
		LogBody:     true,
		LogResponse: false,
	}
}

// AuditMiddleware 审计中间件
type AuditMiddleware struct {
	logger *service.AuditLogger
	config AuditMiddlewareConfig
	zapLog *zap.Logger
}

// NewAuditMiddleware 创建审计中间件
func NewAuditMiddleware(
	logger *service.AuditLogger,
	config AuditMiddlewareConfig,
	zapLog *zap.Logger,
) *AuditMiddleware {
	return &AuditMiddleware{
		logger: logger,
		config: config,
		zapLog: zapLog,
	}
}

// Handler 返回 Gin 中间件处理函数
func (m *AuditMiddleware) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查是否跳过
		if m.shouldSkip(c.Request.URL.Path) {
			c.Next()
			return
		}

		start := time.Now()

		// 获取操作者信息（安全类型断言）
		var operatorID, operatorName, tenantID string
		if v, ok := c.Get("user_id"); ok {
			if s, ok := v.(string); ok {
				operatorID = s
			}
		}
		if v, ok := c.Get("username"); ok {
			if s, ok := v.(string); ok {
				operatorName = s
			}
		}
		if v, ok := c.Get("tenant_id"); ok {
			if s, ok := v.(string); ok {
				tenantID = s
			}
		}

		// 获取请求信息
		ip := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")
		method := c.Request.Method
		path := c.Request.URL.Path
		traceID := c.GetHeader("X-Trace-ID")

		// 读取请求体
		var requestBody string
		if m.config.LogBody && c.Request.Body != nil {
			bodyBytes, _ := io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
			if len(bodyBytes) > 0 && len(bodyBytes) < 10000 { // 限制大小
				requestBody = string(bodyBytes)
			}
		}

		// 捕获响应
		var responseBody string
		if m.config.LogResponse {
			blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
			c.Writer = blw
			c.Next()
			responseBody = blw.body.String()
			if len(responseBody) > 5000 { // 限制大小
				responseBody = responseBody[:5000]
			}
		} else {
			c.Next()
		}

		// 构建审计日志
		duration := time.Since(start)
		status := c.Writer.Status()

		// 判断结果
		result := "success"
		if status >= 400 {
			result = "failure"
		}

		// 映射资源
		resource := m.mapResource(path)

		// 映射操作
		action := m.mapAction(method, path)

		// 构建审计日志
		auditLog := &model.AuditLog{
			TenantID:     tenantID,
			OperatorID:   operatorID,
			OperatorName: operatorName,
			EventType:    service.EventTypeSystem,
			Resource:     resource,
			Action:       action,
			Result:       result,
			IPAddress:    ip,
			UserAgent:    userAgent,
			TraceID:      traceID,
			CreatedAt:    start,
		}

		// 设置请求体
		if requestBody != "" {
			auditLog.NewValues = datatypes.JSON(m.sanitizeJSON(requestBody))
		}

		// 设置响应体
		if responseBody != "" {
			auditLog.OldValues = datatypes.JSON(m.sanitizeJSON(responseBody))
		}

		// 异步记录审计日志
		m.logger.Log(auditLog)

		// 记录请求日志
		m.zapLog.Info("HTTP request",
			zap.String("method", method),
			zap.String("path", path),
			zap.Int("status", status),
			zap.Duration("duration", duration),
			zap.String("ip", ip),
			zap.String("tenant_id", tenantID),
			zap.String("user_id", operatorID),
		)
	}
}

// shouldSkip 检查是否跳过审计
func (m *AuditMiddleware) shouldSkip(path string) bool {
	// 检查完整路径
	for _, p := range m.config.SkipPaths {
		if path == p {
			return true
		}
	}

	// 检查前缀
	for _, prefix := range m.config.SkipPrefixes {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}

	return false
}

// mapResource 映射资源类型
func (m *AuditMiddleware) mapResource(path string) string {
	segments := strings.Split(strings.Trim(path, "/"), "/")
	if len(segments) >= 3 {
		return segments[2] // /api/{resource}/...
	}
	return "unknown"
}

// mapAction 映射操作
func (m *AuditMiddleware) mapAction(method, path string) string {
	switch method {
	case "GET":
		return service.ActionRead
	case "POST":
		return service.ActionCreate
	case "PUT", "PATCH":
		return service.ActionUpdate
	case "DELETE":
		return service.ActionDelete
	default:
		return method
	}
}

// sanitizeJSON 清理 JSON 中的敏感信息
func (m *AuditMiddleware) sanitizeJSON(jsonStr string) string {
	// 尝试解析 JSON
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		return jsonStr
	}

	// 敏感字段列表
	sensitiveFields := []string{
		"password",
		"passwd",
		"pwd",
		"secret",
		"token",
		"access_token",
		"refresh_token",
		"api_key",
		"apikey",
		"private_key",
		"credit_card",
		"card_number",
		"cvv",
	}

	// 清理敏感字段
	for _, field := range sensitiveFields {
		if _, ok := data[field]; ok {
			data[field] = "***REDACTED***"
		}
	}

	// 重新序列化
	result, err := json.Marshal(data)
	if err != nil {
		return jsonStr
	}
	return string(result)
}

// bodyLogWriter 用于捕获响应体
type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w bodyLogWriter) WriteString(s string) (int, error) {
	w.body.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}