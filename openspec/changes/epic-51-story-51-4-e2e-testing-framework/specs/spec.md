# Specification: 端到端测试框架与核心测试用例

## 需求来源

### PRD 需求

| 需求ID | 描述 | 覆盖方式 |
|--------|------|----------|
| FR400 | Agent核心能力 - 会话管理 | 测试框架覆盖 |
| FR410 | Agent工具系统 - 工具注册与执行 | Mock工具测试 |
| FR411 | Agent工具系统 - 工具权限管理 | 权限Mock测试 |

### NFR 非功能需求

| 需求ID | 描述 | 覆盖方式 |
|--------|------|----------|
| NFR1 | 响应性 - 单次响应 < 2秒 | 性能测试 |
| NFR22 | 可测试性 - 完整测试覆盖 | 覆盖率报告 |

### 架构约束

| ADR ID | 描述 | 覆盖方式 |
|--------|------|----------|
| ADR-001 | Agent微内核架构 | E2E测试验证架构 |

### UX 规范

- 无直接UX要求（本Story为测试基础设施）

## 功能规格

### 用户故事

```
As an Agent Runtime developer,
I want to 创建端到端测试框架，包含模拟LLM响应、完整对话流程测试、工具调用验证,
So that I can 确保Agent功能的正确性和稳定性.
```

## 输入输出规格

### MockLLMProvider

#### 输入

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| prompt | string | 是 | 非空, maxLength: 10000 | 用户输入 |
| context | Context | 是 | 有效Context对象 | 执行上下文 |
| config | MockLLMConfig | 否 | 可选 | 配置选项 |

#### 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 响应ID |
| content | string | 响应内容 |
| finish_reason | string | 完成原因 |
| usage | Usage | Token使用量 |

### MockTool

#### 输入

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| name | string | 是 | 非空, 匹配: `^[a-z_]+$` | 工具名称 |
| parameters | object | 是 | 符合Schema | 工具参数 |
| context | ToolContext | 是 | 有效Context | 执行上下文 |

#### 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 是否成功 |
| result | any | 执行结果 |
| error | ToolError | 错误信息(如有) |
| duration_ms | number | 执行耗时 |

### E2ETestScenario

#### 输入

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| name | string | 是 | 非空, maxLength: 100 | 测试场景名称 |
| steps | TestStep[] | 是 | minLength: 1 | 测试步骤 |
| config | TestConfig | 否 | 可选 | 测试配置 |
| timeout | number | 否 | default: 30000 | 超时时间(ms) |

#### 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| passed | boolean | 是否通过 |
| results | StepResult[] | 每步结果 |
| duration_ms | number | 总耗时 |
| error | TestError | 错误信息(如有) |

## 验收场景

### 场景1: MockLLMProvider基本响应

```
Feature: MockLLMProvider基本响应

  Scenario: MockLLM返回预设响应
    Given MockLLM配置了响应模板:
      """
      {
        "id": "resp_001",
        "content": "我会帮你处理这个任务",
        "finish_reason": "stop"
      }
      """
    And 用户输入 "帮我处理文件"
    When 调用 mockLLM.complete(prompt, context)
    Then 返回响应:
      | field | value |
      | id | resp_001 |
      | content | 我会帮你处理这个任务 |
      | finish_reason | stop |
```

### 场景2: MockLLM错误注入

```
Feature: MockLLM错误注入

  Scenario: 按配置比例注入错误
    Given MockLLM配置 errorRate: 0.3
    When 连续调用 complete 10次
    Then 约3次返回错误响应
    And 错误码为 "mock_injected_error"
```

### 场景3: MockTool执行

```
Feature: MockTool执行

  Scenario: MockTool正常执行
    Given MockTool "file_read" 配置:
      | field | value |
      | name | file_read |
      | execute | 返回 "file content" |
    And 参数 { "path": "/test.txt" }
    When 调用 file_read.execute(params, context)
    Then 返回:
      | field | value |
      | success | true |
      | result | file content |
```

### 场景4: MockTool权限预检查

```
Feature: MockTool权限预检查

  Scenario: 权限不足时拒绝执行
    Given MockTool "sensitive_data" 需要权限 "admin"
    And 用户权限为 "user"
    When 调用 sensitive_data.execute(params, context)
    Then 返回:
      | field | value |
      | success | false |
      | error.code | PERMISSION_DENIED |
```

### 场景5: 完整对话流程

```
Feature: 完整对话流程

  Scenario: 用户输入 → 意图解析 → 计划生成 → 工具调用
    Given MockLLM配置响应序列:
      | step | content |
      | 1 | 请稍候，我来分析你的需求 |
      | 2 | 我将执行以下步骤: 1. 读取文件 2. 处理数据 |
      | 3 | 任务完成 |
    And MockTool "file_read" 配置为返回 "test content"
    And MockTool "data_process" 配置为返回 { "processed": true }
    When 用户输入 "读取/test.txt并处理数据"
    Then 执行流程:
      | step | action | expected |
      | 1 | 接收用户输入 | 触发意图解析 |
      | 2 | MockLLM返回分析 | 调用工具计划 |
      | 3 | 执行file_read | 返回文件内容 |
      | 4 | 执行data_process | 返回处理结果 |
      | 5 | MockLLM汇总结果 | 返回最终响应 |
```

### 场景6: 流式输出

