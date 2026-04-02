# Specification: 主题系统 React 集成

## 需求来源

### PRD 需求
- FR1-FR6: 桌面端 UI 基本框架

### 架构约束
- 技术栈：React + TypeScript
- 状态管理：Zustand（项目已有）

### UX 规范
- 主题切换应即时生效，无需刷新页面
- 主题选择应持久化

## 功能规格

### ThemeProvider

#### Props
| 属性 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| children | ReactNode | 是 | 子组件 |

#### Context Value
| 属性 | 类型 | 说明 |
|-----|------|------|
| themeType | ThemeType | 用户选择的主题类型 |
| resolvedTheme | 'light' \| 'dark' \| 'hc' | 实际解析的主题 |
| setThemeType | (theme: ThemeType) => void | 设置主题 |

#### 行为
1. 初始化时从 localStorage 读取保存的主题
2. 默认使用 'system' 主题
3. 监听系统主题变化（仅 system 模式）
4. 主题切换时更新 DOM class 和 CSS 变量
5. 持久化用户选择到 localStorage

### useTheme

#### 返回值
| 属性 | 类型 | 说明 |
|-----|------|------|
| themeType | ThemeType | 用户选择的主题类型 |
| resolvedTheme | 'light' \| 'dark' \| 'hc' | 实际解析的主题 |
| setThemeType | (theme: ThemeType) => void | 设置主题 |

#### 错误场景
| 场景 | 处理 |
|-----|------|
| 未包裹 ThemeProvider | 抛出 Error |

## 使用示例

```tsx
import { ThemeProvider, useTheme } from '@/theme'

// 包裹应用
function App() {
  return (
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  )
}

// 使用 Hook
function ThemeSwitcher() {
  const { themeType, setThemeType } = useTheme()
  
  return (
    <select value={themeType} onChange={e => setThemeType(e.target.value as ThemeType)}>
      <option value="system">跟随系统</option>
      <option value="light">亮色</option>
      <option value="dark">暗色</option>
      <option value="hc">高对比度</option>
    </select>
  )
}
```

## 边界条件

1. **SSR 环境**: 初始主题使用默认值
2. **localStorage 不可用**: 静默降级到 system
3. **系统主题查询不支持**: 默认使用 light

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 未包裹 ThemeProvider | 抛出 Error: 'useTheme must be used within a ThemeProvider' |
