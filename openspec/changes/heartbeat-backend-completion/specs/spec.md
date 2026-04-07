# Specification: 心跳机制后端完善

## 需求来源

### PRD 需求
- FR1127: 心跳任务调度
- FR1128: 心跳预检机制
- FR1129: 心跳隔离执行
- FR1130: 心跳结果通知

### 架构约束
- ADR-048: Heartbeat/Cron机制作为运行治理能力

## 功能规格

### HEARTBEAT.md格式

```yaml
---
name: task-name
schedule: "0 9 * * *"  # cron
enabled: true
precheck:
  - type: network
    target: "host"
  - type: service
    target: "service-name"
execution:
  type: skill|tool|script
  config: {...}
timeout: 300
retry:
  max_attempts: 3
  interval: 60
notification:
  on_failure: true
  channels: ["notify", "log"]
---
```

### 预检类型

| 类型 | 描述 |
|------|------|
| network | 检查网络连通性 |
| service | 检查服务可用性 |
| condition | 评估条件表达式 |

## 验收场景

### Scenario 1: 预检失败
- **GIVEN** 网络不可达
- **WHEN** 心跳任务触发
- **THEN** 任务跳过，静默记录

### Scenario 2: 执行超时
- **GIVEN** 任务执行超过timeout
- **WHEN** 超时触发
- **THEN** 任务中断，发送超时通知
