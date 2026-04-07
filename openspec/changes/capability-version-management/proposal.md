# Proposal: 部门能力包版本管理

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：`src/features/marketplace/components/MarketplacePanel.tsx`
后端模块已存在：`src-tauri/src/capability/`

**缺失部分**：版本检测、增量更新、回滚能力。

## 目标

实现能力包版本管理：
1. 实现版本检测 API
2. 实现增量更新机制
3. 实现回滚能力
4. 实现版本兼容性检查
5. 完善市场 UI

## 影响范围

### 前端
- `src/features/marketplace/components/MarketplacePanel.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/capability/` - 扩展现有模块

## 依赖

- **前置依赖**: Task 155 (部门市场基础), Task 156 (部门能力包系统集成)

## 验收标准

1. 版本检测能够工作
2. 增量更新能够成功
3. 回滚能够生效
