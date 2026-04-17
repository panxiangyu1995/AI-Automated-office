# 迭代变更提案 - Hooks类型定义完善

## 背景

前端hooks缺少完整的类型定义，影响代码质量和开发效率。

## 问题

1. `src/hooks/eventBus.ts` 缺少类型导出
2. `src/hooks/pluginLifecycle.ts` 缺少类型定义文件
3. `src/hooks/serviceContainer.ts` 缺少类型定义文件
4. 类型分散在各个文件中，缺乏统一管理

## 目标

完善hooks的类型定义，提升代码质量。

## 预期效果

- 所有hooks都有完整的类型定义
- 类型文件统一管理
- 提升开发体验和代码质量
