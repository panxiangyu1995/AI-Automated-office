# Proposal: API文档生成

## 变更类型
- [x] polish (优化完善)

## 背景

随着系统复杂度增加，核心模块（如Agent Runtime、工具系统）缺乏完整的API文档，导致：
- 新开发者上手困难，理解代码成本高
- 内部API使用方式不统一
- 难以维护和使用现有模块
- 知识传承依赖口口相传

本Story旨在为核心模块生成完整、规范的API文档，特别是Agent Runtime的使用方式，建立文档基础设施。

## 目标

实现API文档生成，满足以下验收标准：
- 配置TypeDoc文档生成工具，建立文档构建流程
- 为核心模块添加完整的JSDoc注释
- 生成Agent Runtime API文档
- 生成工具系统API文档
- 文档可通过命令行生成并发布

## 范围

### 包含
- 安装和配置TypeDoc文档生成工具
- 配置typedoc.json文档生成配置
- 为Agent Runtime核心模块添加JSDoc注释
- 为工具系统核心模块添加JSDoc注释
- 为共享类型定义添加JSDoc注释
- 生成可发布的HTML文档
- 创建文档构建脚本

### 不包含
- 后端Rust API文档（本Story为纯前端）
- 已有UI组件文档化（本Story聚焦核心逻辑模块）
- 文档部署流程（仅生成文档，部署另行规划）

## 影响范围

### 前端
**受影响的文件/模块：**
- `src/features/agent/` - Agent Runtime模块文档
- `src/features/session/` - Session管理模块文档
- `src/features/tools/` - 工具系统文档
- `src/types/` - 类型定义文档
- `package.json` - 新增typedev依赖和脚本
- `typedoc.json` - 新建TypeDoc配置文件

**新增文件：**
- `typedoc.json` - TypeDoc配置
- `docs/` - 生成的文档目录（可选gitignore）

### 后端
- 无需后端配合

### 数据库
- 无数据库变更

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 文档与代码不同步 | 高 | 中 | 将文档生成集成到CI/CD |
| JSDoc注释质量参差不齐 | 中 | 低 | 制定注释规范模板 |
| 第三方库类型缺失 | 低 | 低 | 使用@types包 |
| TypeDoc配置复杂 | 中 | 低 | 参考成熟配置模板 |

## 依赖

### 前置依赖
- **Story 51.1** (主Agent协调器) - Agent Runtime核心实现

### 后置依赖
- 为其他开发者提供文档支持
- 便于代码审查和维护

## 实现步骤

1. **安装TypeDoc**: 配置typedoc和相关插件
2. **创建配置文件**: 创建typedoc.json配置
3. **Agent Runtime文档**: 为Agent Runtime模块添加JSDoc
4. **工具系统文档**: 为工具系统添加JSDoc
5. **类型文档**: 为共享类型添加JSDoc
6. **生成验证**: 运行文档生成，验证输出
7. **集成脚本**: 添加npm script方便生成
