# Proposal: 代码质量与Lint规则

## 变更类型
- [x] polish (优化完善)

## 背景

当前代码库ESLint规则不完善，主要问题：
- ESLint配置基础，缺乏React最佳实践规则
- 代码风格不统一（命名、格式等）
- 缺少Git Hooks强制检查
- Prettier配置不完整
- 新增代码容易引入lint错误

本Story旨在完善ESLint规则，统一代码风格，提升代码质量。

## 目标

实现代码质量与Lint规则，满足以下验收标准：
- 审查并更新ESLint配置，增加React最佳实践规则
- 添加Hooks相关规则（rules-of-hooks, exhaustive-deps）
- 修复现有Lint错误
- 配置Prettier代码格式化（与ESLint集成）
- 添加Git Hooks自动检查（pre-commit）

## 范围

### 包含
- 更新ESLint配置文件（.eslintrc.cjs）
- 添加React插件和规则
- 添加Hooks相关规则
- 添加TypeScript相关规则
- 配置Prettier与ESLint集成
- 添加pre-commit hook
- 修复现有Lint错误
- 创建lint-staged配置

### 不包含
- 后端Rust代码lint（本Story为纯前端）
- 已有git hooks迁移

## 影响范围

### 前端
**受影响的文件/模块：**
- `.eslintrc.cjs` - ESLint配置更新
- `.prettierrc` - Prettier配置
- `package.json` - 新增lint依赖和脚本
- `src/` - 代码风格检查和修复

**新增依赖：**
- `eslint-plugin-react-hooks` - React Hooks规则
- `eslint-plugin-prettier` - Prettier集成
- `lint-staged` - Git hooks增强

### 后端
- 无需后端配合

### 数据库
- 无数据库变更

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 新规则导致大量错误 | 高 | 中 | 分阶段添加，逐步修复 |
| pre-commit hook影响提交速度 | 中 | 低 | 使用lint-staged只检查暂存文件 |
| 规则过于严格影响开发效率 | 中 | 中 | 可配置为warning级别 |
| 与现有代码冲突 | 高 | 中 | 预留禁用注释选项 |

## 依赖

### 前置依赖
- 无直接前置依赖

### 后置依赖
- 为后续开发提供代码质量保障
- 减少代码审查中的风格问题

## 实现步骤

1. **审查现有ESLint配置**: 分析当前规则
2. **安装新插件**: 添加React Hooks、Prettier插件
3. **更新ESLint配置**: 添加最佳实践规则
4. **配置Prettier**: 创建.prettierrc配置
5. **集成ESLint和Prettier**: 解决冲突
6. **添加lint-staged**: 配置Git pre-commit hook
7. **修复现有Lint错误**: 全量修复
8. **验证和优化**: 确保规则合理
