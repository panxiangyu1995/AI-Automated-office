# Proposal: workbench-tab-system

## 变更类型

- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 修复

## 背景

根据 UX 设计规范（`ux-design-specification.md` 第 937-1023 行），系统采用 **L1–L4 四级导航体系**：

- L1: ActivityBar（活动栏）
- L2: Sidebar（侧边栏）
- L3: **Workbench（工作区，支持多标签页）**
- L4: Bottom Panel（底部面板）

代码扫描发现：**L3 工作区的多标签页（Tab）能力完全缺失**，无法同时打开多个文件/报表/详情。

## 目标

实现 L3 工作区多标签页系统，支持：

1. 多标签页同时打开文件、报表、详情
2. 标签页切换、关闭、重排
3. 未保存内容提示
4. 标签溢出滚动

## 范围

### 包含

- Tab 数据结构和状态管理
- TabBar 容器组件
- 单个 Tab 组件
- Tab 生命周期管理（打开、关闭、激活）

### 不包含

- Tab 与路由系统的集成（由 `workbench-tab-integration` 处理）
- Tab 快捷键支持（由 `workbench-tab-shortcuts` 处理）
- Tab 内容渲染（复用现有 WorkbenchHostRenderer）

## 影响范围

### 前端

- 新增 `src/stores/workbenchStore.ts` — Tab 状态管理
- 新增 `src/components/common/TabBar.tsx` — 多标签页容器
- 新增 `src/components/common/Tab.tsx` — 单个 Tab 组件
- 新增 `src/components/common/WorkbenchTabs.tsx` — Tab 管理器
- 修改 `src/components/common/Workbench.tsx` — 集成 Tab 栏

### 后端

- 无

### 数据库

- 无

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Tab 状态与路由不同步 | 中 | 中 | Tab 仅管理 UI 状态，不涉及路由 |
| 大量 Tab 导致性能问题 | 低 | 中 | 设置最大 Tab 数量限制（默认 10） |

## 依赖

- **前置依赖**: 无
- **后置依赖**: `workbench-tab-integration`、`workbench-tab-shortcuts`
