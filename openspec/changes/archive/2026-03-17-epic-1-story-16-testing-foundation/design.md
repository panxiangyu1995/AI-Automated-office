# Design: 基础测试框架搭建

## 技术方案

### 测试分层设计

- **Unit（Vitest）**: 覆盖纯函数、状态处理、基础组件行为
- **Integration（Vitest）**: 覆盖模块间协作与服务封装行为
- **E2E（Playwright）**: 覆盖应用壳层加载与关键交互流程
- **Contract（Vitest/Schema）**: 覆盖 API 响应结构与契约兼容性
- **Performance（Vitest 基准 + 预算断言）**: 覆盖关键路径性能预算
- **Security（Vitest）**: 覆盖输入校验、鉴权边界、敏感信息泄漏
- **Accessibility（Playwright + axe）**: 覆盖可访问性最小合规检查

### 工程结构设计

```text
tests/
├── unit/
│   ├── smoke/
│   └── contracts/
├── integration/
│   ├── smoke/
│   └── workflows/
├── e2e/
    ├── smoke/
    ├── accessibility/
    └── resilience/
├── contracts/
│   └── openapi/
├── performance/
│   └── startup/
├── security/
│   └── input-validation/
├── fixtures/
│   ├── factories/
│   └── seeds/
└── helpers/
```

- `vitest.config.ts` 负责单元/集成测试运行配置
- `playwright.config.ts` 负责 E2E 运行配置和报告策略
- `package.json` 提供统一脚本入口
- `scripts/test/coverage-check.mjs` 负责覆盖率阈值校验
- `scripts/test/selective-run.mjs` 负责变更范围选择性执行
- `scripts/test/quality-gate.mjs` 负责编排本地/CI 门禁执行

## 运行流程

### 单元/集成测试
1. 执行 `pnpm test`
2. Vitest 发现 `tests/unit` 与 `tests/integration` 下用例
3. 输出测试结果与失败明细
4. 失败时返回非零退出码

### E2E 测试
1. 执行 `pnpm test:e2e`
2. Playwright 运行 `tests/e2e` 下 smoke、accessibility、resilience 用例
3. 输出 HTML 报告与失败详情
4. 失败时返回非零退出码

### 覆盖率与门禁
1. 执行 `pnpm test:coverage`
2. 生成覆盖率报告并落盘
3. 执行 `pnpm test:gate`
4. 汇总 lint、build、test、coverage 结果并输出门禁结果

## 质量门禁策略

- 所有测试命令必须具备可机读退出码
- P0 测试集默认全量执行，不允许被选择性执行跳过
- P1/P2 测试集支持按变更范围选择性执行
- smoke 用例必须覆盖“应用可启动 + 核心壳层可见”
- 覆盖率阈值采用分层配置（总体、单目录、关键模块）
- 脚本命名统一，便于后续 CI 直接接入

## 安全与稳定性考虑

- E2E 不使用生产数据，测试数据通过本地固定样例提供
- 测试用例避免依赖外部不稳定服务
- 失败信息中不记录敏感配置内容
- 所有测试环境凭据使用环境变量注入，禁止硬编码
- 失败重试仅用于已标记的易波动场景，避免掩盖真实缺陷

## 可扩展性

- 后续 Story 可在对应分层目录按镜像结构扩展用例
- 可平滑增加覆盖率门槛、分片执行、并发策略
- 可扩展 API 契约校验、视觉回归、故障注入测试
- 可在后续 Epic 接入 CI 并发矩阵与质量趋势看板
