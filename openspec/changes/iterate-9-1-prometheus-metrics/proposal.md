# 提案：Prometheus 指标端点

## 变更背景

当前服务缺少监控指标，无法进行性能分析和告警。

## 变更目标

- 添加 Prometheus 指标暴露
- 实现 HTTP 请求指标
- 添加业务指标埋点

## 指标类型

| 指标名 | 类型 | 说明 |
|--------|------|------|
| http_requests_total | Counter | 请求总数 |
| http_request_duration_seconds | Histogram | 请求延迟 |
| cache_hits_total | Counter | 缓存命中 |
| sync_conflicts_total | Counter | 同步冲突数 |

## 预期效果

- 支持 Prometheus 抓取
- 便于 Grafana 可视化
- 支持告警规则配置
