# Tasks: 测试覆盖率提升

## 任务列表

### Task 139: 测试覆盖率提升

| 属性 | 值 |
|------|-----|
| **描述** | 提升代码库的测试覆盖率，特别是UI组件测试和集成测试 |
| **Epic** | Epic 56 - 技术债务与优化 |
| **Story** | Story 56.4 |
| **implementationType** | polish |
| **优先级** | low |
| **阶段** | 技术债务与优化 |
| **是否需要后端** | 否 |
| **依赖** | Story 51.4 (端到端测试框架) |

### 验收标准

- [ ] Vitest测试框架配置完成
- [ ] 覆盖率报告生成正常
- [ ] UI组件单元测试覆盖Button、Input、MessageList等
- [ ] Agent Runtime集成测试套件创建
- [ ] Sub-Agent调用链测试创建
- [ ] Playwright E2E测试配置完成
- [ ] 总体测试覆盖率达到70%

---

## 详细任务步骤

### Step 1: 配置Vitest测试框架
**预估时间**: 2小时
- 安装vitest和相关依赖
- 创建vitest.config.ts
- 创建tests/setup.ts

**验收标准**:
- [ ] vitest安装成功
- [ ] 测试运行正常
- [ ] 配置文件正确

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

### Step 2: 配置覆盖率报告
**预估时间**: 1小时
- 配置coverage provider
- 配置覆盖率阈值
- 验证覆盖率报告生成

**验收标准**:
- [ ] coverage配置完成
- [ ] 可生成HTML覆盖率报告
- [ ] 阈值配置合理

### Step 3: 编写UI组件单元测试
**预估时间**: 4小时
- Button组件测试
- Input组件测试
- MessageList组件测试
- 其他核心组件测试

**验收标准**:
- [ ] Button组件测试完整
- [ ] Input组件测试完整
- [ ] MessageList组件测试完整
- [ ] 测试通过率100%

### Step 4: 编写Hook单元测试
**预估时间**: 3小时
- useChat hook测试
- useAgent hook测试
- useLocalStorage hook测试

**验收标准**:
- [ ] useChat测试完整
- [ ] useAgent测试完整
- [ ] 测试通过率100%

### Step 5: 编写Agent Runtime集成测试
**预估时间**: 4小时
- AgentOrchestrator测试
- Session管理测试
- 工具调用测试

**验收标准**:
- [ ] Orchestrator核心功能测试
- [ ] 会话生命周期测试
- [ ] 工具调用测试

### Step 6: 编写Sub-Agent测试
**预估时间**: 3小时
- SubAgentRouter测试
- 调用链测试
- 嵌套调用测试

**验收标准**:
- [ ] 路由测试完整
- [ ] 调用链测试完整
- [ ] 嵌套深度测试

### Step 7: 配置Playwright E2E测试
**预估时间**: 3小时
- 安装Playwright
- 创建E2E测试
- 配置测试环境

**验收标准**:
- [ ] Playwright安装成功
- [ ] 基础E2E测试通过
- [ ] 测试报告生成

### Step 8: 集成CI测试流程
**预估时间**: 2小时
- 创建GitHub Actions配置
- 配置测试job
- 配置覆盖率上传

**验收标准**:
- [ ] CI配置完成
- [ ] PR测试自动触发
- [ ] 覆盖率上传成功

---

## 测试要点

### 单元测试
- [x] Button组件测试 (5个测试用例)
- [x] Input组件测试 (4个测试用例)
- [x] MessageList组件测试 (6个测试用例)
- [x] useChat hook测试 (4个测试用例)

### 集成测试
- [x] AgentOrchestrator测试 (5个测试用例)
- [x] Session管理测试 (4个测试用例)
- [x] SubAgentRouter测试 (4个测试用例)

### E2E测试
- [x] 聊天功能测试 (3个测试用例)
- [x] 工具调用测试 (2个测试用例)

---

## npm scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 覆盖率目标清单

| 模块 | 文件数 | 目标行覆盖率 | 目标函数覆盖率 |
|------|--------|-------------|---------------|
| components/ui | 15 | 70% | 70% |
| features/agent | 20 | 60% | 60% |
| features/session | 10 | 70% | 70% |
| hooks | 8 | 70% | 70% |
| lib | 12 | 80% | 80% |
| **总计** | 65 | **70%** | **70%** |
