# Proposal: Subagent 核心框架

## 变更类型

- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

根据 ADR-059 部门化 Subagent 架构设计，需要构建 Subagent 的核心基础设施。本设计解决了以下核心问题：

1. **工具膨胀问题**：随着业务扩展，Agent 工具数量持续增长，影响 LLM 理解准确性
2. **权限耦合问题**：主 Agent 承担所有业务逻辑，权限检查逻辑分散
3. **模型成本问题**：简单任务使用大模型造成成本浪费

## 目标

构建 Subagent 核心框架，支持：

1. **Subagent 类型系统**：定义 Primary Agent、Department Subagent、Personal Subagent、Hidden Agent 四类 Agent
2. **加载机制**：支持 Department Subagent 随插件加载、Personal Subagent 本地加载
3. **基础类型定义**：包括 AgentConfig、DelegationContract、PermissionContext 等核心类型

## 范围

### 包含

- Subagent 类型枚举和配置结构
- Subagent 加载器（支持插件和本地两种模式）
- 基础类型定义
- 与现有 Agent Runtime 的集成接口

### 不包含

- 具体 Department Subagent 实现（HR、Finance 等）
- 权限矩阵具体实现
- 路由引擎具体实现
- Personal Subagent 的 CRUD UI

## 影响范围

### 前端

- `src/features/agent/types/subagent.ts` - Subagent 类型定义

### 后端

- `src-tauri/src/agent/subagent/mod.rs` - Subagent 核心模块
- `src-tauri/src/agent/subagent/loader.rs` - Subagent 加载器
- `src-tauri/src/agent/subagent/types.rs` - 类型定义

### 数据库

- 暂不涉及数据库变更

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 与现有 Agent Runtime 集成困难 | 中 | 中 | 预留接口适配层 |
| 类型系统设计不够灵活 | 中 | 高 | 参考 kilocode 设计，预留扩展 |

## 依赖

- **前置依赖**: 无（基础框架）
- **后置依赖**:
  - Story 60.2: Finance Subagent 实现
  - Story 60.3: 权限矩阵基础
  - Story 60.4: 意图路由引擎
  - Story 60.5: Personal Subagent CRUD
