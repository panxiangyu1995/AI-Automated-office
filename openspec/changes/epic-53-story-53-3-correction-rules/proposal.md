# Proposal: 错题集规则自动应用

## 变更类型
- [x] 新功能 (new)

## 背景

Agent 在执行任务过程中可能会重复犯错，例如：
- 合同金额大写错误
- 审批流程遗漏必要步骤
- 报表格式不符合规范

需要实现错题集规则自动应用机制，基于当前任务场景自动检索匹配的错题集规则，并将规则作为提示词注入到 Agent 的执行上下文中，避免重复犯错。

## 目标

实现错题集规则自动应用，满足以下验收标准：

1. 创建 CorrectionRuleMatcher 规则匹配器
2. 实现基于当前任务场景的错题集检索
3. 实现匹配规则的提示词注入
4. 添加规则应用的审计记录
5. 实现规则效果的反馈收集

## 范围

### 包含
- 创建 `src-tauri/src/agent/correction/mod.rs` 模块
- 创建 `CorrectionRuleMatcher` Rust 结构体
- 实现基于场景的规则检索（关键词匹配、语义相似度）
- 实现规则优先级排序
- 实现规则到提示词的转换
- 实现规则应用的审计日志
- 实现规则效果反馈收集接口
- 与 PromptBuilder 集成（Story 53.1）
- Tauri 命令暴露：`invoke_match_correction_rules`, `invoke_feedback_rule_effectiveness`

### 不包含
- 错题集存储实现（由 Epic 6 负责）
- 前端 UI 展示（由其他 Story 负责）

## 影响范围

### 前端
- 需要显示应用的规则信息（可选）
- 需要提供规则效果反馈入口（可选）

### 后端
- 新增 Rust 模块：`src-tauri/src/agent/correction/mod.rs`
- 新增 Rust 模块：`src-tauri/src/agent/correction/matcher.rs`
- 新增 Rust 模块：`src-tauri/src/agent/correction/audit.rs`
- 修改：`src-tauri/src/agent/prompt/mod.rs` 集成规则注入

### 数据库
- 无直接数据库变更
- 通过接口调用错题集存储（由 Epic 6 提供）
- 审计日志依赖审计系统（Epic 55）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 错题集存储接口未就绪 | 中 | 中 | 使用 Mock 接口开发，后续对接 |
| 规则匹配过于宽泛 | 中 | 中 | 实现相关性阈值过滤 |
| 规则冲突 | 低 | 中 | 实现优先级排序，覆盖规则 |
| 过度注入规则 | 低 | 高 | 限制注入规则数量 |

## 依赖

### 前置依赖
- Story 53.1 (提示词构建器) - 依赖其提供的规则注入接口
- Story 6.6 (错题集存储)
- Task 101 (后端 Rust Agent 基础架构)

### 后置依赖
- Story 53.4 (记忆检索与注入集成) - 依赖规则上下文

## 实现步骤

1. **创建规则模块结构**
   - 创建 `src-tauri/src/agent/correction/` 目录
   - 创建 `mod.rs` 模块入口
   - 创建 `matcher.rs` 实现规则匹配
   - 创建 `audit.rs` 实现审计日志

2. **实现规则匹配器**
   - 定义 `CorrectionRule` 数据结构
   - 实现基于关键词的匹配
   - 实现基于语义相似度的匹配
   - 实现规则优先级计算

3. **实现规则提示词转换**
   - 实现规则到提示词片段的转换
   - 实现规则格式化模板

4. **实现审计日志**
   - 定义审计事件结构
   - 实现规则应用记录
   - 实现效果反馈记录

5. **集成到 PromptBuilder**
   - 在 PromptBuilder 中添加规则注入接口
   - 实现规则过滤和排序

6. **暴露 Tauri 命令**
   - 实现 `invoke_match_correction_rules` 命令
   - 实现 `invoke_feedback_rule_effectiveness` 命令
