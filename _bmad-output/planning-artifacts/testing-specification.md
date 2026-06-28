# 测试规范铁律 - Testing Specification

## 概述

本文档定义 AI-Automated-office 项目的测试策略、分层测试规范和最佳实践。所有测试代码必须遵循本规范，确保测试的有效性和可维护性。

**文档定位：** 第5份铁律文档，与 PRD、架构、UX、Epic 并列

---

## 核心原则

### 1. 分层测试策略

```
┌─────────────────────────────────────────────────────────────────┐
│                        测试金字塔                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ▲                                                           │
│    ╱ ╲        E2E 测试 (端到端)                                 │
│   ╱   ╲       - 数量：少 (覆盖核心用户旅程)                      │
│  ╱─────╲      - 速度：慢 (真实浏览器 + 真实后端 + 真实数据库)    │
│ ╱         ╲   - 价值：验证完整业务流程                           │
│╱───────────╲    - 原则：模拟真实使用场景                          │
│                                                                 │
│   ┌─────┐                                                       │
│  ╱       ╲     集成测试                                         │
│ ╱─────────╲    - 数量：中 (覆盖模块间交互)                       │
│╱───────────╲   - 速度：中 (组件 + 部分 Mock)                     │
│                - 价值：验证模块协作                              │
│                                                                 │
│ ┌───────────┐                                                   │
│ ├───────────┤   单元测试                                        │
│ ├───────────┤   - 数量：多 (覆盖所有业务逻辑)                    │
│ ├───────────┤   - 速度：快 (纯函数，完全 Mock)                   │
│ └───────────┘   - 价值：验证代码正确性                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. E2E 测试核心理念：模拟真实使用场景

**E2E 测试的本质是尽可能模拟真实使用场景，而非模拟测试代码。**

| 维度 | 真实使用场景 | 测试实现 |
|------|------------|---------|
| **环境** | 用户打开浏览器，访问部署好的系统 | 启动真实后端服务 + 前端，浏览器访问 |
| **认证** | 用户输入用户名密码登录 | 调用真实 `/api/v1/auth/login` 接口 |
| **数据** | 用户操作真实数据库中的数据 | 测试数据库中有真实数据 |
| **API** | 前端调用真实后端 API | 不 Mock 自有 API |
| **外部依赖** | 第三方服务（支付/地图等）| 可 Mock 第三方服务 |

### 3. Mock 使用原则

**黄金法则：Mock at the boundary, test your stack end-to-end.**

| 场景 | 是否 Mock | 说明 |
|------|----------|------|
| **自有 REST/GraphQL API** | ❌ 永不 | E2E 测试必须走真实 API |
| **自有数据库** | ❌ 永不 | 通过 API 或 fixtures 准备数据 |
| **认证系统** | ⚠️ 有限 | 使用 `storageState` 跳过登录，而非 mock 登录响应 |
| **第三方服务** | ✅ 总是 | 支付、邮件、OAuth、地图等 |
| **LLM API** | ✅ 总是 | 使用 mock provider 或录制响应 |
| **Analytics** | ✅ 总是 | Segment、Mixpanel 等可阻断 |
| **CDN/静态资源** | ❌ 永不 | 正常加载 |

---

## E2E 真实后端测试架构

### 架构图

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         E2E 测试执行环境                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐         ┌──────────────────┐                         │
│   │   PostgreSQL     │◄────────│   Go Cloud       │                         │
│   │   (测试数据库)   │         │   Server         │                         │
│   │   :54320         │         │   :8080          │                         │
│   └──────────────────┘         └────────┬─────────┘                         │
│                                          │                                     │
│                                          │ REST/WebSocket                      │
│                                          ▼                                     │
│   ┌──────────────────┐         ┌──────────────────┐                         │
│   │   Redis          │◄────────│   React Frontend  │                         │
│   │   (缓存/会话)    │         │   (Vite)         │                         │
│   │   :6379          │         │   :1420          │                         │
│   └──────────────────┘         └────────┬─────────┘                         │
│                                          │                                     │
│                                          │ CDP                                 │
│                                          ▼                                     │
│   ┌──────────────────┐         ┌──────────────────┐                         │
│   │   agent-browser  │◄────────│   Test Runner    │                         │
│   │   (自动化浏览器)  │         │   (Playwright)    │                         │
│   │   :9222          │         │                   │                         │
│   └──────────────────┘         └──────────────────┘                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 测试环境组件

| 组件 | 用途 | 端口 |
|------|------|------|
| **Go Cloud Server** | 后端 REST API + WebSocket | :8080 |
| **PostgreSQL** | 主数据库（测试实例）| :54320 |
| **Redis** | 缓存 + 会话存储 | :6379 |
| **React Frontend** | Vite 开发服务器 | :1420 |
| **agent-browser** | 浏览器自动化（CDP 控制）| :9222 |

---

## E2E 测试工作流

### 标准测试循环

```
┌─────────────────────────────────────────────────────────────────┐
│                    E2E 测试执行循环                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐                                              │
│  │  1. 启动环境  │  docker-compose -f docker-compose.test.yml up │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │  2. 执行测试  │  agent-browser / playwright open → snapshot   │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐     ┌──────────────────┐                    │
│  │  3. 发现问题？ │────►│  4. 分析根因     │                    │
│  └───────┬───────┘     │  - 截图留证       │                    │
│          │             │  - 日志分析       │                    │
│          ▼             │  - 代码审查       │                    │
│     ┌────┴────┐       └────────┬─────────┘                    │
│     │  YES    │                │                               │
│     └────┬────┘                │                               │
│          │                     ▼                               │
│          │         ┌──────────────────────┐                   │
│          └────────►│  5. 修复代码          │                   │
│                    └──────────┬───────────┘                   │
│                               │                               │
│                               ▼                               │
│                    ┌──────────────────────┐                   │
│                    │  6. 重新测试          │                   │
│                    │  (返回步骤 2)        │                   │
│                    └──────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### agent-browser 工作流（AI 驱动测试）

