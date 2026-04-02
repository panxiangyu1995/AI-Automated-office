# Theme System Foundation - OpenSpec Change

## 变更概述

本变更创建主题系统的基础架构，包括：
- 类型定义（TypeScript）
- 颜色变换工具函数
- 颜色注册表
- 基础颜色定义

## 目录结构

```
src/theme/
├── index.ts                    # 统一导出
├── colorRegistry.ts            # 颜色注册表
├── colorTypes.ts               # 类型定义
├── colorUtils.ts               # 颜色变换工具
└── colors/
    ├── index.ts               # 颜色导出
    └── baseColors.ts          # 基础颜色定义
```

## 依赖

- 无前置依赖

## 后续变更

- `theme-system-react-integration`: React 集成
- `theme-system-component-migration`: 组件迁移
- `theme-system-preset-themes`: 预设主题

## 状态

- [ ] proposal.md
- [ ] design.md
- [ ] tasks.md
- [ ] specs/spec.md
