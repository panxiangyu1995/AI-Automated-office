# Specification: 基础测试框架搭建

## 需求来源

### PRD 需求
- **FR24**: 开发者可以按照API规范开发部门模块
- **FR25**: 开发者可以调试和测试部门模块
- **FR1186**: 插件质量门禁支持测试与安全扫描
- **NFR1**: 本地操作响应时间 < 100ms
- **NFR17**: 系统可用性 > 99.5%
- **NFR35**: 集成可靠性

### 架构约束
- 测试框架采用 **Vitest + Playwright**
- 测试目录结构采用 `tests/` 分层并镜像源码结构

### UX 规范
- **UX-04** 即时价值：开发者应快速获得可执行测试反馈

## 功能规格

### 用户故事
As a 开发者,
I want 建立统一的项目测试框架,
So that 可以稳定执行单元测试、集成测试和端到端测试，保障迭代质量。

### 验收场景

#### Scenario 1: 初始化测试框架
- **GIVEN** 项目代码仓库已初始化
- **WHEN** 开发者完成测试基础设施搭建
- **THEN** Vitest 可以运行单元/集成测试
- **AND** Playwright 可以运行 E2E 测试
- **AND** 测试目录结构符合规范

#### Scenario 2: 执行分层测试命令
- **GIVEN** 项目已存在基础 smoke 测试样例
- **WHEN** 运行 `pnpm test`
- **THEN** 输出单元与集成测试结果
- **AND** 失败时返回非零退出码

#### Scenario 3: 执行E2E命令
- **GIVEN** 项目已存在 E2E smoke 测试样例
- **WHEN** 运行 `pnpm test:e2e`
- **THEN** 输出 E2E 测试结果与报告
- **AND** 失败时返回非零退出码

#### Scenario 4: 执行契约测试
- **GIVEN** 后端接口存在 OpenAPI 或响应结构约定
- **WHEN** 运行契约测试集
- **THEN** 校验请求与响应字段结构
- **AND** 破坏性变更会被识别并失败

#### Scenario 5: 执行性能预算测试
- **GIVEN** 已定义关键性能预算
- **WHEN** 运行性能测试集
- **THEN** 输出预算对比结果
- **AND** 超出阈值时返回失败

#### Scenario 6: 执行安全与可访问性测试
- **GIVEN** 项目存在关键输入点与主要页面
- **WHEN** 运行安全与可访问性测试
- **THEN** 检测基础输入校验与敏感信息泄漏
- **AND** 检测关键页面可访问性问题

#### Scenario 7: 执行质量门禁
- **GIVEN** 需要在本地或CI判定是否可合并
- **WHEN** 运行质量门禁命令
- **THEN** 汇总 lint、build、test、coverage 状态
- **AND** 任一关键项失败时整体失败

#### Scenario 8: 选择性测试执行
- **GIVEN** 本次提交仅涉及部分模块
- **WHEN** 运行选择性测试命令
- **THEN** 自动识别受影响测试集
- **AND** P0 测试集始终全量执行

## 数据规格

### 输入
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| command | string | 是 | 允许 `pnpm test`、`pnpm test:e2e`、`pnpm test:coverage`、`pnpm test:gate` |
| target | string | 否 | `unit`/`integration`/`e2e`/`contract`/`performance`/`security`/`a11y` |
| changedFiles | string[] | 否 | 选择性执行时用于识别影响范围 |

### 输出
| 字段 | 类型 | 描述 |
|------|------|------|
| status | string | `passed` 或 `failed` |
| total | number | 执行用例总数 |
| failed | number | 失败用例数 |
| reportPath | string | 测试报告路径（若生成） |
| coverage | object | 覆盖率摘要（lines/branches/functions/statements） |
| gateSummary | object | 质量门禁结果摘要 |

## 边界条件

- 无测试文件时命令应提示明确错误
- E2E 环境未就绪时应输出可诊断信息
- 测试命令超时时应中断并返回失败
- 覆盖率报告缺失时门禁应直接失败
- 外部依赖不可用时应使用 mock 或跳过策略并标记原因

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| TEST-001 | 测试配置缺失 | 提示补齐 `vitest.config.ts` 或 `playwright.config.ts` |
| TEST-002 | 未发现测试用例 | 提示在对应目录添加 smoke 用例 |
| TEST-003 | 测试执行失败 | 输出失败断言与堆栈，返回非零退出码 |
| TEST-004 | 覆盖率不达标 | 输出阈值与实际值对比，返回非零退出码 |
| TEST-005 | 质量门禁失败 | 输出失败项清单并中断流程 |
| TEST-006 | 选择性执行解析失败 | 回退到全量测试并输出告警 |
