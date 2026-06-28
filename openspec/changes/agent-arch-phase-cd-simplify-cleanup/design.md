# Design: Agent Runtime 架构重构 - Phase C+D: 子系统精简与清理

## C1: 简化路由系统

### 优化前

```
SubAgentRoutingService (~700行)
├── RoutingMode (Manual/Auto/Hybrid/Yolo)
├── MatchStrategy (Keyword/Semantic/Combined/LlmGuided)
├── RiskEvaluation (~150行)
├── ApprovalQueue
├── ConfirmationState (双确认防误触)
└── SemanticRouter (向量匹配)
```

### 优化后

```
SimpleRouter (~100行)
├── RoutingMode (保留 Manual/Auto/Hybrid)
├── MatchStrategy (仅 Keyword)
└── 无风险评估/双确认/向量匹配
```

**简化规则**:

| 原有功能 | 保留/删除 | 原因 |
|---------|----------|------|
| Keyword 匹配 | 保留 | 最常用，性能好 |
| Manual/Auto/Hybrid 模式 | 保留 | 有实际用途 |
| Semantic 路由 | 删除 | 未被使用 |
| LlmGuided 路由 | 删除 | 未被使用 |
| RiskEvaluation | 删除 | 过度工程化 |
| ConfirmationState | 删除 | 过度工程化 |
| ApprovalQueue | 删除 | 可在 UI 层实现 |

### C2: 精简记忆系统

### 优化前

```
MemoryScope 枚举 (4个值)
├── Private      # Sub-Agent 私有
├── Shared       # 与主 Agent 共享
├── Inherited    # 从主 Agent 继承（只读） ← 未使用
└── SessionOnly  # 仅限当前会话 ← 与 Private 重复
```

### 优化后

```
MemoryScope 枚举 (2个值)
├── Private      # 私有记忆
└── Shared       # 共享记忆
```

**保留**:
- 个人记忆层（UserMemory）
- 企业知识库层（KnowledgeBase）
- 上下文窗口管理（ContextWindow）

**删除**:
- `MemoryScope::Inherited`（未使用）
- `MemoryScope::SessionOnly`（与 Private 重复）
- 向量嵌入搜索（保留全文搜索）

### C3: 合并监控模块

### 优化前

```
monitoring.rs
monitoring_types.rs
audit.rs
audit_types.rs
audit_siem.rs
events.rs
```

### 优化后

```
monitoring.rs (~300行)
├── EventEmitter trait
├── MetricsCollector struct
└── AuditLogger struct
```

### D1: 待删除空壳模块

| 文件 | 删除原因 |
|------|----------|
| `execution_integration.rs` | 空壳聚合文件，无独立逻辑 |
| `pilot.rs` | 孤立的编排逻辑，未被调用 |
| `router/` 目录 | 未使用的语义路由器 |
| `model_router.rs` | 未使用的模型路由器 |
| `routing_types.rs` | 被 SimpleRouter 替代 |

## 验证方法

```bash
cargo check
cargo build
cargo test --lib
cargo clippy -- -D warnings
npm run lint
npm run build
```