**适用场景：** AI Agent 驱动的测试循环，模拟真实用户与 AI 交互

```bash
# 步骤 1：启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 步骤 2：等待服务就绪
./scripts/test/wait-for-services.sh

# 步骤 3：使用 agent-browser 执行测试
agent-browser open http://localhost:1420

# 步骤 4：获取页面元素引用
agent-browser snapshot -i
# 输出: @e1 [input], @e2 [input], @e3 [button] "登录"

# 步骤 5：执行登录
agent-browser fill @e1 "admin"
agent-browser fill @e2 "Admin@123456"
agent-browser click @e3
agent-browser wait --load networkidle

# 步骤 6：验证结果
agent-browser snapshot -i
agent-browser screenshot

# 步骤 7：如果失败，截图并记录问题
agent-browser screenshot failure-login.png

# 步骤 8：修复代码后重新测试
# ... 修复代码 ...
agent-browser open http://localhost:1420
agent-browser snapshot -i
# 继续测试...
```

### Playwright 工作流（CI/CD 集成测试）

**适用场景：** 自动化 CI/CD 流程，批量执行测试用例

```typescript
// tests/e2e/smoke/agent-panel.spec.ts
import { test, expect } from '@playwright/test'
import { login, logout } from '../../helpers/auth'

test.describe('AI Agent 面板测试', () => {
  test.beforeEach(async ({ page }) => {
    // 使用真实登录（不 mock）
    await login(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('应显示 AI 对话面板', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible()
  })

  test('应能发送消息并获得回复', async ({ page }) => {
    await page.goto('/')
    
    // 找到输入框并发送消息
    const input = page.getByTestId('chat-input')
    await input.fill('你好')
    await page.getByRole('button', { name: '发送' }).click()
    
    // 等待 AI 回复（真实 API 调用）
    await expect(page.getByText('你好').first()).toBeVisible()
    await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 30000 })
  })
})
```

---

## 测试分层规范

### 1. E2E 测试 (`tests/e2e/`)

**目标：** 验证完整的用户业务流程，模拟真实使用场景

**目录结构：**
```
tests/e2e/
├── smoke/              # 冒烟测试 - 核心功能快速验证
├── accessibility/      # 可访问性测试
├── resilience/         # 韧性测试 - 异常处理、恢复
├── admin/              # 管理功能测试
└── agent/              # AI Agent 功能测试
```

**规范：**

1. **必须使用真实 API（禁止 Mock 自有 API）**
   ```typescript
   // ❌ 错误：Mock 自有 API
   await page.route('**/api/v1/admin/users*', async (route) => {
     await route.fulfill({ ... })
   })
   
   // ✅ 正确：使用真实 API（后端必须已启动）
   await page.goto('/admin/users')
   await expect(page.getByRole('table')).toBeVisible()
   ```

