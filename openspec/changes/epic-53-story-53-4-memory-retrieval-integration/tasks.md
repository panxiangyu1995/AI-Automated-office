# Tasks: 记忆检索与注入集成

## 任务列表

### Task 123: 记忆检索与注入集成

| 属性 | 值 |
|------|-----|
| **ID** | 123 |
| **Epic** | Epic 53 |
| **Story** | Story 53.4 |
| **标题** | 记忆检索与注入集成 |
| **implementationType** | refactor |
| **优先级** | medium |
| **阶段** | Phase 3 - 记忆层与提示词集成 |

### 详细任务清单

#### 1. 创建记忆模块结构
- [ ] 创建 `src-tauri/src/agent/memory/` 目录
- [ ] 创建 `mod.rs` 模块入口
- [ ] 创建 `injector.rs` 记忆注入器
- [ ] 创建 `prioritizer.rs` 优先级排序
- [ ] 更新 `src-tauri/src/agent/mod.rs` 引入 memory 模块

#### 2. 实现记忆数据结构 (injector.rs)
- [ ] 定义 `MemoryItem` 结构体
- [ ] 定义 `MemoryType` 枚举
- [ ] 定义 `MemorySource` 结构体
- [ ] 定义 `MemoryContext` 结构体
- [ ] 定义 `MemorySourceMeta` 结构体
- [ ] 定义 `RetrievalMethod` 枚举
- [ ] 定义 `MemoryQuery` 结构体

#### 3. 实现记忆注入器 (injector.rs)
- [ ] 定义 `MemoryInjector` 结构体
- [ ] 实现 `MemoryInjector::new()` 构造函数
- [ ] 实现 `retrieve_relevant_memories()` 检索相关记忆
- [ ] 实现 `preload_session_memories()` 预加载会话记忆
- [ ] 实现 `inject_memories()` 注入记忆到上下文
- [ ] 实现 `format_memories_for_prompt()` 格式化提示词
- [ ] 实现 `track_memory_sources()` 来源追踪
- [ ] 实现敏感信息过滤 `filter_sensitive_content()`

#### 4. 实现优先级排序 (prioritizer.rs)
- [ ] 定义 `MemoryPrioritizer` 结构体
- [ ] 定义 `PriorityWeights` 结构体
- [ ] 实现 `MemoryPrioritizer::new()` 构造函数
- [ ] 实现 `calculate_priority_score()` 计算优先级分数
- [ ] 实现 `apply_time_decay()` 时间衰减
- [ ] 实现 `calculate_relevance_score()` 相关性分数
- [ ] 实现 `sort_memories()` 排序记忆
- [ ] 实现 `prune_by_token_limit()` Token 限制裁剪

#### 5. 实现记忆预加载
- [ ] 在会话管理器中实现预加载接口
- [ ] 实现用户偏好记忆获取
- [ ] 实现最近任务历史获取
- [ ] 实现上下文初始化

#### 6. 集成到 Agent 执行流程
- [ ] 在用户输入处理中集成记忆检索
- [ ] 在 PromptBuilder 中集成记忆注入
- [ ] 实现记忆来源元数据传递

#### 7. 暴露 Tauri 命令
- [ ] 实现 `invoke_get_relevant_memories` 命令
- [ ] 实现 `invoke_preload_session_memories` 命令
- [ ] 实现 `invoke_get_memory_source_tracking` 命令

### 验收标准

#### 功能验收
- [ ] MemoryInjector 正确检索相关记忆
- [ ] MemoryPrioritizer 正确计算优先级并排序
- [ ] 会话启动时正确预加载记忆
- [ ] 用户输入时正确触发记忆检索
- [ ] 记忆正确格式化并注入到提示词
- [ ] 记忆来源追踪正确记录
- [ ] 敏感信息被正确过滤
- [ ] Token 限制被正确执行

#### 非功能验收
- [ ] 记忆检索延迟 < 100ms
- [ ] 通过 lint 检查
- [ ] 单元测试覆盖核心逻辑
- [ ] Rust 编译通过，无警告

### 测试要点

#### 单元测试
- 优先级评分计算测试
- 时间衰减算法测试
- 相关性评分测试
- Token 裁剪测试
- 敏感信息过滤测试

#### 集成测试
- 与 Epic 6 记忆存储集成测试
- 与 PromptBuilder 集成测试
- 会话预加载集成测试
- Tauri 命令端到端测试

#### 边界条件测试
- 无相关记忆处理
- 记忆数量超限处理
- Token 限制边界处理
- 空用户输入处理
- 会话 ID 无效处理

### 执行顺序

1. 完成前置依赖（Task 101, Story 53.1, Story 6.3, Story 9.1）
2. 创建记忆模块结构
3. 实现记忆数据结构
4. 实现记忆注入器
5. 实现优先级排序
6. 实现记忆预加载
7. 集成到 Agent 执行流程
8. 暴露 Tauri 命令
9. 单元测试
10. 集成测试
11. 文档更新
