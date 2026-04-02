# Tasks: 主题系统 React 集成

## 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 2

## 任务列表

### Task 1: 实现 ThemeProvider
- **描述**: 创建 ThemeProvider 组件，提供主题上下文
- **文件**: `src/theme/ThemeProvider.tsx`
- **验收**:
  - [ ] Provider 正确提供 themeType
  - [ ] Provider 正确提供 resolvedTheme
  - [ ] Provider 正确提供 setThemeType
  - [ ] 正确监听系统主题变化
  - [ ] 正确持久化到 localStorage

### Task 2: 实现 useTheme Hook
- **描述**: 创建 useTheme Hook，访问主题上下文
- **文件**: `src/theme/useTheme.ts`
- **验收**:
  - [ ] 正确抛出未包裹错误
  - [ ] 返回完整的上下文值

### Task 3: 更新 App.tsx
- **描述**: 将 ThemeProvider 包裹应用
- **文件**: `src/App.tsx`
- **验收**:
  - [ ] ThemeProvider 包裹 BrowserRouter
  - [ ] 不影响现有功能

### Task 4: 更新导出入口
- **描述**: 更新 index.ts 导出新组件和 Hook
- **文件**: `src/theme/index.ts`
- **验收**:
  - [ ] 导出 ThemeProvider
  - [ ] 导出 useTheme

## 测试要点

- [ ] ThemeProvider 渲染测试
- [ ] useTheme 抛出错误测试
- [ ] localStorage 持久化测试
- [ ] 系统主题监听测试

## 实现检查清单

- [ ] 代码风格符合项目规范
- [ ] TypeScript strict mode 通过
- [ ] JSDoc 注释完整