2. **使用真实登录（storageState 或直接 API 调用）**
   ```typescript
   // ✅ 正确：调用真实登录 API
   const response = await page.request.post('/api/v1/auth/login', {
     data: { username: 'admin', password: 'Admin@123456' }
   })
   const { accessToken, refreshToken } = await response.json()
   await page.evaluate((token) => {
     localStorage.setItem('accessToken', token)
   }, accessToken)
   
   // ❌ 错误：直接设置 localStorage（绕过登录流程）
   await page.evaluate(() => {
     localStorage.setItem('accessToken', 'mock-token')
   })
   ```

3. **只 Mock 第三方服务**
   ```typescript
   // ✅ 正确：Mock 支付网关（第三方）
   await page.route('**/stripe.com/**', (route) => {
     route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
   })
   
   // ✅ 正确：Mock LLM API（外部依赖）
   await page.route('**/api.openai.com/**', (route) => {
     route.fulfill({ status: 200, body: JSON.stringify({ /* mock response */ }) })
   })
   ```

4. **Tauri 环境检测与处理**
   ```typescript
   test.describe('Tauri 环境测试', () => {
     test('应在 Tauri 环境中正确运行', async ({ page }) => {
       const isTauri = await page.evaluate(() =>
         typeof (window as any).__TAURI__ !== 'undefined'
       )
       
       if (!isTauri) {
         // 非 Tauri 环境：跳过需要后端的功能
         test.skip('Requires Tauri runtime')
       }
       
       // Tauri 环境测试...
     })
   })
   ```

### 2. 集成测试 (`tests/integration/`)

**目标：** 验证组件间协作和模块集成

**目录结构：**
```
tests/integration/
├── auth/               # 认证集成
├── communication/      # 通信层集成
├── dialogs/            # 对话框集成
└── *.test.tsx         # 组件集成测试
```

**规范：**

1. **使用 Testing Library**
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react'
   import userEvent from '@testing-library/user-event'
   ```

2. **Mock 外部依赖**
   ```typescript
   // ✅ 正确：Mock API 客户端
   vi.mock('@/lib/api', () => ({
     apiClient: {
       get: vi.fn(),
       post: vi.fn(),
     }
   }))
   ```

3. **测试用户交互**
   ```typescript
   it('should submit form on button click', async () => {
     render(<LoginForm />)
     await userEvent.type(screen.getByLabelText('用户名'), 'admin')
     await userEvent.type(screen.getByLabelText('密码'), 'password')
     await userEvent.click(screen.getByRole('button', { name: '登录' }))
     expect(screen.getByText('登录成功')).toBeInTheDocument()
   })
   ```

### 3. 单元测试 (`tests/unit/`)

**目标：** 验证独立函数和类的正确性

**目录结构：**
```
tests/unit/
├── features/           # 功能模块测试
│   ├── session/        # Session 相关
│   ├── streaming/      # 流式处理
│   └── message/        # 消息模型
├── scripts/            # 脚本工具测试
└── smoke/              # 基础功能冒烟测试
```

**规范：**

1. **纯函数优先测试**
   ```typescript
   describe('knowledgeRetrieval', () => {
     it('should filter items by min score', () => {
       const items = [
         { id: '1', score: 0.9 },
         { id: '2', score: 0.5 },
       ]
       const result = filterByMinScore(items, 0.8)
       expect(result).toHaveLength(1)
       expect(result[0].id).toBe('1')
     })
   })
   ```

2. **Mock 所有外部依赖**
   ```typescript
   // 完全隔离被测单元
   vi.mock('./dependencies', () => ({
     externalFunction: vi.fn().mockReturnValue('mocked')
   }))
   ```

### 4. 契约测试 (`tests/contracts/`)

**目标：** 验证 API 契约和数据格式

**规范：**
```typescript
describe('User API Contract', () => {
  it('should match OpenAPI spec', async () => {
    const response = await fetch('/api/v1/users/1')
    const data = await response.json()
    
    // 验证符合契约
    expect(data).toMatchObject({
      id: expect.any(String),
      username: expect.any(String),
      email: expect.any(String),
    })
  })
})
```

### 5. 性能测试 (`tests/performance/`)

**目标：** 验证性能预算

**规范：**
```typescript
describe('Startup Performance', () => {
  it('should load within budget', async () => {
    const start = performance.now()
    await page.goto('/')
    const loadTime = performance.now() - start
    
    expect(loadTime).toBeLessThan(3000) // 3s budget
  })
})
```

---

## 测试数据管理

### 1. Fixtures (`tests/fixtures/`)

**用途：** 定义测试数据和辅助函数

```typescript
// tests/fixtures/test-data.ts
export const testUsers = {
  admin: {
    id: 'test-admin-001',
    username: 'admin',
    password: 'Admin@123456',
    real_name: '系统管理员',
    email: 'admin@test.local',
  },
  // ...
}

