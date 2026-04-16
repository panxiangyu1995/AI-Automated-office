# C2 代码审查报告

> 审查范围: 工作树未提交变更 (C2 phase)
> 审查日期: 2026-04-16
> 审查者: reviewer

---

## 审批判定: **[OK]**

0 CRITICAL、0 HIGH、2 MEDIUM、3 LOW。所有维度 ADEQUATE+。

---

## C1 审查问题修复状态

| C1 发现 | 状态 | 说明 |
|---------|------|------|
| F1: build.txt/build_errors.txt 提交 | **已修复** | .gitignore 已添加，文件已删除 |
| F2: routing.rs expect | **已修复** | 改用 `let Some(...) else { return false }` 模式 |
| F3: memory/service.rs 零向量占位 | 未修 | 下轮处理 |
| F5/F6: execute_with_params 类型退化 | 未修 | 下轮处理 |
| F7: 伪随机 | 未修 | 下轮处理 |

---

## 发现汇总

| # | 级别 | 类别 | 位置 | 摘要 |
|---|------|------|------|------|
| F1 | MEDIUM | 质量 | `group_agent.rs:701` | 文件 701 行，超过 800 行限制的 87% — 接近但未超限 |
| F2 | MEDIUM | 安全 | `template_store.rs` 测试 | 测试使用 `env::set_var`/`env::remove_var` 修改全局状态 — 并行测试不安全 |
| F3 | LOW | 质量 | `group_agent.rs` | `handle_collaboration_event` 遍历所有成员+逐个权限检查 — 大群性能风险 |
| F4 | LOW | 铁律 | `ProblemCenter.tsx` | `onMouseEnter/Leave` 内联 style 修改 — 应使用 CSS 类状态切换 |
| F5 | LOW | 质量 | `departmentComponents.test.ts` | 静态分析测试用 `readFileSync` 读取源码 — 路径依赖项目结构，脆弱 |

---

## 详细发现

### F1 [MEDIUM] group_agent.rs 文件体积

**位置**: `src-tauri/src/message/group_agent.rs` — 701 行

**问题**: 文件包含类型定义、引擎实现和 13 个单元测试。虽未超过 800 行限制，但已接近。随着更多协作场景加入，将很快超限。

**建议**: 将测试移至 `#[cfg(test)] mod tests;` 外部文件或拆分类型到 `types.rs`。

### F2 [MEDIUM] template_store 测试的全局环境变量

**位置**: `src-tauri/src/storage/template_store.rs` create_test_pool()

```rust
env::set_var("AI_OFFICE_DATA_DIR", &base_dir);
let pool = crate::storage::sqlite::create_pool(&tenant_id).await.unwrap();
env::remove_var("AI_OFFICE_DATA_DIR");
```

**问题**: `env::set_var` 和 `env::remove_var` 修改进程级全局状态。在 `#[tokio::test]` 并行执行时，多个测试可能同时读写同一环境变量，导致竞态条件。Rust 社区已将 `std::env::set_var` 标记为线程不安全。

**建议**: 使用 `tempfile::tempdir()` 创建临时目录，直接传递路径参数而非环境变量。

### F3 [LOW] handle_collaboration_event 大群性能

**位置**: `group_agent.rs` `handle_collaboration_event()`

**问题**: 遍历群组所有成员，逐个检查权限和数据范围。对于大群（如 500 人的全员群），每次事件触发需要 500 次权限查询 + 500 次数据范围查询。

**建议**: 预缓存 "群内启用了 Agent 的成员列表"，仅遍历活跃 Agent 成员。

### F4 [LOW] ProblemCenter 内联 style 修改

**位置**: `src/components/common/panel/ProblemCenter.tsx`

```tsx
onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ao-bottomPanel-activeBackground)' }}
onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
```

**问题**: 通过 DOM style 属性直接修改背景色，绕过了 React 的声明式模型。应使用 state + className 切换。

**建议**: 使用 `useState` 跟踪 hover 状态，或使用 Tailwind `hover:` 伪类。

### F5 [LOW] 部门组件静态分析测试脆弱性

**位置**: `tests/unit/features/departmentComponents.test.ts`

**问题**: 测试使用 `readFileSync` 直接读取源文件并检查导出名和 hex 颜色。这依赖于源文件路径和代码格式不变，重构或移动文件会导致测试假失败。

**建议**: 可接受作为轻量级静态守卫，但应标注为静态分析测试（非行为测试），且路径应使用配置化的别名。

---

## 审查维度评估

| 维度 | 评级 | 说明 |
|------|------|------|
| RD-1 铁律合规 | GOOD | C1 HIGH 问题已修复；工具命名合规；颜色全量迁移到 var(--ao-*)；.gitignore 修复 |
| RD-2 产品深度 | GOOD | 群聊 Agent 协作 (FR639-FR649) 实现完整；模板 SQLite 持久化含版本/发布/回滚；问题中心面板功能完整 |
| RD-3 代码质量 | ADEQUATE | group_agent.rs 701行；template_store 测试环境变量问题 (F2)；ProblemCenter hover 模式 (F4) |
| RD-4 可测试性 | GOOD | group_agent.rs 含 13 个单元测试；template_store 含 10 个集成测试（含 SQLite）；部门组件静态分析测试 |

---

## 正面发现

| # | 类别 | 内容 |
|---|------|------|
| P1 | 安全 | C1 F1 已修复 — .gitignore 排除构建日志 + 文件已删除 |
| P2 | 安全 | C1 F2 已修复 — routing.rs 使用 `let Some else` 替代 `expect` |
| P3 | 产品 | GroupAgentEngine 完整实现 FR639-FR649 — 消息标识/发言权限/数据隔离/协作事件 |
| P4 | 产品 | TemplateStore 基于 SQLite — 完整 CRUD + 发布/归档/回滚 + 租户隔离 |
| P5 | 产品 | ProblemCenter 问题中心面板 — 严重级别筛选/来源分类/批量清除 |
| P6 | 铁律 | CommandPalette 全面颜色迁移到 var(--ao-commandPalette-*) |
| P7 | 铁律 | 新增 commandPaletteColors.ts — 9 个主题变量，light/dark/hc 三组 |
| P8 | 质量 | TemplateStore 使用 sqlx 参数化查询 — 防 SQL 注入 |
| P9 | 质量 | TemplateStore 所有查询含 tenant_id 条件 — 多租户隔离 |
| P10 | 质量 | GroupAgentEngine 权限检查在消息生成前执行 — 最小权限原则 |
| P11 | 测试 | departmentComponents.test.ts 静态分析守卫 — 验证导出和 CSS 变量使用 |
| P12 | 质量 | v10 迁移使用 `CREATE TABLE IF NOT EXISTS` + 索引 — 安全幂等 |

---

## 建议优先级

1. **本轮修复**: F2 (template_store 测试环境变量 → tempfile)
2. **下轮修复**: F1 (group_agent.rs 拆分), F4 (ProblemCenter hover 模式)
3. **低优先级**: F3, F5
