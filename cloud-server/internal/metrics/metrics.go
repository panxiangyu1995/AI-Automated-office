package metrics

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	// HTTP 请求总数
	HttpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	// HTTP 请求延迟
	HttpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
		},
		[]string{"method", "path"},
	)

	// 缓存命中数
	CacheHitsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cache_hits_total",
			Help: "Total number of cache hits",
		},
		[]string{"cache", "result"}, // result: hit, miss
	)

	// 缓存操作延迟
	CacheOperationDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "cache_operation_duration_seconds",
			Help:    "Cache operation duration in seconds",
			Buckets: []float64{0.0001, 0.0005, 0.001, 0.005, 0.01},
		},
		[]string{"cache", "operation"}, // operation: get, set, delete
	)

	// 同步冲突数
	SyncConflictsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "sync_conflicts_total",
			Help: "Total number of sync conflicts",
		},
		[]string{"entity_type", "strategy"},
	)

	// 数据库连接池指标
	DBConnectionPoolSize = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "db_connection_pool_size",
			Help: "Database connection pool size",
		},
	)

	// 活跃会话数
	ActiveSessions = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "active_sessions",
			Help: "Number of active sessions",
		},
	)
)

func init() {
	// 注册所有指标
	prometheus.MustRegister(HttpRequestsTotal)
	prometheus.MustRegister(HttpRequestDuration)
	prometheus.MustRegister(CacheHitsTotal)
	prometheus.MustRegister(CacheOperationDuration)
	prometheus.MustRegister(SyncConflictsTotal)
	prometheus.MustRegister(DBConnectionPoolSize)
	prometheus.MustRegister(ActiveSessions)
}

// RecordCacheHit 记录缓存命中
func RecordCacheHit(cacheName string, hit bool) {
	result := "miss"
	if hit {
		result = "hit"
	}
	CacheHitsTotal.WithLabelValues(cacheName, result).Inc()
}

// RecordSyncConflict 记录同步冲突
func RecordSyncConflict(entityType, strategy string) {
	SyncConflictsTotal.WithLabelValues(entityType, strategy).Inc()
}

// Middleware 返回 Prometheus 中间件
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		c.Next()

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())

		HttpRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
		HttpRequestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)
	}
}

// Handler 返回 Prometheus 指标处理器
func Handler() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}
