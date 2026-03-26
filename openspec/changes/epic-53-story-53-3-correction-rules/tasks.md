# Tasks: 错题集规则自动应用

## 任务列表

### Task 122: 错题集规则自动应用

| 属性 | 值 |
|------|-----|
| **ID** | 122 |
| **Epic** | Epic 53 |
| **Story** | Story 53.3 |
| **标题** | 错题集规则自动应用 |
| **implementationType** | new |
| **优先级** | medium |
| **阶段** | Phase 3 - 记忆层与提示词集成 |

### 详细任务清单

#### 1. 创建规则模块结构
- [ ] 创建 `src-tauri/src/agent/correction/` 目录
- [ ] 创建 `mod.rs` 模块入口
- [ ] 创建 `matcher.rs` 规则匹配器
- [ ] 创建 `audit.rs` 审计日志
- [ ] 更新 `src-tauri/src/agent/mod.rs` 引入 correction 模块

#### 2. 实现规则数据结构 (matcher.rs)
- [ ] 定义 `CorrectionRule` 结构体
- [ ] 定义 `RuleExample` 结构体
- [ ] 定义 `RuleMatchContext` 结构体
- [ ] 定义 `RuleMatchResult` 结构体
- [ ] 定义 `MatchType` 枚举

#### 3. 实现规则匹配器 (matcher.rs)
- [ ] 定义 `CorrectionRuleMatcher` 结构体
- [ ] 实现 `CorrectionRuleMatcher::new()` 构造函数
- [ ] 实现 `match_rules()` 方法
- [ ] 实现 `match_by_keywords()` 关键词匹配
- [ ] 实现 `match_by_semantic()` 语义匹配
- [ ] 实现 `calculate_final_score()` 分数计算

#### 4. 实现规则提示词生成 (mod.rs)
- [ ] 定义 `RulePromptGenerator` 结构体
- [ ] 实现 `generate_rule_prompt()` 方法
- [ ] 实现 `format_single_rule()` 单条规则格式化
- [ ] 实现 `format_examples()` 示例格式化

#### 5. 实现审计日志 (audit.rs)
- [ ] 定义 `RuleApplicationEvent` 结构体
- [ ] 定义 `AppliedRule` 结构体
- [ ] 定义 `ApplicationOutcome` 枚举
- [ ] 定义 `RuleEffectivenessFeedback` 结构体
- [ ] 定义 `RuleStatistics` 结构体
- [ ] 定义 `RuleAuditor` 结构体
- [ ] 实现 `log_rule_application()` 记录应用事件
- [ ] 实现 `log_effectiveness_feedback()` 记录反馈
- [ ] 实现 `get_rule_statistics()` 获取统计

#### 6. 集成到 PromptBuilder
- [ ] 修改 `PromptBuilder` 添加规则注入接口
- [ ] 实现规则上下文构建
- [ ] 实现规则过滤和排序

#### 7. 暴露 Tauri 命令
- [ ] 实现 `invoke_match_correction_rules` 命令
- [ ] 实现 `invoke_feedback_rule_effectiveness` 命令
- [ ] 实现 `invoke_get_rule_statistics` 命令

### 验收标准

#### 功能验收
- [ ] CorrectionRuleMatcher 正确实现关键词匹配
- [ ] CorrectionRuleMatcher 正确实现语义匹配
- [ ] 规则按分数正确排序
- [ ] 规则提示词生成格式正确
- [ ] 规则应用审计日志正确记录
- [ ] 效果反馈正确收集
- [ ] 与 PromptBuilder 正确集成

#### 非功能验收
- [ ] 规则匹配延迟 < 50ms
- [ ] 通过 lint 检查
- [ ] 单元测试覆盖核心逻辑
- [ ] Rust 编译通过，无警告

### 测试要点

#### 单元测试
- 关键词匹配测试
- 语义匹配测试
- 分数计算测试
- 规则排序测试
- 提示词生成测试

#### 集成测试
- 与错题集存储集成测试
- 与 PromptBuilder 集成测试
- Tauri 命令端到端测试

#### 边界条件测试
- 无匹配规则处理
- 规则数量超限处理
- 空关键词列表处理
- 规则优先级冲突处理

### 执行顺序

1. 完成前置依赖（Task 101, Story 53.1, Story 6.6）
2. 创建规则模块结构
3. 实现规则数据结构
4. 实现规则匹配器
5. 实现规则提示词生成
6. 实现审计日志
7. 集成到 PromptBuilder
8. 暴露 Tauri 命令
9. 单元测试
10. 集成测试
11. 文档更新
