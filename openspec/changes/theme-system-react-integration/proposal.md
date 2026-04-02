# Proposal: 主题系统 React 集成

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 修复

## 背景

主题系统基础架构已建立，需要将其集成到 React 应用中，提供主题切换能力。

## 目标

实现 React 主题集成，提供：
- ThemeProvider 组件
- useTheme Hook
- 系统主题监听
- localStorage 持久化

## 范围

### 包含
- ThemeProvider 组件
- useTheme Hook
- App.tsx 集成

### 不包含
- 组件迁移
- 预设主题定义

## 影响范围

### 前端
- `src/theme/ThemeProvider.tsx`（新建）
- `src/theme/useTheme.ts`（新建）
- `src/App.tsx`（修改）

### 后端
- 无

### 数据库
- 无

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|-----|-------|------|---------|
| Provider 嵌套冲突 | 低 | 中 | 使用 createContext 替代 |
| SSR 兼容性问题 | 低 | 中 | 添加 typeof window 检查 |

## 依赖

- **前置依赖**: theme-system-foundation
- **后置依赖**:
  - theme-system-component-migration
  - theme-system-preset-themes