export const apiEndpoints = {
  login: '/api/v1/auth/login',
  users: '/api/v1/admin/users',
  // ...
}
```

### 2. Helpers (`tests/helpers/`)

**用途：** 测试辅助函数

```typescript
// tests/helpers/auth.ts
export async function login(page: Page, user: TestUser): Promise<void> {
  // 走真实登录流程（不 mock）
  const response = await page.request.post('/api/v1/auth/login', {
    data: { username: user.username, password: user.password }
  })
  
  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`)
  }
  
  const { accessToken, refreshToken } = await response.json()
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    },
    { accessToken, refreshToken }
  )
}

export async function logout(page: Page): Promise<void> {
  // 调用真实登出 API
  await page.request.post('/api/v1/auth/logout')
  await page.evaluate(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('auth-storage')
  })
}
```

---

## Playwright 配置规范

### playwright.config.ts（E2E 真实后端模式）

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  
  // 并行执行
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  
  // 重试策略
  retries: process.env.CI ? 2 : 0,
  
  use: {
    // 连接本地前端（Vite）
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 忽略 HTTPS 错误（本地开发）
    ignoreHTTPSErrors: true,
    
    // 视频录制（失败时保留）
    videoMode: 'retain-on-failure',
  },
  
  projects: [
    // Setup project - 执行真实登录并保存状态
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Smoke tests
    {
      name: 'smoke',
      dependencies: ['setup'],
      testMatch: /smoke\/.*\.spec\.ts/,
    },
    // Accessibility tests
    {
      name: 'accessibility',
      dependencies: ['setup'],
      testMatch: /accessibility\/.*\.spec\.ts/,
    },
    // Resilience tests
    {
      name: 'resilience',
      dependencies: ['setup'],
      testMatch: /resilience\/.*\.spec\.ts/,
      retries: 1,
    },
    // Agent tests
    {
      name: 'agent',
      dependencies: ['setup'],
      testMatch: /agent\/.*\.spec\.ts/,
    },
  ],
  
  // 不再自动启动 webServer（由 docker-compose 管理）
  // webServer 配置保留，仅用于纯前端测试
  webServer: process.env.E2E_BACKEND_URL ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
  ],
})
```

### docker-compose.test.yml（E2E 测试环境）

```yaml
version: "3.8"

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: ai-office-test-postgres
    environment:
      POSTGRES_DB: ai_office_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "54320:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
      - ./scripts/test/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: ai-office-test-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Go 后端服务
  api:
    build:
      context: ./cloud-server
      dockerfile: Dockerfile
    container_name: ai-office-test-api
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_PASSWORD=postgres
      - DB_NAME=ai_office_test
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PORT=8080
      - MODE=development
      - JWT_SECRET=test-secret-key-for-e2e
      - BYPASS_AUTH=false
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/api/v1/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 前端 Vite 开发服务器
  frontend:
    image: node:20-alpine
    container_name: ai-office-test-frontend
    working_dir: /app
    command: sh -c "npm install && npm run dev"
    environment:
      - VITE_API_URL=http://localhost:8080
      - VITE_WS_URL=ws://localhost:8080
    ports:
      - "1420:1420"
    volumes:
      - ./:/app
      - /app/node_modules
    depends_on:
      api:
        condition: service_healthy

volumes:
  postgres_test_data:

networks:
  default:
    name: ai-office-test-network
```

---

## E2E 测试执行流程

### 完整测试循环（本地开发）

```bash
#!/bin/bash
# scripts/test/e2e-full-loop.sh

set -e

echo "=== E2E 测试完整循环 ==="

# 1. 清理旧环境
echo "[1/6] 清理旧环境..."
docker-compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true

# 2. 启动测试环境
echo "[2/6] 启动测试环境..."
docker-compose -f docker-compose.test.yml up -d

