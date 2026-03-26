# Design: 端到端测试框架与核心测试用例

## 技术方案

### 实现类型和优先级

| 属性 | 值 |
|------|-----|
| **类型** | new (全新开发) |
| **优先级** | medium |
| **阶段** | Phase 1 - Agent Runtime端到端集成 |
| **后端必需** | true |
| **铁律合规** | PRD: FR400/FR410/FR411, NFR: NFR1/NFR22, ARCH: ADR-001 |

### 前端实现方案

#### 技术选型

- **测试框架**: Vitest (与Vite项目集成良好)
- **Mock库**: jest-mock / Vitest原生Mock
- **E2E测试**: Playwright (已在项目中使用)
- **断言库**: Chai / Vitest内置断言

#### 目录结构

```
tests/
├── e2e/
│   ├── agent/
│   │   ├── mock-llm-provider.test.ts
│   │   ├── mock-tools.test.ts
│   │   ├── full-flow.test.ts
│   │   ├── streaming.test.ts
│   │   └── error-recovery.test.ts
│   └── fixtures/
│       ├── mock-responses/
│       └── test-data/
├── unit/
│   └── agent/
│       └── routing.test.ts
└── integration/
    └── agent-runtime.test.ts
```

#### 核心模块设计

**MockLLMProvider**

```typescript
// src/tests/mocks/MockLLMProvider.ts

interface MockResponse {
  id: string;
  template: string;
  variables?: Record<string, string>;
  delay?: number; // ms
  error?: {
    code: string;
    message: string;
  };
}

interface MockLLMConfig {
  responses: Map<string, MockResponse>;
  errorRate: number; // 0-1
  defaultDelay: number;
}

class MockLLMProvider implements LLMProvider {
  private config: MockLLMConfig;
  private responseIndex: Map<string, number>;

  constructor(config: MockLLMConfig) {
    this.config = config;
    this.responseIndex = new Map();
  }

  async complete(prompt: string, context: Context): Promise<LLMResponse> {
    const key = this.hashPrompt(prompt);
    const response = this.getNextResponse(key);

    if (response.error) {
      throw new LLMError(response.error.code, response.error.message);
    }

    await this.delay(response.delay || this.config.defaultDelay);
    return this.renderResponse(response, context);
  }

  async stream(prompt: string, context: Context): Promise<AsyncIterable<string>> {
    // 流式响应模拟
  }
}
```

**MockToolFactory**

```typescript
// src/tests/mocks/MockToolFactory.ts

interface MockToolConfig {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: jest.Mock;
  shouldFail?: boolean;
  delay?: number;
}

class MockToolFactory {
  static create(config: MockToolConfig): MockTool {
    return {
      name: config.name,
      description: config.description,
      parameters: config.parameters,
      async execute(params: any, context: ToolContext): Promise<ToolResult> {
        if (config.shouldFail) {
          throw new ToolExecutionError(config.name, 'Mock failure');
        }
        await delay(config.delay || 0);
        return config.execute(params, context);
      }
    };
  }

  static createFileMock(): MockTool { /* ... */ }
  static createHttpMock(): MockTool { /* ... */ }
  static createDbMock(): MockTool { /* ... */ }
}
```

### 后端实现方案 (Rust)

#### Cargo依赖

```toml
# src-tauri/Cargo.toml

[dev-dependencies]
mockall = "0.12"
tokio-test = "0.4"
wiremock = "0.6"
tempfile = "3"
```

#### 模块结构

```
src-tauri/src/agent/
├── test/
│   ├── mod.rs
│   ├── mock_llm.rs        # MockLLMProvider Rust实现
│   ├── mock_tools.rs       # Mock工具集
│   ├── fixtures.rs         # 测试夹具
│   └── helpers.rs          # 测试辅助函数
```

**MockLLMProvider Rust实现**

