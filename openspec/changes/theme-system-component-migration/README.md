# Theme System Component Migration - OpenSpec Change

## 变更概述

本变更将组件中的硬编码颜色迁移到 CSS 变量，实现主题切换能力。

## 迁移范围

### P0 优先级（核心组件）
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/common/TopBar.tsx`
- `src/components/common/Sidebar.tsx`

### P1 优先级（重要组件）
- `src/components/common/ActivityBar.tsx`
- `src/components/common/StatusBar.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/dialog.tsx`

## 依赖

- `theme-system-foundation`（前置）
- `theme-system-react-integration`（前置）

## 后续变更

- `theme-system-preset-themes`: 预设主题

## 状态

- [ ] proposal.md
- [ ] design.md
- [ ] tasks.md
- [ ] specs/spec.md
