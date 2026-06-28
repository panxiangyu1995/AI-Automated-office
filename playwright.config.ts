import { defineConfig } from '@playwright/test'

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
    baseURL: process.env.E2E_FRONTEND_URL || 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 忽略 HTTPS 错误（本地开发）
    ignoreHTTPSErrors: true,

    // 视频录制（失败时保留）
    videoMode: 'retain-on-failure',

    // 截图模式
    screenshotMode: 'only-on-failure',

    // 导航超时
    navigationTimeout: 30000,
  },

  projects: [
    // Setup project - 执行真实登录并保存状态
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Smoke tests - 冒烟测试
    {
      name: 'smoke',
      dependencies: ['setup'],
      testMatch: /smoke\/.*\.spec\.ts/,
    },
    // Accessibility tests - 可访问性测试
    {
      name: 'accessibility',
      dependencies: ['setup'],
      testMatch: /accessibility\/.*\.spec\.ts/,
    },
    // Resilience tests - 韧性测试
    {
      name: 'resilience',
      dependencies: ['setup'],
      testMatch: /resilience\/.*\.spec\.ts/,
      retries: 1,
    },
    // Agent tests - AI Agent 功能测试
    {
      name: 'agent',
      dependencies: ['setup'],
      testMatch: /agent\/.*\.spec\.ts/,
    },
    // Admin tests - 管理功能测试
    {
      name: 'admin',
      dependencies: ['setup'],
      testMatch: /admin\/.*\.spec\.ts/,
    },
  ],

  // webServer 配置说明：
  // - 当 E2E_BACKEND_URL 环境变量存在时，假设后端由外部管理（docker-compose）
  // - 此时不自动启动前端，由外部 docker-compose 统一管理
  // - 纯前端测试时可移除 E2E_BACKEND_URL，使用此配置启动前端
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
