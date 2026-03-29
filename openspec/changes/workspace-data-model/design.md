# Design: workspace-data-model

## Context

当前系统的工作区（Workbench）只是一个静态布局容器，PRD 中定义的"工作区与项目管理"功能（FR1000-FR1006）完全未实现。

**现状分析：**
- `Workbench.tsx` 仅作为静态布局框架，根据路由渲染不同页面
- `uiStore.ts` 仅存储基础布局状态（宽度、可见性），无工作区概念
- `recentSidebarEntries` 仅记录最近访问的路由，无跨资源关联
- 无 Workspace/Project 数据模型

**约束：**
- 必须遵循现有架构（React + Zustand + Tauri）
- 工作区数据需要持久化到云端（多设备同步）
- 需要向后兼容现有功能

## Goals / Non-Goals

**Goals:**
- 定义 Workspace/Project 数据模型
- 实现工作区 CRUD 操作
- 实现工作区切换机制
- 建立工作区与用户的关系（成员角色）

**Non-Goals:**
- 不实现 Quick Open 搜索能力（Phase 2）
- 不实现布局预设系统（Phase 3）
- 不实现项目模板和高级权限（Phase 4）

## Decisions

### Decision 1: Workspace 数据模型采用「租户-工作区-项目」三级结构

**选择：**
- `Tenant`（租户） → `Workspace`（工作区） → `Project`（项目）
- 工作区是租户下的顶级隔离单元，项目是工作区下的子单元

**替代方案考虑：**
- 二级结构（租户-项目）：不支持多工作区快速切换
- 四级结构（租户-部门-工作区-项目）：过度设计

**理由：**
- 符合 PRD 中"多工作区管理"的需求
- 与现有权限系统（部门、租户）保持一致

### Decision 2: 工作区状态存储采用 Zustand + 云端同步

**选择：**
- 前端状态：`workspaceStore.ts` (Zustand)
- 持久化：云端 PostgreSQL + 本地 SQLite 缓存
- 同步：增量同步机制

**替代方案考虑：**
- 仅本地存储：无法跨设备同步
- 仅云端存储：离线体验差

**理由：**
- 遵循现有"本地优先 + 增量同步"架构
- 与 `syncStore` 复用同步逻辑

### Decision 3: 工作区切换采用「全局上下文」模式

**选择：**
- `workspaceStore` 中 `currentWorkspaceId` 作为全局上下文
- 路由、权限、工具配置等均读取此上下文

**替代方案考虑：**
- Context API 传递：层级深，透传繁琐
- URL 参数传递：状态分散，难以管理

**理由：**
- Zustand 全局状态简洁高效
- 与现有 `uiStore` 模式一致

### Decision 4: 成员角色复用现有权限系统

**选择：**
- `WorkspaceMember` 仅存储「用户-Workspace-角色」关系
- 角色定义复用现有的 permission system

**替代方案考虑：**
- 独立的工作区角色系统：增加复杂度，与现有系统割裂
- 直接使用系统角色：粒度不够，无法按工作区隔离

**理由：**
- 减少重复建设，复用成熟组件
- 支持工作区级别的权限继承

## Risks / Trade-offs

[Risk] 工作区切换可能中断用户当前操作
→ [Mitigation] 切换前检查是否有未保存状态，提供确认对话框

[Risk] 大量工作区时状态管理复杂
→ [Mitigation] 仅在内存保留当前工作区完整状态，其他工作区按需加载

[Risk] 云端同步冲突
→ [Mitigation] 使用 timestamp + last-write-wins 策略

## Open Questions

1. 工作区是否需要「默认工作区」概念？第一个创建的自动成为默认？
2. 工作区删除时，项目如何处理？级联删除还是转移？
3. 是否支持工作区间的项目迁移？
