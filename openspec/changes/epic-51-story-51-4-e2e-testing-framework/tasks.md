# Tasks: 端到端测试框架与核心测试用例

## 任务元数据

| 属性 | 值 |
|------|-----|
| **Task ID** | 114 |
| **Epic** | Epic 51 |
| **Story** | Story 51.4 |
| **标题** | 端到端测试框架与核心测试用例 |
| **implementationType** | new |
| **phase** | Phase 1 - Agent Runtime端到端集成 |
| **priority** | medium |
| **backendRequired** | true |

## 验收标准

### AC1: MockLLMProvider创建

- [ ] MockLLMProvider实现LLMProvider接口
- [ ] 支持预设响应模板（JSON/YAML配置）
- [ ] 支持错误注入（随机失败、指定失败）
- [ ] 支持响应延迟控制
- [ ] 支持流式响应模拟
- [ ] Rust后端实现完成

### AC2: Mock工具集实现

- [ ] MockTool基类创建
- [ ] FileMockTool实现（模拟文件系统操作）
- [ ] HttpMockTool实现（模拟HTTP请求）
- [ ] DbMockTool实现（模拟数据库操作）
- [ ] Mock工具工厂创建
- [ ] 工具调用拦截器实现

### AC3: 完整对话流程测试

- [ ] 用户输入 → 意图解析测试用例
- [ ] 计划生成测试用例
- [ ] 工具调用全流程测试
- [ ] 结果返回验证测试
- [ ] 多轮对话上下文测试
- [ ] 并发请求处理测试

### AC4: 流式输出测试

- [ ] SSE事件模拟与验证
- [ ] 思考过程实时展示测试
- [ ] 工具调用状态流测试
- [ ] 流式中断与恢复测试

### AC5: 异常场景测试

- [ ] 中断信号处理测试
- [ ] 自动重试机制验证
- [ ] 检查点保存测试
- [ ] 检查点恢复测试

## 任务列表

### Task 114.1: 创建MockLLMProvider (前端)

**步骤**:
1. 创建 `src/tests/mocks/MockLLMProvider.ts`
2. 实现 `LLMProvider` 接口
3. 创建响应模板系统
4. 实现错误注入器
5. 实现流式响应模拟器
6. 编写单元测试

**产出**:
- `src/tests/mocks/MockLLMProvider.ts`
- `src/tests/fixtures/mock-responses/*.json`
- `src/tests/mocks/MockLLMProvider.test.ts`

### Task 114.2: 创建MockLLMProvider (后端Rust)

**步骤**:
1. 创建 `src-tauri/src/agent/test/mock_llm.rs`
2. 实现 `MockLLMProvider` 结构体
3. 实现 `LLMProvider` trait
4. 添加响应队列管理
5. 实现流式响应
6. 编写集成测试

**产出**:
- `src-tauri/src/agent/test/mock_llm.rs`
- `src-tauri/src/agent/test/mock_llm_test.rs`

### Task 114.3: 实现Mock工具集

**步骤**:
1. 创建 `src/tests/mocks/MockToolFactory.ts`
2. 实现 `MockTool` 基类
3. 实现 `FileMockTool`
4. 实现 `HttpMockTool`
5. 实现 `DbMockTool`
6. 实现工具调用拦截器
7. 编写单元测试

**产出**:
- `src/tests/mocks/MockToolFactory.ts`
- `src/tests/mocks/tools/*.mock.ts`
- `src/tests/mocks/MockToolFactory.test.ts`

### Task 114.4: 编写端到端测试用例

**步骤**:
1. 创建 `tests/e2e/agent/full-flow.test.ts`
2. 编写用户输入 → 意图解析测试
3. 编写计划生成测试
4. 编写工具调用测试
5. 编写多轮对话测试
6. 编写并发测试
7. 执行测试并验证

**产出**:
- `tests/e2e/agent/full-flow.test.ts`
- 测试覆盖率报告

### Task 114.5: 添加流式输出测试用例

**步骤**:
1. 创建 `tests/e2e/agent/streaming.test.ts`
2. 实现SSE事件模拟器
3. 编写思考过程测试
4. 编写工具状态流测试
5. 编写流式中断恢复测试
6. 执行测试并验证

**产出**:
- `tests/e2e/agent/streaming.test.ts`

### Task 114.6: 实现异常场景测试

**步骤**:
1. 创建 `tests/e2e/agent/error-recovery.test.ts`
2. 实现中断信号模拟器
3. 编写中断恢复测试
4. 编写重试机制测试
5. 实现检查点管理器
6. 编写检查点测试
7. 执行测试并验证

**产出**:
- `tests/e2e/agent/error-recovery.test.ts`
- `src/tests/helpers/checkpoint.ts`

## 执行顺序

```
[Task 114.1] 前端MockLLMProvider
       ↓
[Task 114.2] 后端MockLLMProvider (并行)
       ↓
[Task 114.3] Mock工具集
       ↓
[Task 114.4] 完整对话流程测试 ← 需要 Story 51.1/51.2/51.3 完成
       ↓
[Task 114.5] 流式输出测试   ← 需要 Story 51.2 完成
       ↓
[Task 114.6] 异常场景测试   ← 需要 Story 51.3 完成
```

## 前置条件检查

在开始Task 114.4之前，必须确认以下Story已完成：

| Story | 名称 | 验证方式 |
|-------|------|----------|
| Story 51.1 | 主Agent协调器 - 核心协调模块 | AgentOrchestrator类存在 |
| Story 51.2 | 主Agent协调器 - 流式事件总线集成 | StreamingProvider存在 |
| Story 51.3 | 工具执行管道 - 完整执行链 | ToolExecutor存在 |

## 测试要点

### 单元测试

- MockLLMProvider响应渲染
- MockTool执行逻辑
- 检查点序列化/反序列化

### 集成测试

- MockLLM + AgentOrchestrator
- MockTools + ToolExecutor
- 流式事件 + 前端展示

### E2E测试

- 完整用户旅程测试
- 多场景组合测试
- 异常路径测试

### 性能测试

- 单用例执行时间 < 5秒
- 并发执行无资源泄漏

## 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| Mock响应不存在 | 使用默认响应或抛出明确错误 |
| 工具调用超时 | 触发重试机制 |
| 会话不存在 | 创建新会话或报错 |
| 流式中断 | 保存检查点，支持恢复 |

## 里程碑

| 里程碑 | 描述 | 完成标准 |
|--------|------|----------|
| M1: Mock基础设施 | MockLLMProvider和MockTools完成 | 单元测试通过率 100% |
| M2: 核心E2E测试 | 完整对话流程测试完成 | 5个核心场景测试通过 |
| M3: 完整测试套件 | 所有测试用例完成 | 测试覆盖率 > 70% |
