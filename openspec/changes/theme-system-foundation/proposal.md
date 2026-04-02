# Proposal: 主题系统基础架构

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 修复

## 背景

当前项目的主题系统存在以下问题：
1. 只有 light/dark 两套主题
2. 缺少高对比度主题支持
3. 颜色定义分散，缺乏统一注册表
4. 无法支持主题继承和颜色变换
5. 组件中存在大量硬编码颜色（如 `#161B22`、`#30363D` 等）

需要建立统一的主题系统架构，参考 VSCode 主题系统设计。

## 目标

建立主题系统基础架构，支持：
- 四种主题类型：light / dark / hc / system
- 统一的颜色注册表机制
- 颜色变换函数（darken、lighten、transparent、mix）
- CSS 变量自动生成

## 范围

### 包含
- TypeScript 类型定义
- 颜色变换工具函数
- 颜色注册表实现
- 基础颜色定义

### 不包含
- React 集成（ThemeProvider、useTheme）
- 组件迁移
- 预设主题定义

## 影响范围

### 前端
- `src/theme/` 目录（新建）

### 后端
- 无

### 数据库
- 无

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|-----|-------|------|---------|
| CSS 变量与 Tailwind 冲突 | 低 | 中 | 使用 `--ao-` 前缀避免冲突 |
| 主题切换性能问题 | 低 | 低 | 使用 style.setProperty 局部更新 |

## 依赖

- **前置依赖**: 无
- **后置依赖**:
  - theme-system-react-integration
  - theme-system-component-migration
  - theme-system-preset-themes
