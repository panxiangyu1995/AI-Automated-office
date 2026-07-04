package observability

import (
	"context"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

var (
	RequestCount = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "api_requests_total",
		Help: "Total number of API requests",
	}, []string{"method", "path", "status"})

	RequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "api_request_duration_seconds",
		Help:    "Request duration in seconds",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "path"})

	ErrorCount = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "api_errors_total",
		Help: "Total number of API errors",
	}, []string{"method", "path", "error_code"})

	ActiveRequests = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "api_active_requests",
		Help: "Number of active requests",
	})
)

type MetricsRecorder struct {
	startTime time.Time
	method    string
	path      string
}

func NewMetricsRecorder(method, path string) *MetricsRecorder {
	ActiveRequests.Inc()
	return &MetricsRecorder{
		startTime: time.Now(),
		method:    method,
		path:      path,
	}
}

func (m *MetricsRecorder) Record(status int) {
	statusStr := statusCodeGroup(status)
	RequestCount.WithLabelValues(m.method, m.path, statusStr).Inc()
	RequestDuration.WithLabelValues(m.method, m.path).Observe(time.Since(m.startTime).Seconds())
	ActiveRequests.Dec()
	if status >= 400 {
		ErrorCount.WithLabelValues(m.method, m.path, statusStr).Inc()
	}
}

func statusCodeGroup(status int) string {
	switch {
	case status < 200:
		return "1xx"
	case status < 300:
		return "2xx"
	case status < 400:
		return "3xx"
	case status < 500:
		return "4xx"
	default:
		return "5xx"
	}
}

var Tracer = otel.Tracer("ai-office-api")

func InitTracing(serviceName, endpoint string) (*sdktrace.TracerProvider, error) {
	if endpoint == "" {
		return sdktrace.NewTracerProvider(), nil
	}

	exp, err := otlptracehttp.New(context.Background(),
		otlptracehttp.WithEndpoint(endpoint),
		otlptracehttp.WithInsecure(),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(resource.NewSchemaless(
			attribute.String("service.name", serviceName),
		)),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	return tp, nil
}

func StartSpan(ctx context.Context, name string, attrs ...attribute.KeyValue) (context.Context, trace.Span) {
	return Tracer.Start(ctx, name, trace.WithAttributes(attrs...))
}