# 3. 等待服务就绪
echo "[3/6] 等待服务就绪..."
./scripts/test/wait-for-services.sh

# 4. 执行 Playwright 测试
echo "[4/6] 执行 Playwright 测试..."
pnpm test:e2e

# 5. 检查测试结果
if [ $? -eq 0 ]; then
    echo "[5/6] 测试通过 ✓"
else
    echo "[5/6] 测试失败 ✗"
    
    # 6. 截图和分析
    echo "[6/6] 保存测试证据..."
    agent-browser screenshot tests/e2e-failure-$(date +%Y%m%d-%H%M%S).png
    
    echo ""
    echo "=== 测试失败 - 请修复代码后重新运行 ==="
    exit 1
fi

# 7. 清理环境
echo "[6/6] 清理测试环境..."
docker-compose -f docker-compose.test.yml down -v

echo "=== 测试完成 ==="
```

### agent-browser 单步测试循环

```bash
#!/bin/bash
# scripts/test/agent-browser-loop.sh

# 启动环境
docker-compose -f docker-compose.test.yml up -d
./scripts/test/wait-for-services.sh

# 打开浏览器
agent-browser open http://localhost:1420

# 等待用户交互...
echo "agent-browser 已启动，请在浏览器中执行测试"
echo "测试完成后按 Enter 清理环境..."

read

# 清理
agent-browser close
docker-compose -f docker-compose.test.yml down -v
```

### wait-for-services.sh

```bash
#!/bin/bash
# scripts/test/wait-for-services.sh

set -e

MAX_WAIT=120
ELAPSED=0
INTERVAL=2

echo "等待服务就绪..."

# 等待 PostgreSQL
echo "  - PostgreSQL (:54320)..."
while ! pg_isready -h localhost -p 54320 -U postgres > /dev/null 2>&1; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "  PostgreSQL 启动超时"
        exit 1
    fi
done

# 等待 Redis
echo "  - Redis (:6379)..."
while ! redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "  Redis 启动超时"
        exit 1
    fi
done

# 等待 API
echo "  - API Server (:8080)..."
while ! curl -sf http://localhost:8080/api/v1/health > /dev/null 2>&1; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "  API Server 启动超时"
        exit 1
    fi
done

# 等待 Frontend
echo "  - Frontend (:1420)..."
while ! curl -sf http://localhost:1420 > /dev/null 2>&1; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "  Frontend 启动超时"
        exit 1
    fi
done

echo "所有服务已就绪 ✓"
```

---

## 测试编写最佳实践

### 1. 测试命名规范

```typescript
// ✅ 正确：描述行为
it('should display error message when login fails', () => {})
it('should redirect to home after successful login', () => {})

// ❌ 错误：描述实现
test('login function test', () => {})
test('handleClick works', () => {})
```

### 2. 使用语义化选择器

```typescript
// ✅ 正确：使用 role 和 accessible name
await page.getByRole('button', { name: '提交' }).click()
await page.getByLabelText('用户名').fill('admin')
await page.getByTestId('user-menu').click()

// ❌ 错误：使用 CSS 选择器
await page.locator('.btn-primary').click()
await page.locator('#username-input').fill('admin')
```

### 3. 避免硬编码等待

```typescript
// ✅ 正确：使用自动等待
await expect(page.getByText('加载完成')).toBeVisible()

// ❌ 错误：硬编码等待
await page.waitForTimeout(2000)
```

### 4. 测试隔离

```typescript
test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前清理状态
    await logout(page)
    await login(page, testUsers.admin)
  })
  
  test.afterEach(async ({ page }) => {
    // 每个测试后清理
    await logout(page)
  })
})
```

### 5. 数据驱动测试

```typescript
const testCases = [
  { input: 'admin', expected: true },
  { input: '', expected: false },
  { input: 'a'.repeat(51), expected: false },
]

