# Proposal: 类型定义统一

## 变更类型
- [x] polish (优化完善)

## 背景

当前代码库中存在大量重复的类型定义，主要体现在以下几个方面：
- `ToolCategory` 在多个模块中有不同定义（`src/features/session/tools/`、`src/features/agent/`等）
- `StepStatus` 和 `TaskStatus` 在不同文件中重复定义
- 枚举值不一致导致类型转换困难
- 新增功能时开发者倾向于在本地创建类型而非复用现有类型

这种混乱的类型系统导致：
- 类型定义不一致引发的bug
- 代码维护困难
- 类型冗余增加包体积
- 开发体验差

本Story旨在梳理并统一代码库中的类型定义，建立共享类型规范。

## 目标

实现类型定义统一，满足以下验收标准：
- 梳理代码库中的重复类型定义，建立类型清单
- 创建统一的 `src/types/` 目录和共享类型定义文件
- 统一 `ToolCategory` 类型定义，消除歧义
- 统一 `StepStatus` / `TaskStatus` 类型定义
- 更新所有引用到统一类型，确保无残留重复定义

## 范围

### 包含
- 全面梳理代码库中的重复类型定义
- 创建 `src/types/shared/` 共享类型目录
- 统一ToolCategory类型定义（单一定义，全局使用）
- 统一StepStatus/TaskStatus类型定义
- 统一Agent相关类型（Message、Session、ToolCall等）
- 更新所有模块的import引用
- 移除重复的类型定义文件

### 不包含
- 创建新的业务逻辑类型（本Story仅整理现有类型）
- 后端Rust类型统一（本Story为纯前端）
- 数据库schema变更
- API接口修改

## 影响范围

### 前端
**受影响的文件/模块：**
- `src/types/` - 新建共享类型目录
- `src/features/agent/` - Agent相关类型统一
- `src/features/session/` - Session/Tools类型统一
- `src/features/settings/` - 设置相关类型
- `src/stores/` - Store类型统一
- `src/lib/` - 工具函数类型统一

**新增文件：**
- `src/types/shared/` - 共享类型目录
  - `tool.types.ts` - 工具系统类型
  - `agent.types.ts` - Agent核心类型
  - `session.types.ts` - 会话类型
  - `common.types.ts` - 通用类型

### 后端
- 无需后端配合，纯前端类型整理

### 数据库
- 无数据库变更

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 遗留类型定义未发现 | 中 | 中 | 使用grep全面搜索关键词 |
| 更新引用时漏改导致运行时错误 | 中 | 高 | 全面测试 + TypeScript严格检查 |
| 第三方库类型冲突 | 低 | 中 | 保留必要的外露类型别名 |
| 与其他分支类型定义不同步 | 低 | 低 | 统一规范文档化 |

## 依赖

### 前置依赖
- 无直接前置依赖

### 后置依赖
- 为Epic 56其他Story提供类型基础设施
- 便于后续Story的代码审查和维护

## 实现步骤

1. **类型审计**: 使用grep搜索代码库中的重复类型定义
2. **建立类型清单**: 整理所有待统一的类型
3. **创建共享类型目录**: 建立 `src/types/shared/`
4. **统一ToolCategory**: 确定最终定义，更新所有引用
5. **统一Status类型**: 统一StepStatus/TaskStatus
6. **统一Agent类型**: 统一Message/Session/ToolCall
7. **清理冗余**: 删除重复的类型定义
8. **全面测试**: 编译检查 + 功能验证
