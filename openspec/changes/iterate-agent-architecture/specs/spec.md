# Specification: Agent核心模块架构优化

## 需求来源

基于架构升级迭代 skill，对 Agent 核心模块（`src-tauri/src/agent/` + `src/features/agent/`）进行架构优化。

## 约束条件

### 功能不变性（铁律约束）

1. **Tauri IPC 接口不变**：所有 `#[tauri::command]` 导出接口保持不变
2. **前端 Props 类型不变**：所有 React 组件 Props 接口保持不变
3. **LLM 后端支持不变**：Zhipu/DeepSeek/Minimax/OpenAI-compatible 支持不变
4. **工具执行流程不变**：工具注册、参数验证、执行、结果返回流程不变
5. **路由匹配逻辑不变**：keyword/semantic/combined/llm_guided 匹配算法不变
6. **三层记忆架构不变**：Personal/Enterprise/Graph 记忆存储和检索不变
7. **会话管理不变**：会话创建、心跳、检查点、恢复流程不变
8. **权限检查不变**：工具权限、字段权限、范围过滤逻辑不变

### 架构约束

- 遵守 SOLID/KISS/DRY/DIP/YAGNI 原则
- 符合分层微内核架构（Presentation Layer → Agent Core Layer → Plugin Layer → Data Layer → Cloud Layer）
- 符合架构文档定义的模块边界
- 符合 PRD 定义的 FR9-FR19 (AI Agent 核心能力)

### 性能约束

- NFR3: AI 对话首字 <2s（不得因架构变更引入额外延迟）
- NFR5: 内存 <500MB（不得因架构变更显著增加内存占用）

## 验收标准

### 阶段一：工具自注册模式

- [ ] `cargo check` 无编译错误
- [ ] tools/pipeline.rs 不再直接 import 具体工具子模块
- [ ] 所有工具通过 `pub fn register_tools(registry, executors)` 自注册
- [ ] 工具注册顺序与优化前一致

### 阶段二：并发原语统一

- [ ] `cargo check` 无编译错误
- [ ] ToolRegistry 使用 `Arc<RwLock<HashMap<String, ToolDescriptor>>>`
- [ ] 所有读操作使用 `.read()`，写操作使用 `.write()`
- [ ] `cargo test --lib` 单元测试通过

### 阶段三：Provider Strategy 模式

- [ ] `cargo check` 无编译错误
- [ ] 定义 `AgentStrategy` trait
- [ ] 实现 `PlanStrategy` 和 `ActStrategy`
- [ ] Plan 模式仅使用只读工具
- [ ] Act 模式使用全部工具

### 阶段四：前端按域拆分

- [ ] `npm run build` 构建成功
- [ ] `npm run lint` 无错误
- [ ] 组件按 chat/collaboration/monitoring/pilot 功能域正确分组
- [ ] 旧导入路径通过兼容层可用

### 阶段五：大文件拆分

- [ ] `cargo check` 无编译错误
- [ ] enterprise.rs 拆分后每文件 <400 行
- [ ] document.rs 拆分后每文件 <400 行
- [ ] filesystem.rs 拆分后每文件 <400 行
- [ ] 所有拆分文件的 `pub fn register_tools` 正确聚合

### 功能回归测试

- [ ] 工具注册流程测试通过
- [ ] Plan/Act 模式切换测试通过
- [ ] 路由匹配逻辑测试通过
- [ ] 前端组件渲染测试通过

### 代码质量

- [ ] `cargo clippy -- -D warnings` 无警告
- [ ] `npm run lint` 无错误
- [ ] 无新增循环依赖
- [ ] 无新增大文件（>400 行）
