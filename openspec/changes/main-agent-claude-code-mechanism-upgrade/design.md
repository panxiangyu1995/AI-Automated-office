# Design: 主通用Agent机制升级

## Context

当前AI-Automated-office的主Agent系统缺乏Claude Code研究文档中描述的关键机制。根据PRD中的FR400-FR505系列功能需求，主Agent需要具备多层次类型体系、精细的工具过滤、生命周期Hook机制和完善的进度追踪能力。

### 当前状态
- 现有`ToolRegistry`仅有基础的`filter_readonly_tools`方法
- 记忆系统已实现L1/L2/L3架构，但需要适配User/Project/Local三层作用域
- 监控服务`SubAgentMonitoringService`已存在，但缺少实时进度推送机制
- 无生命周期Hook系统

### 约束
- 仅适配主通用Agent，部门Agent机制暂不涉及
- 保持向后兼容，不破坏现有API契约
- Hook系统设计需考虑性能，避免过度调用影响响应延迟
- 进度追踪需控制数据量，避免内存泄漏

### 利益相关方
- 前端开发：需要进度展示组件和Agent类型选择UI
- 后端开发：需要实现Hook机制和工具过滤
- 运维：需要可观测性指标和日志
- 安全：需要权限审计和操作黑名单

## Goals / Non-Goals

**Goals:**
1. 实现内置Agent类型体系（general-purpose/explore/plan/verification）
2. 增强工具过滤系统，支持白名单/黑名单模式
3. 实现生命周期Hook机制
4. 完善进度追踪系统，支持实时推送
5. 适配三层记忆架构（User/Project/Local）

**Non-Goals:**
1. 不实现部门Agent类型体系
2. 不实现多智能体协调器（Coordinator模式）
3. 不实现Fork子智能体机制
4. 不实现团队协作协议

## Decisions

### Decision 1: Agent类型定义使用枚举+结构体模式

**选择**: 定义`BuiltinAgentType`枚举和`AgentTypeConfig`结构体

**理由**:
- 枚举提供类型安全，避免字符串比较
- 结构体允许灵活配置每个类型的工具权限和系统提示
- 与现有Rust生态（使用枚举表示有限集合）保持一致

**替代方案考虑**:
- 纯字符串配置：灵活性高但类型安全性低
- JSON配置：可外部化但增加解析开销

### Decision 2: Hook系统采用Trait+注册表模式

**选择**: 定义`AgentHook` trait，每个hook实现该trait，通过`HookRegistry`注册

**理由**:
- Trait提供统一的接口，便于扩展
- 注册表模式支持多Hook按优先级执行
- 与现有`ToolRegistry`设计保持一致

**替代方案考虑**:
- 函数回调：简单但不支持状态和依赖注入
- 闭包：灵活但难以序列化和持久化

### Decision 3: 进度追踪使用Channel+事件模式

**选择**: 使用Rust的`mpsc` channel发送`ProgressUpdate`事件，前端订阅

**理由**:
- Channel提供异步解耦，生产者和消费者独立扩展
- 事件模式支持多个消费者（UI、日志、监控）
- 与现有事件系统（`events.rs`）保持一致

**替代方案考虑**:
- 轮询：简单但延迟高、资源浪费
- WebSocket推送：实时但增加复杂度

### Decision 4: 三层记忆适配使用适配器模式

**选择**: 在现有`MemoryService`上封装`LayeredMemory`适配层

**理由**:
- 适配器模式允许在不修改现有代码的情况下扩展
- 保持现有API契约不变
- 支持渐进式迁移

**替代方案考虑**:
- 直接修改现有代码：风险高、需要大规模测试
- 独立实现：代码重复、维护成本高

## Risks / Trade-offs

### Risk 1: Hook性能影响
**问题**: 多个Hook同时执行可能导致响应延迟
**缓解**:
- Hook执行采用async，允许并发但限制并发数
- 提供Hook超时机制，防止单个Hook阻塞
- 支持Hook禁用开关，在性能敏感场景关闭

### Risk 2: 进度数据内存泄漏
**问题**: 长时间运行的会话可能积累大量进度数据
**缓解**:
- 进度数据使用环形缓冲区，限制内存使用
- 定期清理历史数据，只保留最近N条
- 提供数据持久化选项，避免全量内存存储

### Risk 3: 向后兼容性
**问题**: 新API可能破坏现有集成
**缓解**:
- 所有新增API标记为`#[deprecated]`进行过渡
- 保持现有API签名不变
- 提供migration指南

### Risk 4: 工具过滤规则复杂性
**问题**: 白名单/黑名单模式可能产生冲突
**缓解**:
- 定义明确的优先级规则：黑名单优先于白名单
- 提供配置验证器，检测冲突规则
- 记录所有过滤决策用于调试

## Migration Plan

### Phase 1: 基础设施（Week 1）
1. 创建`builtin_agent_types.rs`定义类型枚举和配置
2. 扩展`ToolRegistry`增加`filter_for_agent`方法
3. 创建`hooks.rs`定义Hook trait和注册表

### Phase 2: 核心实现（Week 2）
1. 实现四种内置Agent类型
2. 实现Hook机制
3. 集成到Agent执行流程

### Phase 3: 可观测性（Week 3）
1. 完善进度追踪系统
2. 适配三层记忆架构
3. 添加前端展示组件

### Rollback Strategy
- 使用feature flag控制新功能开关
- 数据库schema变更使用additive方式（新增列，不删除旧列）
- Hook配置支持回滚到之前版本

## Open Questions

### Q1: Hook执行顺序如何定义？
**选项A**: 固定优先级（数字越小优先级越高）
**选项B**: 配置指定顺序
**建议**: 采用固定优先级+配置覆盖模式

### Q2: 进度数据存储策略？
**选项A**: 仅内存存储，重启丢失
**选项B**: SQLite持久化
**建议**: 采用内存+SQLite混合，重启后保留最近100条

### Q3: Agent类型切换是否需要重启会话？
**选项A**: 支持动态切换
**选项B**: 需要新会话
**建议**: 支持动态切换，但工具过滤变更需要用户确认
