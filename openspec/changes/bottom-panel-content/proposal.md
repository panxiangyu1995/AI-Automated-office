# Proposal: bottom-panel-content

## 变更类型

- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 修复

## 背景

根据 UX 设计规范，L4 Bottom Panel 用于展示 L3 工作区内容的更详细信息。

当前代码中 Bottom Panel 只有占位符内容，需要实现实际功能。

## 目标

实现 Bottom Panel 的多种内容类型，与 L3 Tab 系统集成。

## 范围

### 包含

- BottomPanel 内容管理器
- PropertiesPanel（属性面板）
- DiagnosticsPanel（诊断面板）
- PreviewPanel（预览面板）
- AiSuggestionsPanel（AI 建议面板）

### 不包含

- Terminal 功能（终端输出）

## 影响范围

### 前端

- 修改 `src/components/common/BottomPanel.tsx` — 集成内容管理器
- 新增 `src/components/common/panel/` — 各种面板内容
- 修改 `src/stores/workbenchStore.ts` — 添加面板状态

### 后端

- 无

### 数据库

- 无

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 内容与当前 Tab 不匹配 | 中 | 中 | 根据 Tab 类型动态渲染 |
| 大量日志影响性能 | 低 | 中 | 分页加载和虚拟滚动 |

## 依赖

- **前置依赖**: `workbench-tab-system`
- **后置依赖**: 无