```
Feature: 流式输出

  Scenario: SSE流式响应
    Given MockLLM配置流式响应:
      """
      ["第", "一", "个", "词", "第", "二", "个", "词"]
      """
    When 调用 mockLLM.stream(prompt, context)
    Then 收到8个流式事件:
      | index | content |
      | 0 | 第 |
      | 1 | 一 |
      | 2 | 个 |
      | 3 | 词 |
      | 4 | 第 |
      | 5 | 二 |
      | 6 | 个 |
      | 7 | 词 |
```

### 场景7: 中断恢复

```
Feature: 中断恢复

  Scenario: 执行中断后从检查点恢复
    Given 对话流程执行到步骤3(工具执行中)
    And 已保存检查点 "checkpoint_step3"
    When 触发中断信号
    And 调用 checkpoint.restore("checkpoint_step3")
    Then 系统恢复到步骤3状态
    And 继续执行剩余步骤
```

### 场景8: 重试机制

```
Feature: 重试机制

  Scenario: 工具调用失败后自动重试
    Given MockTool "unreliable_api" 配置:
      | field | value |
      | failCount | 2 |
      | successOnRetry | true |
    When 调用 unreliable_api.execute(params)
    Then 重试3次(1次失败 + 2次重试)
    And 最终返回成功结果
```

## 边界条件

### 输入边界

| 条件 | 预期行为 |
|------|----------|
| prompt为空 | 返回验证错误 INVALID_INPUT |
| prompt超长 (>10000字符) | 返回验证错误 PROMPT_TOO_LONG |
| context无效 | 返回验证错误 INVALID_CONTEXT |
| parameters不符合Schema | 返回验证错误 INVALID_PARAMETERS |

### 状态边界

| 条件 | 预期行为 |
|------|----------|
| MockLLM响应序列耗尽 | 返回默认响应或错误 NO_MOCK_RESPONSE |
| 检查点不存在 | 返回错误 CHECKPOINT_NOT_FOUND |
| 检查点过期 (>30分钟) | 返回错误 CHECKPOINT_EXPIRED |

### 并发边界

| 条件 | 预期行为 |
|------|----------|
| 同一工具并发调用 | 独立执行，无竞态条件 |
| 并发检查点保存 | 序列化保存，保证一致性 |
| 并发会话创建 | 独立SessionId，无冲突 |

## 错误码定义

### MockLLM错误码

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| MOCK_LLM_001 | No mock responses configured | 使用默认响应或抛出异常 |
| MOCK_LLM_002 | Response template not found | 使用默认响应 |
| MOCK_LLM_003 | Injected error triggered | 记录日志，返回模拟错误响应 |
| MOCK_LLM_004 | Invalid prompt format | 验证失败，拒绝处理 |

### MockTool错误码

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| MOCK_TOOL_001 | Tool not found | 返回错误，建议检查注册表 |
| MOCK_TOOL_002 | Permission denied | 返回错误，提示权限不足 |
| MOCK_TOOL_003 | Execution timeout | 触发重试或返回超时错误 |
| MOCK_TOOL_004 | Invalid parameters | 验证失败，返回参数错误 |
| MOCK_TOOL_005 | Tool execution failed | 触发重试或返回失败错误 |

### TestRunner错误码

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| TEST_001 | Scenario not found | 验证失败 |
| TEST_002 | Test timeout | 中断执行，记录超时 |
| TEST_003 | Checkpoint not found | 报错，提示检查点ID |
| TEST_004 | Checkpoint expired | 报错，提示过期时间 |
| TEST_005 | Cleanup failed | 记录日志，继续执行 |

## 数据类型定义

### MockLLMConfig

```typescript
interface MockLLMConfig {
  responses: MockResponse[];
  errorRate: number; // 0-1
  defaultDelay: number; // ms
  streamingMode: 'sync' | 'async';
}
```

### MockResponse

```typescript
interface MockResponse {
  id: string;
  template: string;
  variables?: Record<string, string>;
  delay?: number;
  error?: {
    code: string;
    message: string;
  };
}
```

### ToolContext

```typescript
interface ToolContext {
  sessionId: string;
  userId: string;
  permissions: string[];
  metadata?: Record<string, any>;
}
```

### TestConfig

```typescript
interface TestConfig {
  mockLLM?: MockLLMConfig;
  mockTools?: MockToolConfig[];
  enableCheckpoints?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
}
```

## 验收标准检查清单

### AC1: MockLLMProvider

- [ ] 实现LLMProvider接口
- [ ] 支持预设响应模板
- [ ] 支持错误注入
- [ ] 支持延迟控制
- [ ] 支持流式响应
- [ ] 单元测试通过

### AC2: Mock工具集

- [ ] MockTool基类实现
- [ ] FileMockTool实现
- [ ] HttpMockTool实现
- [ ] DbMockTool实现
- [ ] 工具调用拦截器
- [ ] 单元测试通过

### AC3: 端到端测试

- [ ] 用户输入 → 意图解析测试
- [ ] 计划生成测试
- [ ] 工具调用测试
- [ ] 多轮对话测试
- [ ] 并发测试
- [ ] 测试通过率 100%

### AC4: 流式测试

- [ ] SSE事件测试
- [ ] 思考过程测试
- [ ] 状态流测试
- [ ] 中断恢复测试

### AC5: 异常测试

- [ ] 中断处理测试
- [ ] 重试机制测试
- [ ] 检查点保存测试
- [ ] 检查点恢复测试
