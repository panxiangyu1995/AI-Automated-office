# Proposal: 测试覆盖率提升

## 变更类型
- [x] polish (优化完善)

## 背景

当前代码库测试覆盖率不足，主要问题：
- 缺乏系统的单元测试，代码变更难以回归验证
- UI组件缺少测试，导致UI变更频繁引入bug
- Agent Runtime没有集成测试，难以验证核心功能
- 测试流程不规范，覆盖率指标不明确

本Story旨在提升代码库的测试覆盖率，建立规范的测试流程。

## 目标

实现测试覆盖率提升，满足以下验收标准：
- 配置测试覆盖率报告工具，可视化覆盖率数据
- 为关键UI组件添加单元测试（Button、Input、MessageList等）
- 创建Agent Runtime集成测试套件
- 添加Sub-Agent调用链测试
- 实现端到端测试自动化

## 范围

### 包含
- 配置Vitest + React Testing Library测试框架
- 配置覆盖率报告（Coverage V8或Istanbul）
- 为核心UI组件编写单元测试
- 为Agent Runtime编写集成测试
- 为Sub-Agent调用链编写测试
- 配置Playwright端到端测试
- 创建CI测试流程

### 不包含
- 后端Rust代码测试（本Story为纯前端）
- 已有旧测试框架迁移（保留现有测试）

## 影响范围

### 前端
**受影响的文件/模块：**
- `package.json` - 新增测试依赖
- `vite.config.ts` - 测试配置
- `src/components/ui/` - UI组件测试
- `src/features/agent/` - Agent集成测试
- `src/features/session/` - Session测试
- `tests/` - 测试文件和配置

**新增依赖：**
- `vitest` - 测试运行器
- `@testing-library/react` - React组件测试
- `@testing-library/jest-dom` - DOM断言
- `jsdom` - DOM环境
- `@playwright/test` - E2E测试

### 后端
- 无需后端配合

### 数据库
- 无数据库变更

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 测试覆盖率目标过高导致资源浪费 | 中 | 低 | 设定合理的覆盖率目标 |
| 现有代码难以测试 | 中 | 中 | 重构为可测试代码 |
| E2E测试不稳定 | 中 | 中 | 使用playwright最佳实践 |
| CI测试时间过长 | 低 | 中 | 分离快速测试和慢速测试 |

## 依赖

### 前置依赖
- **Story 51.4** (端到端测试框架) - 基础测试框架

### 后置依赖
- 为后续Story提供回归保护
- 提高代码质量信心

## 实现步骤

1. **配置测试框架**: Vitest + React Testing Library
2. **配置覆盖率报告**: 集成Coverage V8
3. **编写UI组件测试**: Button、Input、MessageList等
4. **编写Agent集成测试**: Runtime核心功能
5. **编写Sub-Agent测试**: 调用链测试
6. **配置Playwright E2E**: 端到端测试
7. **集成CI流程**: GitHub Actions测试