```rust
// src-tauri/src/agent/test/mock_llm.rs

use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct MockResponse {
    pub id: String,
    pub content: String,
    pub finish_reason: String,
}

pub struct MockLLMProvider {
    responses: Arc<Mutex<Vec<MockResponse>>>,
    current_index: usize,
    delay_ms: u64,
    should_fail: bool,
}

#[async_trait]
impl LLMProvider for MockLLMProvider {
    async fn complete(&self, prompt: &str) -> Result<LLMResponse, LLMError> {
        if self.should_fail {
            return Err(LLMError::new("mock_error", "Simulated error"));
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(self.delay_ms)).await;

        let mut responses = self.responses.lock().await;
        if responses.is_empty() {
            return Err(LLMError::new("no_response", "No mock responses available"));
        }

        let response = responses.get(self.current_index % responses.len()).unwrap();
        self.current_index += 1;

        Ok(LLMResponse {
            id: response.id.clone(),
            content: response.content.clone(),
            finish_reason: response.finish_reason.clone(),
        })
    }

    async fn stream(&self, prompt: &str) -> Result<StreamingResponse, LLMError> {
        // 流式响应实现
    }
}
```

### API设计

#### 内部测试API

```typescript
// 测试框架内部API

interface TestFixtures {
  mockLLM: MockLLMProvider;
  mockTools: MockTool[];
  sessionManager: TestSessionManager;
}

interface E2ETestScenario {
  name: string;
  steps: TestStep[];
  expectedResults: ExpectedResult[];
  cleanup: () => Promise<void>;
}

interface TestStep {
  type: 'user_input' | 'tool_call' | 'llm_response' | 'checkpoint';
  data: any;
  delay?: number;
}
```

#### Tauri测试命令

```rust
// src-tauri/src/commands/test.rs

#[tauri::command]
async fn run_agent_e2e_test(
    scenario: E2ETestScenario,
) -> Result<TestResult, String> {
    // 执行端到端测试场景
}

#[tauri::command]
async fn create_mock_session(
    mock_llm_config: MockLLMConfig,
    mock_tools_config: Vec<MockToolConfig>,
) -> Result<String, String> {
    // 创建测试用会话
}
```

### 数据库设计

测试框架使用内存存储，不持久化数据：

```typescript
// 测试数据库配置
const testDbConfig = {
  type: 'sqlite' as const,
  inMemory: true,
  synchronize: true,
};
```

## 组件设计

### 新增组件

| 组件 | 类型 | 职责 |
|------|------|------|
| MockLLMProvider | 类 | LLM响应模拟 |
| MockToolFactory | 工厂类 | 创建Mock工具 |
| TestSessionManager | 类 | 测试会话管理 |
| E2ETestRunner | 类 | 测试执行器 |
| StreamSimulator | 类 | 流式输出模拟 |

### 修改组件

| 组件 | 修改内容 |
|------|----------|
| ToolRegistry | 添加Mock工具注册接口 |
| SessionManager | 添加测试模式切换 |

## 状态管理

测试状态使用独立Store，不影响生产代码：

```typescript
// src/stores/testStore.ts

interface TestState {
  isRunning: boolean;
  currentScenario: string | null;
  results: TestResult[];
  mocks: {
    llm: MockLLMProvider | null;
    tools: MockTool[];
  };
}

// 使用独立的Zustand store
export const useTestStore = create<TestState>((set, get) => ({
  isRunning: false,
  currentScenario: null,
  results: [],
  mocks: { llm: null, tools: [] },
}));
```

## 安全考虑

- **ADR-018合规**: Mock工具不执行真实危险操作
- **数据隔离**: 测试数据使用临时存储，不接触生产数据
- **权限Mock**: 测试模式下跳过敏感权限检查
- **日志脱敏**: 测试日志自动脱敏敏感信息

## 性能考虑

- **NFR1/NFR16**: 测试执行时间应小于5秒/用例
- **并行执行**: 支持用例间并行（使用独立Mock实例）
- **资源清理**: 每个测试用例后自动清理资源
- **延迟控制**: Mock延迟可配置，支持快速模式
