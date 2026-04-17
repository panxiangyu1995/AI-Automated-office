# 设计：健康检查和监控

## 健康检查端点

```
GET /health              - 基础健康检查
GET /health/liveness     - Kubernetes liveness probe
GET /health/readiness    - Kubernetes readiness probe
GET /health/detailed     - 详细健康检查（DB、存储等）
```

## 健康检查响应

```json
{
  "status": "healthy",
  "timestamp": "2026-04-17T10:00:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 5
    },
    "storage": {
      "status": "healthy"
    }
  },
  "version": "1.0.0"
}
```
