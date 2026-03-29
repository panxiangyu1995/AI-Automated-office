## Context

当前 AI-Automated-office 的工具审批机制是二元状态：需要确认或不需要确认。但不同用户场景需要不同的自动化程度：

1. **新手用户**：需要逐项审批确认，确保 AI 操作符合预期
2. **高级用户**：需要完全自动执行，提升效率
3. **自动化场景**：CI/CD 流水线、批量处理，需要 YOLO 完全自动模式

当前系统缺少灵活的场景化配置和 YOLO 完全自动模式。

**参考 cline 的实现**：其 Manual/Auto/Yolo/Hybrid 四档路由模式已被验证可满足不同用户需求。

## Goals / Non-Goals

**Goals:**
- 支持路由模式四档：Manual、Auto、Yolo、Hybrid
- Yolo 模式需要安全警告和二次确认防误触
- Yolo 模式支持生效时间限制（TTL）
- Yolo 模式使用日志记录，便于审计
- 管理员可禁用 Yolo 模式（企业安全策略）
- 企业可设置默认路由模式

**Non-Goals:**
- 不改变现有工具敏感度评估机制
- 不实现基于上下文的动态路由
- 不实现 Multi-Agent 路由

## Decisions

### Decision 1: RoutingMode 枚举定义

**选择：** 在 `AgentConfig` 中添加 `routing_mode: RoutingMode` 字段

```rust
pub enum RoutingMode {
    Manual,   // 每个工具调用都需要用户确认
    Auto,     // 按敏感度评估自动决定
    Yolo,     // 完全自动执行，无阻止
    Hybrid,   // 读取类 Auto，写入类 Manual
}

pub struct AgentConfig {
    pub routing_mode: RoutingMode,
    pub yolo_ttl_seconds: Option<u64>,  // Yolo 生效时间限制
    pub // ...
}
```

### Decision 2: Yolo 模式安全确认流程

**选择：** Yolo 模式开启需要二次确认：用户需阅读警告 + 勾选确认框 + 点击确认按钮

**理由：**
- 防止误触：单次点击容易误开启
- 明确告知：用户必须阅读警告内容
- 可追溯：确认记录可审计

```typescript
// 前端确认对话框
interface YoloConfirmDialog {
  warningText: string;      // 安全警告内容
  requireCheckbox: true;    // 必须勾选
  confirmButtonText: string; // "确认开启 YOLO Mode"
}
```

### Decision 3: Yolo 模式 TTL（Time-To-Live）

**选择：** Yolo 模式支持生效时间限制，到期自动恢复为 Auto 模式

**理由：**
- 临时需要批量处理时方便
- 自动失效，无需手动关闭
- 减少安全风险敞口

```rust
pub enum YoloTtl {
    Once,           // 单次有效（下一个任务）
    OneHour,        // 1小时
    Today,          // 本日有效（到午夜）
    Custom(u64),    // 自定义秒数
}
```

### Decision 4: 工具执行路由决策

**选择：** 在 ToolPipeline 中根据 RoutingMode 决定是否需要审批

```rust
impl ToolPipeline {
    pub async fn execute(&self, tool: &ToolCall) -> Result<ToolResponse> {
        match self.config.routing_mode {
            RoutingMode::Manual => {
                // 全部需要确认
                return self.request_confirmation(tool).await;
            },
            RoutingMode::Auto => {
                // 按敏感度评估
                let sensitivity = self.assess_sensitivity(tool).await?;
                if sensitivity.requires_confirmation {
                    return self.request_confirmation(tool).await;
                }
            },
            RoutingMode::Yolo => {
                // 完全自动，检查 TTL
                if self.check_yolo_ttl_expired() {
                    return Err(ToolError::YoloModeExpired);
                }
                // 直接执行，无阻止
            },
            RoutingMode::Hybrid => {
                // 读取类自动，写入类确认
                if tool.is_read_only {
                    // 自动执行
                } else {
                    return self.request_confirmation(tool).await;
                }
            },
        }
    }
}
```

### Decision 5: Yolo 模式日志记录

**选择：** Yolo 模式下的每次工具调用都记录审计日志，包含 `yolo_mode: true` 标志

**理由：**
- 安全审计需要
- 可追溯 Yolo 模式下的所有操作
- 便于成本核算

```rust
pub struct AuditLog {
    pub tool_call_id: String,
    pub tool_name: String,
    pub user_id: String,
    pub yolo_mode: bool,       // 是否 Yolo 模式下执行
    pub routing_mode: String,   //当时的路由模式
    pub timestamp: i64,
}
```

## Risks / Trade-offs

| Risk | 可能性 | 影响 | Mitigation |
|------|--------|------|------------|
| Yolo 模式误开启导致危险操作 | 低 | 数据丢失、系统损坏 | 二次确认 + TTL + 日志审计 |
| Yolo 模式长时间不关闭 | 中 | 安全风险敞口 | TTL 默认开启 + 管理员可禁用 |
| 用户不理解模式差异 | 中 | 操作困惑 | UI 清晰说明 + 引导提示 |
| 管理员强制禁用后用户效率下降 | 低 | 用户抱怨 | 提供 Hybrid 模式作为折中 |

## Migration Plan

1. **阶段1（向后兼容）**：
   - 添加 `RoutingMode` 枚举，默认值保持现有行为（等同于 Auto）
   - 现有配置自动迁移，无需用户操作

2. **阶段2（UI 更新）**：
   - 设置页面添加路由模式选择器
   - Yolo 模式默认隐藏（高级选项）

3. **阶段3（企业策略）**：
   - 管理员控制台添加 "禁用 Yolo 模式" 选项
   - 企业账户默认禁用

## Open Questions

1. Yolo 模式下的审批超时如何处理？（自动取消还是继续执行？）
2. Yolo 模式是否需要单独的 API Key 配置？
3. 混合模式中"读取类"和"写入类"如何精确界定？
