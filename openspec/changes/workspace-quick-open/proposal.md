# Proposal: workspace-quick-open

## Why

PRD (FR1000-1, FR1000-2) 定义了 Quick Open / Quick Pick 式快速访问能力，但当前实现只是一个空壳 UI（searchResults 永远是空数组）。用户无法快速搜索项目、单据、模板、知识条目、协作者与会话，跨模块切换成本高昂。

## What Changes

- 实现 Quick Open 搜索功能，支持多资源类型搜索
- 增强最近访问记录，关联工作区和项目上下文
- 实现搜索结果排序，优先展示当前工作区相关结果
- 添加键盘导航支持（方向键、Enter 选择）
- 实现搜索历史和收藏功能

## Capabilities

### New Capabilities

- `quick-open-ui`: 完善 Quick Open UI 组件，支持搜索框、结果列表、键盘导航
- `quick-open-search`: 跨资源搜索能力，支持搜索项目、单据、模板、知识条目、协作者
- `quick-open-ranking`: 搜索结果排序，优先展示当前工作区相关和最近使用的结果
- `recent-access-enhanced`: 增强最近访问记录，关联工作区、项目、资源类型

## Impact

- 新增 `src/features/quick-open/` - Quick Open 功能模块
- 修改 `src/components/common/AppLayout.tsx` - 集成 Quick Open
- 需要后端 API 支持多资源搜索
- 影响 Sidebar、ActivityBar 的交互模式
