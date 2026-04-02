# Design: 主题系统 React 集成

## 技术方案

### 1. ThemeProvider (ThemeProvider.tsx)

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getAllColors, toCssVariableName, resolveColorValue } from './colorRegistry'
import type { ThemeType } from './colorTypes'

interface ThemeContextValue {
  themeType: ThemeType
  resolvedTheme: 'light' | 'dark' | 'hc'
  setThemeType: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'ao-theme-type'

/**
 * 加载主题到 DOM
 */
function loadTheme(resolvedTheme: 'light' | 'dark' | 'hc') {
  const root = document.documentElement
  const colors = getAllColors()

  // 移除旧的主题 class
  root.classList.remove('light', 'dark', 'hc')
  // 添加新的主题 class
  root.classList.add(resolvedTheme)

  // 设置 CSS 变量
  for (const color of colors) {
    const value = resolveColorValue(color.id, resolvedTheme)
    root.style.setProperty(toCssVariableName(color.id), value)
  }
}

/**
 * 获取系统主题
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 从 localStorage 读取保存的主题
  const [themeType, setThemeTypeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEY) as ThemeType) || 'system'
    }
    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'hc'>(() => {
    if (themeType === 'system') return getSystemTheme()
    return themeType
  })

  // 设置主题并持久化
  const setThemeType = (newTheme: ThemeType) => {
    setThemeTypeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme)
    }
  }

  // 初始化加载主题
  useEffect(() => {
    if (themeType === 'system') {
      setResolvedTheme(getSystemTheme())
      loadTheme(getSystemTheme())
    } else {
      setResolvedTheme(themeType)
      loadTheme(themeType)
    }
  }, [])

  // 监听系统主题变化
  useEffect(() => {
    if (themeType !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(newTheme)
      loadTheme(newTheme)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [themeType])

  return (
    <ThemeContext.Provider value={{ themeType, resolvedTheme, setThemeType }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### 2. useTheme Hook (useTheme.ts)

```tsx
import { useContext } from 'react'
import { ThemeContext } from './ThemeProvider'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

### 3. App.tsx 集成

```tsx
import { ThemeProvider } from './theme/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* ... */}
      </BrowserRouter>
    </ThemeProvider>
  )
}
```

## 主题切换流程

1. 用户调用 `setThemeType('dark')`
2. ThemeProvider 更新内部状态
3. 持久化到 localStorage
4. 解析对应的主题类型（system -> light/dark）
5. 调用 `loadTheme()` 更新 DOM
6. 移除旧 class，添加新 class
7. 更新所有 CSS 变量

## 主题 class 与 CSS 变量关系

| 主题 | CSS Class | CSS 变量前缀 |
|-----|----------|-------------|
| light | `.light` | `--ao-*` |
| dark | `.dark` | `--ao-*` |
| hc | `.hc` | `--ao-*` |
