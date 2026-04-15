# Proposal: 前端UX基础组件体系建设

## 背景

当前前端476处mock数据，缺少统一的加载状态组件、空状态组件、错误边界组件。
用户操作时无反馈，表单无验证，页面出错时直接白屏。这是产品体验的最大隐患。

## 目标

建立统一的UX基础组件体系，为所有模块提供：

1. LoadingSkeleton - 骨架屏加载状态组件
2. EmptyState - 空状态引导组件
3. ErrorBoundary - 错误边界捕获组件
4. 表单验证基础 (react-hook-form + zod setup)

## 变更内容

1. 创建 `src/components/ui/loading-skeleton.tsx` - 骨架屏组件
2. 创建 `src/components/ui/empty-state.tsx` - 空状态组件
3. 创建 `src/components/ui/error-boundary.tsx` - 错误边界组件
4. 创建 `src/components/ui/form-field.tsx` - 表单字段组件（集成验证）
5. 更新 `src/components/ui/` 导出

## 预期效果

- 所有模块可统一使用骨架屏替代空白加载状态
- 错误不会导致白屏，而是友好的错误提示
- 新表单可以统一使用react-hook-form+zod验证体系
- 为后续轮次替换mock数据时的加载状态提供支持