testCases.forEach(({ input, expected }) => {
  test(`validates username "${input}"`, async () => {
    const result = validateUsername(input)
    expect(result.isValid).toBe(expected)
  })
})
```

---

## 反模式清单

### ❌ 禁止以下做法：

1. **E2E 测试中 Mock 自有 API**
   ```typescript
   // 禁止！这测试的是 mock，不是真实功能
   await page.route('**/api/v1/**', (route) => route.fulfill({...}))
   ```

2. **测试间共享状态**
   ```typescript
   // 禁止！每个测试必须独立
   let sharedUser = null
   test('create user', () => { sharedUser = createUser() })
   test('delete user', () => { deleteUser(sharedUser.id) }) // 依赖上一个测试
   ```

3. **绕过登录流程**
   ```typescript
   // 禁止！直接设置 localStorage 绕过了真实的认证流程
   await page.evaluate(() => {
     localStorage.setItem('accessToken', 'mock-token')
   })
   
   // ✅ 正确：调用真实登录 API
   const response = await page.request.post('/api/v1/auth/login', {
     data: { username: 'admin', password: 'Admin@123456' }
   })
   ```

4. **过度使用 snapshot 测试**
   ```typescript
   // 避免：容易误报，难以维护
   expect(component).toMatchSnapshot()
   ```

5. **测试实现细节**
   ```typescript
   // 禁止：测试应该关注行为，不是实现
   expect(component.state.isOpen).toBe(true) // 测试内部状态
   ```

6. **忽略异步处理**
   ```typescript
   // 禁止：必须等待异步操作
   fetchData() // 不等待
   expect(data).toBeDefined() // 可能还没加载完成
   ```

---

## CI/CD 集成

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: E2E Test

on: [push, pull_request]

jobs:
  e2e-test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 54320:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build frontend
        run: pnpm build

      - name: Run DB migrations
        run: pnpm db:migrate:test

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        env:
          E2E_BACKEND_URL: http://localhost:8080
        run: pnpm test:e2e

      - name: Upload Playwright Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

      - name: Upload Test Screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-screenshots
          path: tests/e2e/**/*.png
```

---

## 测试覆盖率要求

| 层级 | 覆盖率目标 | 说明 |
|------|-----------|------|
| 单元测试 | ≥ 80% | 核心业务逻辑必须覆盖 |
| 集成测试 | ≥ 60% | 关键模块交互必须覆盖 |
| E2E 测试 | 核心流程 100% | 所有用户旅程必须覆盖 |

---

## 验收标准

### 新增功能必须包含：

- [ ] 单元测试覆盖核心业务逻辑
- [ ] 集成测试覆盖模块间交互（如适用）
- [ ] E2E 测试覆盖关键用户旅程（如适用）
- [ ] E2E 测试必须连接真实后端（不 Mock 自有 API）
- [ ] 所有测试通过 `npm run test`
- [ ] 无 lint 错误
- [ ] 构建成功

### 修复 Bug 必须包含：

- [ ] 复现 Bug 的测试用例
- [ ] 修复后测试通过
- [ ] 回归测试确保未破坏其他功能

---

## 相关文档

- [agent-browser Skill](../.agents/skills/agent-browser/SKILL.md)
- [Playwright Best Practices](../.agents/skills/playwright-best-practices/SKILL.md)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

---

## VSCode式工作台测试策略

### 概述

AI-Automated-office 采用类 VSCode Workbench 的四栏布局作为产品核心 UX。本章节定义针对这一核心架构的测试策略。

**设计背景参考：**
- 固定壳层：TopBar + ActivityBar + Sidebar + Workbench + AI Chat Panel + StatusBar
- 混合 UI：外壳固定，内容区动态
- 动态 UI：业务主体按需渲染

### 固定壳层组件测试

#### 1. TopBar 测试

| 测试场景 | 测试方法 | 验证点 |
|---------|---------|--------|
| 菜单渲染 | E2E | 所有菜单项（File/Edit/View/Agent/Plugins/Tools/Help）正确显示 |
| 快捷键绑定 | E2E | Ctrl+Shift+M 切换菜单栏显示/隐藏 |
| 布局控制按钮 | E2E | 4个按钮（自定义布局/左侧栏/面板/辅助侧栏）功能正常 |
| 菜单项点击 | E2E | 各菜单下拉项可点击且触发正确动作 |

**E2E 示例：**
```typescript
test('TopBar menu items should be visible and clickable', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('menuitem', { name: 'File' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'File' }).click()
  await expect(page.getByRole('menuitem', { name: 'New' })).toBeVisible()
})
```

#### 2. ActivityBar 测试

| 测试场景 | 测试方法 | 验证点 |
|---------|---------|--------|
| 图标渲染 | E2E | 所有部门/功能图标正确显示 |
| 选中状态 | E2E | 选中项有正确的视觉高亮 |
| 切换功能 | E2E | 点击图标切换到对应模块 |
| 悬浮提示 | E2E | hover 显示功能名称 tooltip |

