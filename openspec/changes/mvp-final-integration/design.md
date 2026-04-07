# Design: MVP最终集成测试

## 测试策略

### 1. 分层测试架构

```
┌─────────────────────────────────────────────┐
│           E2E 测试 (Playwright)            │
│  完整用户流程、跨模块交互、真实 API         │
├─────────────────────────────────────────────┤
│          集成测试 (Testing Library)          │
│  模块间交互、API 集成、数据流               │
├─────────────────────────────────────────────┤
│             单元测试 (Vitest)               │
│  纯函数、工具函数、边缘情况                 │
└─────────────────────────────────────────────┘
```

### 2. 核心集成测试场景

#### 2.1 部门模块集成

| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| HR 员��创建 | Agent对话"创建员工张三" | 调用 HR API 创建员工 |
| 销售报价 | Agent对话"为客户A报价" | 生成报价单 |
| 财务报销 | 上传发票图片 | OCR识别并创建报销 |
| 审批提交流 | 提交审批请求 | 流程正确执行 |

#### 2.2 Agent-SubAgent 委派

| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| 意图识别 | 发送财务相关消息 | 识别并委派到 Finance SubAgent |
| 结果返回 | SubAgent 执行完成 | 结果返回主 Agent |
| 权限验证 | SubAgent 尝试越权 | 拒绝操作 |

#### 2.3 权限系统

| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| 部门隔离 | 租户A无法访问租户B数据 | 完全隔离 |
| 角色权限 | 普通用户无法访问管理功能 | 权限拒绝 |

### 3. E2E 测试用例

```typescript
// tests/e2e/mvp-integration.spec.ts

describe('MVP 完整集成测试', () => {
  describe('部门模块', () => {
    it('HR - 创建员工流程', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="activity-hr"]');
      await page.fill('[data-testid="employee-name"]', '张三');
      await page.click('[data-testid="submit-employee"]');
      await expect(page.locator('[data-testid="employee-list"]')).toContainText('张三');
    });
  });

  describe('Agent 对话', () => {
    it('发送消息并获得回复', async ({ page }) => {
      await page.goto('/');
      await page.fill('[data-testid="chat-input"]', '你好');
      await page.click('[data-testid="send-button"]');
      await expect(page.locator('[data-testid="chat-messages"]')).toContainText('你好');
    });
  });
});
```

### 4. 性能测试指标

| 指标 | 目标值 | 测试方法 |
|------|--------|----------|
| 页面加载时间 | < 2s | Lighthouse |
| Agent 响应时间 | < 5s | 计时测量 |
| API 响应时间 | < 500ms | API 测试 |
| 并发用户 | ≥ 10 | 负载测试 |

## 测试数据管理

### Fixture 结构

```typescript
// tests/fixtures/
export const testFixtures = {
  tenants: [
    { id: 'tenant-1', name: '测试租户A' },
    { id: 'tenant-2', name: '测试租户B' },
  ],
  users: [
    { id: 'user-1', tenantId: 'tenant-1', role: 'admin' },
    { id: 'user-2', tenantId: 'tenant-1', role: 'user' },
  ],
  employees: [
    { id: 'emp-1', name: '张三', department: 'HR' },
  ],
};
```

## 测试执行计划

### Phase 1: 单元测试 (1-2天)
- 运行现有单元测试
- 补充缺失测试
- 覆盖率 ≥ 80%

### Phase 2: 集成测试 (2-3天)
- 部门模块 API 测试
- Agent 集成测试
- 权限系统测试

### Phase 3: E2E 测试 (2-3天)
- 核心用户旅程测试
- Playwright 测试套件
- 通过率 ≥ 95%

### Phase 4: 性能测试 (1天)
- Lighthouse 审计
- 响应时间测量
- 优化和验证
