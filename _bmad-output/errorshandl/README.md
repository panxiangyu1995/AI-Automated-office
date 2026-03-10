# OpenClaw 错误处理机制文档

> 本文档系统性地记录 OpenClaw 项目的错误处理架构设计，供其他 AI Agent 项目借鉴参考。

## 文档索引

| 文档 | 内容 |
|------|------|
| [error-classification.md](./error-classification.md) | **错误分类体系** - 错误类型定义、分级、分类策略 |
| [failover-retry.md](./failover-retry.md) | **故障转移与重试** - FailoverError、Auth Profile 轮换、重试策略 |
| [loop-detection.md](./loop-detection.md) | **循环检测** - 工具调用循环检测、熔断机制 |
| [network-errors.md](./network-errors.md) | **网络错误处理** - 可恢复错误判定、Telegram/Discord 网络错误 |
| [session-errors.md](./session-errors.md) | **会话错误处理** - 会话修复、上下文溢出、转写修复 |
| [error-formatting.md](./error-formatting.md) | **错误格式化** - 用户友好错误消息、错误脱敏 |

## 核心设计原则

OpenClaw 错误处理遵循以下核心原则：

### 1. 分层处理
```
通道层 → Gateway层 → Agent核心层 → 基础设施层
```
每层有独立的错误处理策略，下层错误向上传递时会被正确封装。

### 2. 可恢复性优先
- 网络错误自动重试
- Auth Profile 自动轮换
- Rate Limit 冷却后重试

### 3. 故障隔离
- Cron 任务错误不影响其他任务
- 子代理错误不影响主会话
- 插件错误不导致核心崩溃

### 4. 用户友好
- 原始 API 错误转换为可读消息
- 敏感信息自动脱敏
- 提供明确的恢复建议

## 快速导航

### 我想了解...

- **如何定义错误类型？** → [error-classification.md](./error-classification.md)
- **如何实现 Auth Profile 轮换？** → [failover-retry.md](./failover-retry.md)
- **如何防止工具调用死循环？** → [loop-detection.md](./loop-detection.md)
- **如何处理网络连接失败？** → [network-errors.md](./network-errors.md)
- **如何修复损坏的会话文件？** → [session-errors.md](./session-errors.md)
- **如何向用户展示友好的错误消息？** → [error-formatting.md](./error-formatting.md)

## 关键源码位置

| 模块 | 路径 |
|------|------|
| 基础错误工具 | `src/infra/errors.ts` |
| FailoverError | `src/agents/failover-error.ts` |
| 错误分类匹配 | `src/agents/pi-embedded-helpers/failover-matches.ts` |
| 错误格式化 | `src/agents/pi-embedded-helpers/errors.ts` |
| 循环检测 | `src/agents/tool-loop-detection.ts` |
| Auth Profile 使用 | `src/agents/auth-profiles/usage.ts` |
| 网络错误 | `src/telegram/network-errors.ts` |
| 会话修复 | `src/agents/session-file-repair.ts` |
| Gateway 错误码 | `src/gateway/protocol/schema/error-codes.ts` |
| 连接错误详情 | `src/gateway/protocol/connect-error-details.ts` |

## 借鉴建议

### 适合借鉴的场景

1. **多 Provider LLM 应用** - Auth Profile 轮换和 Failover 机制
2. **长时间运行的 Agent** - 循环检测和熔断机制
3. **消息平台集成** - 网络错误可恢复性判定
4. **会话持久化** - 会话文件修复策略

### 借鉴时需调整

1. **错误类型** - 根据你的 Provider 和业务调整
2. **重试策略** - 根据你的 SLA 要求调整阈值
3. **用户消息** - 根据你的用户群体调整语气和细节
