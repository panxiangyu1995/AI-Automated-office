# Epic 1, Story 1.16: 基础测试框架搭建

## 概述

建立项目级统一测试基础设施，覆盖单元、集成、端到端、契约、性能、安全、可访问性与稳定性测试能力，形成可持续扩展的质量门禁底座。

## 铁律映射

### PRD 需求
- **FRs**: FR24（开发者可以按照API规范开发部门模块）, FR25（开发者可以调试和测试部门模块）, FR1186（插件质量门禁支持测试与安全扫描）
- **NFRs**: NFR1（本地操作响应时间 < 100ms）, NFR17（系统可用性 > 99.5%）, NFR35（集成可靠性）

### 架构需求
- **ADR-001**: 工程技术栈与目录结构基线
- **架构约束**: 测试框架采用 Vitest + Playwright，测试目录遵循 `tests/` 分层并镜像源码结构

### UX 需求
- **UX-04**: 即时价值原则（测试反馈可快速获取并用于迭代）

## 验收标准

### AC1: 多层测试框架就绪
- **Given** 项目代码仓库已初始化
- **When** 搭建测试基础设施
- **Then** 配置 Vitest 支持 Unit 与 Integration
- **And** 配置 Playwright 支持 E2E 与 Accessibility
- **And** 建立 `tests/unit`、`tests/integration`、`tests/e2e`、`tests/contracts`、`tests/performance`、`tests/security`、`tests/fixtures` 目录结构

### AC2: 测试入口与报告可执行
- **Given** 开发者执行测试脚本
- **When** 运行 `pnpm test`、`pnpm test:e2e`、`pnpm test:coverage`
- **Then** 可执行各层级基础 smoke 与回归样例
- **And** 输出标准化控制台结果与报告文件
- **And** 失败时返回非零退出码用于质量门禁

### AC3: 质量门禁可落地
- **Given** 需要在本地或CI执行质量检查
- **When** 运行统一质量门禁命令
- **Then** 校验 lint、build、测试通过状态
- **And** 校验覆盖率阈值是否达标
- **And** 支持按变更范围选择性执行测试

### AC4: 测试资产可复用
- **Given** 新增业务 Story 需要补测试
- **When** 复用测试基础设施
- **Then** 可使用统一 fixtures/factories/seeds 构造测试数据
- **And** 可使用统一 helpers 编写稳定断言
- **And** 可按风险等级扩展 P0/P1/P2 测试集

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
