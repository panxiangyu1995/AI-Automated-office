# Specification: 测试覆盖率提升

## 需求来源

### PRD 需求
- 无具体FR需求（本Story为代码质量优化）

### NFR约束
- NFR22: 可维护性要求

---

## 测试框架规格

### Vitest配置

```typescript
// vitest.config.ts
{
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    }
  }
}
```

---

## 单元测试规格

### 组件测试规格

| 组件 | 测试用例数 | 覆盖场景 |
|------|-----------|---------|
| Button | 5+ | 渲染、点击、禁用、加载状态、变体 |
| Input | 4+ | 渲染、输入、清空、禁用 |
| MessageList | 6+ | 渲染、虚拟化、空状态、滚动 |
| ToolCall | 5+ | 渲染、状态、错误、结果展示 |

### Hook测试规格

| Hook | 测试用例数 | 覆盖场景 |
|------|-----------|---------|
| useChat | 4+ | 发送消息、状态管理、清空、错误处理 |
| useAgent | 4+ | 初始化、消息处理、状态变更 |
| useLocalStorage | 3+ | 读取、写入、删除、错误处理 |

---

## 集成测试规格

### Agent Orchestrator测试

| 测试场景 | 输入 | 预期输出 |
|---------|------|---------|
| 正常消息处理 | 用户消息 | 包含response的ProcessResult |
| 工具调用 | 触发工具的消息 | toolCalls数组非空 |
| 错误处理 | 无效输入 | 正确的错误状态 |

### Sub-Agent路由测试

| 测试场景 | 输入 | 预期输出 |
|---------|------|---------|
| 关键词匹配 | 销售相关消息 | 路由到sales-agent |
| 嵌套调用 | 多任务消息 | nestedCalls数组 |
| 无匹配 | 未知消息 | default-agent |

---

## E2E测试规格

### Chat功能E2E

```typescript
// 测试场景规格
const chatE2ETests = [
  {
    name: '发送消息并接收回复',
    steps: [
      '打开应用',
      '输入消息: Hello',
      '点击发送',
      '等待回复出现'
    ],
    expected: '回复内容可见'
  },
  {
    name: '显示思考指示器',
    steps: [
      '发送复杂问题',
      '立即检查UI'
    ],
    expected: '思考中指示器可见'
  }
];
```

---

## 验收场景 (Given-When-Then格式)

### Scenario 1: 单元测试运行
**GIVEN** 开发者在本地编写代码
**WHEN** 执行 `npm run test:unit`
**THEN** 所有单元测试运行，覆盖率报告生成

### Scenario 2: 集成测试运行
**GIVEN** Agent模块代码变更
**WHEN** 执行 `npm run test:integration`
**THEN** Agent相关集成测试运行，验证功能正常

### Scenario 3: E2E测试运行
**GIVEN** 代码提交到PR
**WHEN** CI运行E2E测试
**THEN** Playwright浏览器测试运行，截图和报告生成

### Scenario 4: 覆盖率检查
**GIVEN** 测试运行完成
**WHEN** 查看coverage/index.html
**THEN** 可视化覆盖率报告显示各模块覆盖率

### Scenario 5: 覆盖率阈值检查
**GIVEN** 代码覆盖率低于阈值
**WHEN** 测试运行时
**THEN** Vitest报错，覆盖率不达标

---

## 边界条件

### 边界条件 1: 测试环境缺失依赖
- **场景**: jsdom环境缺少某些DOM API
- **处理**: 在setup.ts中添加polyfill

### 边界条件 2: 异步测试超时
- **场景**: Agent处理时间过长
- **处理**: 使用vi.useFakeTimers()模拟时间

### 边界条件 3: E2E测试元素不存在
- **场景**: UI变更导致选择器失效
- **处理**: 使用更稳定的数据-testid

### 边界条件 4: 并发测试冲突
- **场景**: 多个测试修改同一状态
- **处理**: 每个测试使用独立的store实例

---

## 错误处理

### 测试失败错误码

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| TEST-001 | 组件渲染失败 | 检查组件代码和测试环境 |
| TEST-002 | 异步操作超时 | 增加timeout或检查逻辑 |
| TEST-003 | 覆盖率不达标 | 补充测试用例 |
| TEST-004 | E2E元素未找到 | 更新选择器 |

---

## 测试最佳实践

### 1. 组件测试原则
- 测试行为，不测试实现
- 使用语义化选择器 (getByRole, getByLabelText)
- 避免测试内部状态

### 2. Hook测试原则
- 隔离依赖 (使用Mock Provider)
- 测试状态变更
- 测试边界条件

### 3. 集成测试原则
- 最小化外部依赖 (使用Mock)
- 测试关键路径
- 保持测试独立性

### 4. E2E测试原则
- 关键用户流程优先
- 使用稳定的测试环境
- 避免强依赖外部服务
