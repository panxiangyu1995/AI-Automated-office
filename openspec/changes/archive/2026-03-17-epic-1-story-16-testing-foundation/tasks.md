# Tasks: 基础测试框架搭建

## 任务列表

### 任务 1: 初始化测试依赖与命令
- **描述**: 增加 Vitest/Playwright 依赖，定义统一测试脚本
- **文件**: `package.json`
- **验收**: `pnpm test`、`pnpm test:e2e`、`pnpm test:coverage`、`pnpm test:gate` 命令可执行并返回正确退出码

### 任务 2: 配置单元与集成测试框架
- **描述**: 新增 Vitest 配置并接入项目 TypeScript 环境
- **文件**: `vitest.config.ts`
- **验收**: 能发现并执行 `tests/unit`、`tests/integration` 中测试

### 任务 3: 配置E2E测试框架
-- **描述**: 新增 Playwright 配置，支持 smoke、a11y、resilience 三类场景
- **文件**: `playwright.config.ts`
- **验收**: 能发现并执行 `tests/e2e` 中三类用例并输出报告

### 任务 4: 建立测试目录与基础样例
- **描述**: 创建核心与扩展测试目录，补齐最小可运行样例
- **文件**: `tests/unit/*`, `tests/integration/*`, `tests/e2e/*`, `tests/contracts/*`, `tests/performance/*`, `tests/security/*`
- **验收**: 各目录均有可运行样例，失败可定位到具体层级

### 任务 5: 建立测试数据与夹具体系
- **描述**: 建立 fixtures/factories/seeds 与测试 helper 约定
- **文件**: `tests/fixtures/*`, `tests/helpers/*`, `tests/README.md`
- **验收**: 新增测试可复用数据构造能力，避免跨用例耦合

### 任务 6: 建立覆盖率与质量门禁
- **描述**: 增加覆盖率阈值检查与统一 gate 脚本
- **文件**: `scripts/test/coverage-check.mjs`, `scripts/test/quality-gate.mjs`
- **验收**: 覆盖率不达标或关键任务失败时门禁失败

### 任务 7: 建立选择性执行机制
- **描述**: 根据变更范围筛选 P1/P2 测试集并保留 P0 全量执行
- **文件**: `scripts/test/selective-run.mjs`
- **验收**: 选择性执行可用，且不会跳过 P0 测试

## 执行顺序

1. 初始化测试依赖与命令
2. 配置单元与集成测试框架
3. 配置E2E测试框架
4. 建立测试目录与基础样例
5. 建立测试数据与夹具体系
6. 建立覆盖率与质量门禁
7. 建立选择性执行机制

## 测试要点

- [ ] 单元测试可执行
- [ ] 集成测试可执行
- [ ] E2E smoke/a11y/resilience 可执行
- [ ] Contract/Performance/Security 测试入口可执行
- [ ] 覆盖率阈值可校验
- [ ] 质量门禁可阻断失败构建
- [ ] 选择性执行不跳过 P0 测试
- [ ] 测试失败返回非零退出码