**E2E 示例：**
```typescript
test('ActivityBar icons should toggle views correctly', async ({ page }) => {
  await page.goto('/')
  // 销售模块
  await page.getByRole('button', { name: 'sales' }).click()
  await expect(page.locator('[data-testid="sales-container"]')).toBeVisible()
  // 切换到人事
  await page.getByRole('button', { name: 'hr' }).click()
  await expect(page.locator('[data-testid="hr-container"]')).toBeVisible()
})
```

#### 3. Sidebar 测试

| 测试场景 | 测试方法 | 验证点 |
|---------|---------|--------|
| 折叠/展开 | E2E | 可通过 Ctrl+B 切换显示状态 |
| 二级导航 | E2E | 点击父级展开子项 |
| 视图切换 | E2E | 不同模块的 Sidebar 内容正确切换 |
| 状态持久化 | E2E | 刷新后保持折叠/展开状态 |

#### 4. AI Chat Panel 测试

| 测试场景 | 测试方法 | 验证点 |
|---------|---------|--------|
| 面板显示/隐藏 | E2E | Ctrl+Shift+I 切换 AI 面板 |
| 对话输入 | E2E | 可输入文本并发送 |
| 消息渲染 | E2E | 用户消息和 AI 回复正确显示 |
| 工具调用展示 | E2E | 工具调用过程可见、可解释 |
| 关键事实摘要 | E2E | 记住的关键事实正确展示 |

**E2E 示例：**
```typescript
test('AI Chat Panel should toggle and function correctly', async ({ page }) => {
  // 隐藏状态
  await page.keyboard.press('Control+Shift+I')
  await expect(page.getByTestId('ai-chat-panel')).toBeHidden()
  // 显示状态
  await page.keyboard.press('Control+Shift+I')
  await expect(page.getByTestId('ai-chat-panel')).toBeVisible()
  // 发送消息（真实 API 调用）
  await page.getByTestId('chat-input').fill('帮我生成报价单')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.getByText('帮我生成报价单')).toBeVisible()
  // 等待 AI 回复
  await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 30000 })
})
```

#### 5. Workbench 测试

| 测试场景 | 测试方法 | 验证点 |
|---------|---------|--------|
| 业务容器加载 | E2E | 切换模块时正确加载对应容器页 |
| 混合 UI 渲染 | E2E | 固定壳层稳定，内容区动态加载 |
| 多标签支持 | E2E | 可打开多个标签页且状态独立 |
| 布局状态恢复 | E2E | 重启后恢复上次工作区状态 |

#### 6. StatusBar 测试

| 测试场景 | 测试方法 | 验证点 |
|---------|---------|--------|
| 同步状态 | E2E | 显示当前同步状态（已同步/同步中/离线）|
| 上下文状态 | E2E | 显示当前部门、当前任务 |
| 草稿状态 | E2E | 显示草稿是否已保存 |
| 诊断入口 | E2E | 点击可打开诊断面板 |

### 分层 UI 边界测试

#### 固定 UI / 混合 UI / 动态 UI 边界验证

| 测试场景 | 测试方法 | 验证点 |
|---------|---------|--------|
| 治理页固定性 | E2E | 权限/租户/审计等页面不能动态化 |
| 业务差异位置 | E2E | 部门差异只发生在内容区，不影响壳层 |
| 动态内容边界 | E2E | 动态内容被限制在正确边界内 |

**测试策略：**
```typescript
test('governance pages must remain fixed UI', async ({ page }) => {
  const governancePages = [
    '/admin/users',
    '/admin/roles',
    '/admin/permissions',
    '/admin/audit',
    '/settings/model',
    '/settings/plugins'
  ]
  for (const path of governancePages) {
    await page.goto(path)
    // 验证：壳层结构稳定，不受内容动态加载影响
    await expect(page.getByTestId('top-bar')).toBeVisible()
    await expect(page.getByTestId('activity-bar')).toBeVisible()
    await expect(page.getByTestId('sidebar')).toBeVisible()
    await expect(page.getByTestId('status-bar')).toBeVisible()
  }
})
```

### Command Palette 测试

| 测试场景 | 测试方法 | 验证点 |
|---------|---------|--------|
| 唤起方式 | E2E | Ctrl+Shift+P 唤起命令面板 |
| 搜索功能 | E2E | 输入可过滤命令列表 |
| 命令执行 | E2E | 选择命令后正确执行 |
| 跨模块导航 | E2E | 可通过命令快速跳转到任意页面 |

