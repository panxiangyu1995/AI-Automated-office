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
│  ╱─────╲      - 速度：慢 (真实浏览器 + 真实/模拟后端)             │
│ ╱         ╲   - 价值：验证完整业务流程                           │
│╱───────────╲                                                    │
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

### 2. Mock 使用原则

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

## 测试分层规范

### 1. E2E 测试 (`tests/e2e/`)

**目标：** 验证完整的用户业务流程

**目录结构：**
```
tests/e2e/
├── smoke/              # 冒烟测试 - 核心功能快速验证
├── accessibility/      # 可访问性测试
├── resilience/         # 韧性测试 - 异常处理、恢复
└── admin/              # 管理功能测试
```

**规范：**

1. **必须使用真实 API**
   ```typescript
   // ❌ 错误：Mock 自有 API
   await page.route('**/api/v1/admin/users*', async (route) => {
     await route.fulfill({ ... })
   })
   
   // ✅ 正确：使用真实 API
   await page.goto('/admin/users')
   await expect(page.getByRole('table')).toBeVisible()
   ```

2. **认证使用 storageState**
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     use: {
       storageState: 'tests/fixtures/auth-state.json',
     },
   })
   
   // 或使用 setup project
   projects: [
     { name: 'setup', testMatch: '**/*.setup.ts' },
     { 
       name: 'e2e', 
       dependencies: ['setup'],
       use: { storageState: 'playwright/.auth/user.json' }
     }
   ]
   ```

3. **只 Mock 第三方服务**
   ```typescript
   // ✅ 正确：Mock 支付网关
   await page.route('**/stripe.com/**', (route) => {
     route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
   })
   ```

4. **Tauri 环境处理**
   ```typescript
   // 检测 Tauri 环境，非 Tauri 环境跳过需要后端的功能
   const isTauri = await page.evaluate(() => typeof (window as any).__TAURI__ !== 'undefined')
   if (!isTauri) {
     test.skip('Requires Tauri runtime')
   }
   ```

### 2. 集成测试 (`tests/integration/`)

**目标：** 验证组件间协作和模块集成

**目录结构：**
```
tests/integration/
├── auth/               # 认证集成
├── communication/      # 通信层集成
├── dialogs/            # 对话框集成
└── *.test.tsx          # 组件集成测试
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
  // 走真实登录流程
  await page.goto('/login')
  await page.fill('[name=username]', user.username)
  await page.fill('[name=password]', user.password)
  await page.click('button[type=submit]')
  await page.waitForURL('/')
}

export async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}
```

---

## Playwright 配置规范

### playwright.config.ts

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
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 使用已保存的认证状态
    storageState: 'tests/fixtures/auth-state.json',
  },
  
  projects: [
    // Setup project - 执行登录并保存状态
    {
      name: 'setup',
      testMatch: '**/*.setup.ts',
    },
    // Smoke tests
    {
      name: 'smoke',
      dependencies: ['setup'],
      testMatch: /smoke\/.*\.spec\.ts/,
      use: { storageState: 'playwright/.auth/user.json' },
    },
    // Accessibility tests
    {
      name: 'accessibility',
      dependencies: ['setup'],
      testMatch: /accessibility\/.*\.spec\.ts/,
      use: { storageState: 'playwright/.auth/user.json' },
    },
    // Resilience tests
    {
      name: 'resilience',
      dependencies: ['setup'],
      testMatch: /resilience\/.*\.spec\.ts/,
      retries: 1,
    },
  ],
  
  // 开发服务器
  webServer: {
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
    await clearAuthState(page)
    await login(page, testUsers.admin)
  })
  
  test.afterEach(async ({ page }) => {
    // 每个测试后清理
    await clearAuthState(page)
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

3. **过度使用 snapshot 测试**
   ```typescript
   // 避免：容易误报，难以维护
   expect(component).toMatchSnapshot()
   ```

4. **测试实现细节**
   ```typescript
   // 禁止：测试应该关注行为，不是实现
   expect(component.state.isOpen).toBe(true) // 测试内部状态
   ```

5. **忽略异步处理**
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
name: Test

on: [push, pull_request]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Run unit tests
        run: pnpm test:unit

  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Run integration tests
        run: pnpm test:integration

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      - name: Run E2E tests
        run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
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
- [ ] 所有测试通过 `npm run test`
- [ ] 无 lint 错误
- [ ] 构建成功

### 修复 Bug 必须包含：

- [ ] 复现 Bug 的测试用例
- [ ] 修复后测试通过
- [ ] 回归测试确保未破坏其他功能

---

## 相关文档

- [Playwright Best Practices](.trae/skills/playwright-best-practices/)
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
  // 发送消息
  await page.getByTestId('chat-input').fill('帮我生成报价单')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.getByText('帮我生成报价单')).toBeVisible()
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
| 同步状态 | E2E | 显示当前同步状态（已同步/同步中/离线） |
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

**约束力：**
- ❌ 不得违背分层测试策略
- ❌ E2E 测试不得 Mock 自有 API
- ❌ 不得提交失败的测试
- ✅ 新功能必须包含对应测试
- ✅ 测试代码遵循与业务代码相同的质量标准
