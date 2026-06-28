# E2E 测试指南

## 概述

本目录包含 AI-Automated-office 的端到端（E2E）测试，使用真实后端环境进行测试。

## 目录结构

```
tests/
├── e2e/                    # 端到端测试
│   ├── smoke/             # 冒烟测试
│   ├── accessibility/     # 可访问性测试
│   ├── resilience/        # 韧性测试
│   ├── admin/             # 管理功能测试
│   └── agent/             # AI Agent 功能测试
├── fixtures/              # 测试数据
├── helpers/               # 测试辅助函数
└── README.md             # 本文档
```

## 快速开始

### 1. 启动测试环境

```bash
# 方式一：使用完整循环脚本（启动 -> 测试 -> 清理）
./scripts/test/e2e-full-loop.sh

# 方式二：分步执行
docker-compose -f docker-compose.test.yml up -d
./scripts/test/wait-for-services.sh
```

### 2. 执行测试

```bash
# 执行所有 E2E 测试
pnpm test:e2e

# 执行特定测试
pnpm test:e2e --grep "登录"

# 使用 headed 模式（可视化）
pnpm test:e2e --project=smoke --headed
```

### 3. 使用 agent-browser 进行交互式测试

```bash
# 启动交互式测试
./scripts/test/agent-browser-test.sh --start
```

## 测试原则

### 真实后端测试

E2E 测试使用真实的后端服务（Go Cloud Server + PostgreSQL + Redis），不 Mock 自有 API。

```
┌─────────────────────────────────────────┐
│           E2E 测试架构                   │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────┐    ┌─────────────┐   │
│   │  Playwright │───►│   Browser   │   │
│   │  (测试)     │    │   (CDP)     │   │
│   └──────┬──────┘    └─────────────┘   │
│          │                              │
│          │ HTTP                         │
│          ▼                              │
│   ┌─────────────┐    ┌─────────────┐   │
│   │   React     │───►│  Go Server  │   │
│   │   Frontend  │    │  (:8080)    │   │
│   │  (:1420)    │    └──────┬──────┘   │
│   └─────────────┘           │          │
│                              │          │
│                              ▼          │
│                    ┌─────────────┐    │
│                    │  PostgreSQL │    │
│                    │  (:54320)   │    │
│                    └─────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### 认证方式

#### 方式一：真实登录（推荐）

```typescript
import { loginViaApi } from '../../helpers/auth'

test('登录测试', async ({ page }) => {
  const result = await loginViaApi(page, 'admin', 'Admin@123456')
  expect(result.success).toBe(true)
})
```

#### 方式二：UI 自动化登录

```typescript
import { login } from '../../helpers/auth'

test('UI 登录测试', async ({ page }) => {
  await login(page, 'admin', 'Admin@123456')
  await expect(page).not.toHaveURL(/\/login/)
})
```

## 常见任务

### 创建新的 E2E 测试

```typescript
// tests/e2e/smoke/my-feature.spec.ts
import { test, expect } from '@playwright/test'
import { loginViaApi, logout } from '../../helpers/auth'
import { testUsers } from '../../fixtures/test-data'

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前登录
    await loginViaApi(page, testUsers.admin.username, testUsers.admin.password)
  })

  test.afterEach(async ({ page }) => {
    // 每个测试后登出
    await logout(page)
  })

  test('should do something', async ({ page }) => {
    await page.goto('/my-feature')
    // 测试逻辑...
  })
})
```

### 调试测试

```bash
# 打开 Playwright Trace Viewer
pnpm playwright show-trace playwright-report/trace.zip

# 使用 headed 模式
pnpm test:e2e --headed

# 截图
agent-browser screenshot debug.png
```

### 运行特定测试集

```bash
# 只运行冒烟测试
pnpm test:e2e --project=smoke

# 只运行管理功能测试
pnpm test:e2e --project=admin

# 运行包含特定关键词的测试
pnpm test:e2e --grep "登录"
```

## 故障排查

### 服务启动失败

```bash
# 查看日志
docker-compose -f docker-compose.test.yml logs api
docker-compose -f docker-compose.test.yml logs postgres

# 重启服务
docker-compose -f docker-compose.test.yml restart
```

### 测试失败

```bash
# 查看测试报告
open playwright-report/index.html

# 查看截图
ls tests/e2e/screenshots/
```

### 数据库问题

```bash
# 重置数据库
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `E2E_BACKEND_URL` | 后端 API 地址 | `http://localhost:8080` |
| `E2E_FRONTEND_URL` | 前端地址 | `http://localhost:1420` |
| `CI` | 是否在 CI 环境中 | `false` |

## 相关文档

- [测试规范铁律](../_bmad-output/planning-artifacts/testing-specification.md)
- [agent-browser Skill](../.agents/skills/agent-browser/SKILL.md)
- [Playwright Best Practices](../.agents/skills/playwright-best-practices/SKILL.md)
