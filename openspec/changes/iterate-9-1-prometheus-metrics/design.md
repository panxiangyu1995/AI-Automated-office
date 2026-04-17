# 设计：Prometheus 指标

## 指标端点

```
GET /metrics - Prometheus 指标端点
```

## 核心指标

### HTTP 指标

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/v1/users",status="200"} 1234

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 1000
http_request_duration_seconds_bucket{le="0.5"} 1200
http_request_duration_seconds_sum 500.5
http_request_duration_seconds_count 1234
```

### 业务指标

```
# HELP cache_hits_total Cache hits
# TYPE cache_hits_total counter
cache_hits_total{cache="permission"} 5000
cache_hits_total{cache="role"} 3000

# HELP sync_conflicts_total Sync conflicts
# TYPE sync_conflicts_total counter
sync_conflicts_total{strategy="last_write_wins"} 10
```