**E2E 示例：**
```typescript
test('Command Palette should provide cross-module navigation', async ({ page }) => {
  await page.keyboard.press('Control+Shift+P')
  await expect(page.getByTestId('command-palette')).toBeVisible()
  await page.getByTestId('command-input').fill('settings')
  await expect(page.getByRole('option', { name: /settings/i })).toHaveCount.greaterThan(0)
  await page.getByRole('option', { name: /model settings/i }).click()
  await expect(page).toHaveURL(/.*\/settings\/model/)
})
```

### Tauri 环境测试要求

```typescript
// 固定壳层组件测试必须考虑 Tauri 环境
test.describe('Workbench Components in Tauri', () => {
  test.beforeEach(async ({ page }) => {
    const isTauri = await page.evaluate(() =>
      typeof (window as any).__TAURI__ !== 'undefined'
    )
    if (!isTauri) {
      test.skip('Requires Tauri runtime for workbench tests')
    }
  })

  test('should preserve layout state across restarts', async ({ page }) => {
    // 设置布局状态
    await page.getByTestId('toggle-sidebar').click()
    // 重启应用（模拟）
    await page.reload()
    // 验证状态恢复
    await expect(page.getByTestId('sidebar')).toBeHidden()
  })
})
```

---

## E2E 测试真实后端执行规范

### 环境启动优先级

1. **PostgreSQL** - 必须首先启动，提供数据存储
2. **Redis** - 提供缓存和会话存储
3. **Go Cloud Server** - API 服务，依赖 DB 和缓存
4. **React Frontend** - 前端服务，依赖 API

### 健康检查端点

```bash
# 检查所有服务健康状态
curl http://localhost:8080/api/v1/health   # Go API
curl http://localhost:1420                  # Frontend

# 检查数据库
pg_isready -h localhost -p 54320 -U postgres

# 检查 Redis
redis-cli -h localhost -p 6379 ping
```

### 测试数据初始化

```sql
-- scripts/test/init-db.sql
-- E2E 测试数据库初始化脚本

-- 创建测试用户
INSERT INTO users (id, username, password_hash, real_name, email, status, created_at)
VALUES 
  ('test-admin-001', 'admin', '$2a$10$...', '系统管理员', 'admin@test.local', 'active', NOW()),
  ('test-employee-001', 'employee', '$2a$10$...', '普通员工', 'employee@test.local', 'active', NOW());

-- 创建测试部门
INSERT INTO departments (id, name, code, parent_id, level, created_at)
VALUES 
  ('test-dept-root', '测试公司', 'ROOT', NULL, 1, NOW()),
  ('test-dept-hr', '人力资源部', 'HR', 'test-dept-root', 2, NOW()),
  ('test-dept-finance', '财务部', 'FINANCE', 'test-dept-root', 2, NOW());

-- 创建测试角色
INSERT INTO roles (id, name, code, layer, is_builtin, created_at)
VALUES 
  ('test-role-admin', '系统管理员', 'ADMIN', 'base', true, NOW()),
  ('test-role-employee', '普通员工', 'EMPLOYEE', 'base', true, NOW());

-- 分配角色给用户
INSERT INTO user_roles (user_id, role_id)
VALUES 
  ('test-admin-001', 'test-role-admin'),
  ('test-employee-001', 'test-role-employee');
```

### 调试和故障排查

```bash
# 查看容器日志
docker-compose -f docker-compose.test.yml logs api
docker-compose -f docker-compose.test.yml logs postgres
docker-compose -f docker-compose.test.yml logs frontend

# 进入容器调试
docker exec -it ai-office-test-api sh
docker exec -it ai-office-test-postgres psql -U postgres -d ai_office_test

# 检查网络连接
docker-compose -f docker-compose.test.yml exec api ping postgres
docker-compose -f docker-compose.test.yml exec api ping redis

# 重启单个服务
docker-compose -f docker-compose.test.yml restart api
```

---

**约束力：**
- ❌ 不得违背分层测试策略
- ❌ E2E 测试不得 Mock 自有 API
- ❌ 不得提交失败的测试
- ✅ E2E 测试必须连接真实后端环境
- ✅ 新功能必须包含对应测试
- ✅ 测试代码遵循与业务代码相同的质量标准
