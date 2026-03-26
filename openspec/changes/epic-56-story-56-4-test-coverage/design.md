# Design: 测试覆盖率提升

## 技术方案

### 实现类型
- **类型**: polish (优化完善)
- **优先级**: low
- **阶段**: 技术债务与优化
- **是否需要后端**: 否（纯前端测试）

### 技术选型

| 类别 | 工具 | 选择理由 |
|------|------|----------|
| 测试运行器 | Vitest | 兼容Jest API，更快 |
| 组件测试 | @testing-library/react | 最佳实践，用户视角 |
| DOM断言 | @testing-library/jest-dom | 语义化断言 |
| E2E测试 | Playwright | 现代、跨浏览器支持 |
| 覆盖率 | V8/C8 | 内置Vitest支持 |

### Vitest配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 测试目录结构

```
tests/
├── setup.ts                 # 测试环境配置
├── unit/                   # 单元测试
│   ├── components/         # 组件测试
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   └── MessageList.test.tsx
│   ├── hooks/              # Hook测试
│   │   └── useChat.test.ts
│   └── lib/                # 工具函数测试
│       └── utils.test.ts
├── integration/            # 集成测试
│   ├── agent/              # Agent集成测试
│   │   ├── orchestrator.test.ts
│   │   └── session.test.ts
│   └── tools/              # 工具测试
│       └── toolRegistry.test.ts
└── e2e/                   # 端到端测试
    ├── chat.spec.ts
    ├── agent.spec.ts
    └── tools.spec.ts
```

### 单元测试示例

#### 1. Button组件测试

```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

#### 2. useChat Hook测试

```typescript
// tests/unit/hooks/useChat.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useChat } from '@/features/agent/hooks/useChat';
import { MockAgentProvider } from '../mocks/MockAgentProvider';

describe('useChat', () => {
  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
  });

  it('sends message and receives response', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages.length).toBeGreaterThan(0);
    expect(result.current.status).toBe('idle');
  });

  it('clears messages', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });
});
```

### 集成测试示例

#### 1. Agent Orchestrator测试

```typescript
// tests/integration/agent/orchestrator.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentOrchestrator } from '@/features/agent/orchestrator/AgentOrchestrator';
import { MockLLMProvider } from '../mocks/MockLLMProvider';
import { MockToolRegistry } from '../mocks/MockToolRegistry';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator({
      llmProvider: new MockLLMProvider(),
      toolRegistry: new MockToolRegistry()
    });
  });

  it('processes user message and returns response', async () => {
    const result = await orchestrator.processMessage({
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now()
    });

    expect(result.response).toBeDefined();
    expect(result.status).toBe('completed');
  });

  it('handles tool calls in message', async () => {
    const result = await orchestrator.processMessage({
      id: '1',
      role: 'user',
      content: 'Use calculator to add 1+2',
      timestamp: Date.now()
    });

    expect(result.toolCalls.length).toBeGreaterThan(0);
  });
});
```

#### 2. Sub-Agent调用链测试

```typescript
// tests/integration/agent/subagent_chain.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubAgentRouter } from '@/features/agent/subagent/SubAgentRouter';

describe('SubAgent Router', () => {
  it('routes to correct sub-agent based on keywords', async () => {
    const router = new SubAgentRouter();

    const result = await router.route('帮我查一下销售数据');
    expect(result.subAgentId).toBe('sales-agent');
  });

  it('handles nested sub-agent calls', async () => {
    const router = new SubAgentRouter();

    const result = await router.route('先查销售数据，再生成报表');
    expect(result.nestedCalls.length).toBeGreaterThan(0);
    expect(result.nestedCalls[0].subAgentId).toBe('sales-agent');
    expect(result.nestedCalls[1].subAgentId).toBe('report-agent');
  });
});
```

### E2E测试示例

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat functionality', () => {
  test('sends message and receives response', async ({ page }) => {
    await page.goto('/');

    // Type message
    await page.getByPlaceholder('输入消息...').fill('Hello');
    await page.getByRole('button', { name: '发送' }).click();

    // Wait for response
    await expect(page.getByText('你好')).toBeVisible({ timeout: 10000 });
  });

  test('shows typing indicator while waiting', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('输入消息...').fill('Hello');
    await page.getByRole('button', { name: '发送' }).click();

    // Should show typing indicator
    await expect(page.getByText('思考中...')).toBeVisible();
  });
});
```

### CI配置

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
```

### 覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| components/ui | ~30% | 70% |
| features/agent | ~20% | 60% |
| features/session | ~40% | 70% |
| hooks | ~50% | 70% |
| lib/utils | ~60% | 80% |
| **总体** | ~35% | **70%** |
