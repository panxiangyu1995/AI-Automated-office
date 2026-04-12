# 设计文档: 负载均衡与高可用

## 1. 架构设计

### 1.1 模块结构

```
src-tauri/src/
├── load_balancing/
│   ├── mod.rs              # 模块入口
│   ├── health_check.rs     # 健康检查
│   ├── balancer.rs         # 负载均衡器
│   ├── failover.rs         # 故障转移
│   └── sla_monitor.rs      # SLA监控
```

### 1.2 核心组件

#### HealthChecker
- 定时检查后端服务健康状态
- 支持 HTTP/TCP/Process 三种检查方式
- 记录连续失败次数

#### LoadBalancer
- 支持轮询、加权、最少连接三种策略
- 自动剔除不健康节点
- 会话亲和性支持

#### FailoverManager
- 检测故障并自动切换
- 保持主备同步
- 故障恢复后自动切回

#### SlaMonitor
- 记录服务可用性指标
- 生成 SLA 报告
- 触发告警

## 2. 数据模型

### HealthStatus
```rust
struct HealthStatus {
    node_id: String,
    endpoint: String,
    is_healthy: bool,
    consecutive_failures: u32,
    last_check: DateTime<Utc>,
    response_time_ms: u64,
}
```

### LoadBalancingConfig
```rust
struct LoadBalancingConfig {
    strategy: BalanceStrategy,  // RoundRobin, Weighted, LeastConnections
    health_check_interval_secs: u64,
    failure_threshold: u32,
    recovery_threshold: u32,
}
```

## 3. API 设计

### Tauri 命令

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| get_health_status | node_id | HealthStatus | 获取节点健康状态 |
| list_nodes | - | Vec<HealthStatus> | 列出所有节点 |
| trigger_failover | node_id | Result | 触发故障转移 |
| get_sla_report | period | SlaReport | 获取SLA报告 |

## 4. 验收标准

- [ ] 健康检查能够工作
- [ ] 负载均衡策略能够生效
- [ ] 故障转移能够触发
- [ ] SLA 监控能够展示
- [ ] cargo build 成功
- [ ] cargo clippy 无警告
