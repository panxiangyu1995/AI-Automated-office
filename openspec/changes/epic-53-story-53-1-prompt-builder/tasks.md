# Tasks: 提示词构建器 - 分层提示词整合

## 任务列表

### Task 120: 提示词构建器 - 分层提示词整合

| 属性 | 值 |
|------|-----|
| **ID** | 120 |
| **Epic** | Epic 53 |
| **Story** | Story 53.1 |
| **标题** | 提示词构建器 - 分层提示词整合 |
| **implementationType** | new |
| **优先级** | high |
| **阶段** | Phase 3 - 记忆层与提示词集成 |

### 详细任务清单

#### 1. 创建 Rust 模块结构
- [ ] 创建 `src-tauri/src/agent/prompt/` 目录
- [ ] 创建 `mod.rs` 模块入口，导出 `PromptBuilder`
- [ ] 创建 `layer.rs` 定义分层提示词结构体
- [ ] 创建 `builder.rs` 实现 `PromptBuilder` 核心逻辑
- [ ] 更新 `src-tauri/src/agent/mod.rs` 引入 prompt 模块

#### 2. 实现分层提示词结构 (layer.rs)
- [ ] 定义 `PromptLayer` 枚举
- [ ] 定义 `SystemPrompt` 结构体（base_instructions, safety_rules, format_requirements）
- [ ] 定义 `RolePrompt` 结构体（role_name, role_description, capabilities, constraints）
- [ ] 定义 `MemoryContext` 结构体
- [ ] 定义 `KnowledgeResult` 结构体
- [ ] 定义 `CorrectionRule` 结构体

#### 3. 实现 PromptBuilder 核心类 (builder.rs)
- [ ] 实现 `PromptBuilder::new(max_token_limit)` 构造函数
- [ ] 实现 `with_system_prompt()` 方法
- [ ] 实现 `with_role_prompt()` 方法
- [ ] 实现 `with_memory_context()` 方法
- [ ] 实现 `with_knowledge()` 方法
- [ ] 实现 `with_correction_rules()` 方法
- [ ] 实现 `build()` 方法，返回合并后的提示词
- [ ] 实现 `estimate_token_count()` 方法

#### 4. 实现提示词合并逻辑
- [ ] 实现分层优先级排序
- [ ] 实现系统提示词与角色提示词合并
- [ ] 实现记忆上下文格式化
- [ ] 实现知识库结果格式化
- [ ] 实现错题集规则格式化

#### 5. 暴露 Tauri 命令
- [ ] 在 `commands.rs` 中实现 `invoke_build_prompt` 命令
- [ ] 定义 `PromptRequest` 和 `PromptResponse` 结构体
- [ ] 实现错误处理 `PromptError` 枚举

#### 6. 前端集成
- [ ] 创建 `src/stores/promptStore.ts` Zustand Store
- [ ] 创建 `src/features/agent/hooks/usePromptBuilder.ts` Hook
- [ ] 更新 Agent 执行流程调用提示词构建

### 验收标准

#### 功能验收
- [ ] PromptBuilder 核心类创建成功，模块结构符合设计
- [ ] 系统提示词与角色提示词正确合并，优先级正确
- [ ] 个人记忆（L1）正确集成到提示词上下文
- [ ] 企业知识库（L2）检索结果正确集成到提示词上下文
- [ ] 错题集规则正确自动注入到提示词
- [ ] `invoke_build_prompt` Tauri 命令正常工作
- [ ] Token 数量估算准确

#### 非功能验收
- [ ] 提示词构建延迟 < 100ms（不含记忆/知识库检索）
- [ ] 通过 lint 检查
- [ ] 单元测试覆盖核心逻辑
- [ ] Rust 编译通过，无警告

### 测试要点

#### 单元测试
- `PromptBuilder::new()` 创建测试
- `with_*` 方法链式调用测试
- `build()` 方法输出格式测试
- `estimate_token_count()` 准确性测试
- 分层优先级测试

#### 集成测试
- 与记忆检索接口集成测试
- 与知识库检索接口集成测试
- 与错题集接口集成测试
- Tauri 命令端到端测试

#### 边界条件测试
- 空记忆列表处理
- 空知识库结果处理
- 无错题集规则处理
- Token 预算超限处理
- 多角色提示词冲突处理

### 执行顺序

1. 完成前置依赖（Task 101, Story 21.1, Story 21.2, Story 6.1, Story 6.2, Story 6.6）
2. 创建 Rust 模块结构
3. 实现分层提示词结构
4. 实现 PromptBuilder 核心逻辑
5. 暴露 Tauri 命令
6. 前端集成
7. 单元测试
8. 集成测试
9. 文档更新
