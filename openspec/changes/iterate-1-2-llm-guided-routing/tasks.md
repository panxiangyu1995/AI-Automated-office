# 任务拆分 - LLM引导路由实现

## 任务清单

### Task 1: 创建 RoutePromptTemplate

**文件**: `src-tauri/src/agent/router/prompt.rs` (新建)

**步骤**:
1. 定义 `AgentInfo` 结构体
2. 定义 `RoutePromptTemplate` 结构体
3. 实现 `RoutePromptTemplate::new()`
4. 实现 `build_prompt()` 方法
5. 定义默认系统提示词

**验收标准**:
- [ ] `AgentInfo` 结构体包含 id, name, description 字段
- [ ] `RoutePromptTemplate` 可以构建正确的 prompt
- [ ] prompt 包含所有可用 agent 信息

---

### Task 2: 创建 LlmGuidedRouter

**文件**: `src-tauri/src/agent/router/llm_router.rs` (新建)

**步骤**:
1. 定义 `LlmRouteResponse` 结构体
2. 定义 `LlmGuidedRouter` 结构体
3. 实现 `LlmGuidedRouter::new()`
4. 实现 `route()` 方法
5. 实现 `parse_response()` 方法
6. 实现 `fallback_route()` 方法

**验收标准**:
- [ ] `LlmGuidedRouter` 可以调用 LLM
- [ ] 正确解析 LLM 响应
- [ ] 置信度低于阈值时回退

---

### Task 3: 集成到 IntentRouter

**文件**: `src-tauri/src/agent/router/router.rs`

**步骤**:
1. 添加 `LlmGuidedRouter` 字段
2. 修改 `IntentRouter::new()` 支持注入 LLM 路由
3. 修改 `route()` 方法支持 LLM 引导路由
4. 实现 `RouteStrategy` 枚举

**验收标准**:
- [ ] IntentRouter 支持 LLM 引导路由
- [ ] 可以配置使用 LLM 路由还是规则路由
- [ ] LLM 不可用时自动回退

---

### Task 4: 添加单元测试

**步骤**:
1. 测试 `RoutePromptTemplate::build_prompt()`
2. 测试 `LlmGuidedRouter::parse_response()`
3. 测试置信度阈值判断

**验收标准**:
- [ ] 所有单元测试通过
- [ ] 覆盖边界情况

---

### Task 5: 集成测试

**步骤**:
1. 测试完整的 LLM 引导路由流程
2. 测试回退机制
3. 测试置信度阈值效果

**验收标准**:
- [ ] 集成测试通过
- [ ] LLM 路由正常工作
