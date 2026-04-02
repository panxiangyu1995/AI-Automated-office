# Design: 主题系统预设主题

## 技术方案

### 主题数据接口

```typescript
interface ThemeData {
  id: string
  name: string
  type: 'light' | 'dark' | 'hc'
  extends?: string
  colors: Record<string, string>
}
```

### 1. 亮色主题 (themes/lightModern.ts)

```typescript
import type { ThemeData } from '../colorTypes'

export const lightModernTheme: ThemeData = {
  id: 'lightModern',
  name: 'Light Modern',
  type: 'light',
  colors: {
    // 基础颜色
    foreground: '#333333',
    background: '#FFFFFF',
    border: '#E0E0E0',
    errorForeground: '#CC0000',
    focusBorder: '#0066CC',

    // 按钮
    'button.background': '#238636',
    'button.hoverBackground': '#2EA043',
    'button.foreground': '#FFFFFF',
    'button.border': '#238636',
    'button.dangerBackground': '#CC0000',
    'button.dangerForeground': '#FFFFFF',
    'button.outlineBorder': '#C8C8C8',
    'button.outlineForeground': '#333333',
    'button.secondaryBackground': '#F5F5F5',
    'button.secondaryForeground': '#333333',
    'button.ghostForeground': '#333333',
    'button.linkForeground': '#0066CC',

    // 卡片
    'card.background': '#FFFFFF',
    'card.border': '#E0E0E0',
    'card.foreground': '#333333',
    'card.headerBorder': '#E0E0E0',
    'card.footerBorder': '#E0E0E0',

    // 侧边栏
    'sidebar.background': '#F5F5F5',
    'sidebar.border': '#E0E0E0',
    'sidebar.foreground': '#333333',
    'sidebar.searchBackground': '#FFFFFF',
    'sidebar.activeBackground': '#E8E8E8',
    'sidebar.activeIndicator': '#238636',
    'sidebar.sectionTitle': '#666666',
    'sidebar.secondaryForeground': '#666666',

    // 顶部栏
    'topbar.background': '#F5F5F5',
    'topbar.menuBackground': '#FFFFFF',
    'topbar.menuBorder': '#E0E0E0',
    'topbar.menuItemText': '#333333',
    'topbar.menuSeparator': '#E0E0E0',
    'topbar.dangerForeground': '#CC0000',
  },
}
```

### 2. 暗色主题 (themes/darkModern.ts)

```typescript
import type { ThemeData } from '../colorTypes'

export const darkModernTheme: ThemeData = {
  id: 'darkModern',
  name: 'Dark Modern',
  type: 'dark',
  colors: {
    // 基础颜色
    foreground: '#CCCCCC',
    background: '#1F1F1E',
    border: '#3C3C3C',
    errorForeground: '#F85149',
    focusBorder: '#0078D4',

    // 按钮
    'button.background': '#238636',
    'button.hoverBackground': '#2EA043',
    'button.foreground': '#FFFFFF',
    'button.border': '#238636',
    'button.dangerBackground': '#DA3633',
    'button.dangerForeground': '#FFFFFF',
    'button.outlineBorder': '#30363D',
    'button.outlineForeground': '#C9D1D9',
    'button.secondaryBackground': '#21262D',
    'button.secondaryForeground': '#C9D1D9',
    'button.ghostForeground': '#C9D1D9',
    'button.linkForeground': '#58A6FF',

    // 卡片
    'card.background': '#161B22',
    'card.border': '#30363D',
    'card.foreground': '#C9D1D9',
    'card.headerBorder': '#21262D',
    'card.footerBorder': '#21262D',

    // 侧边栏
    'sidebar.background': '#161B22',
    'sidebar.border': '#21262D',
    'sidebar.foreground': '#C9D1D9',
    'sidebar.searchBackground': '#0D1117',
    'sidebar.activeBackground': '#21262D',
    'sidebar.activeIndicator': '#238636',
    'sidebar.sectionTitle': '#8B949E',
    'sidebar.secondaryForeground': '#8B949E',

    // 顶部栏
    'topbar.background': '#1C2128',
    'topbar.menuBackground': '#161B22',
    'topbar.menuBorder': '#30363D',
    'topbar.menuItemText': '#C9D1D9',
    'topbar.menuSeparator': '#30363D',
    'topbar.dangerForeground': '#F85149',
  },
}
```

### 3. 高对比度主题 (themes/highContrast.ts)

```typescript
import type { ThemeData } from '../colorTypes'

export const highContrastTheme: ThemeData = {
  id: 'highContrast',
  name: 'High Contrast',
  type: 'hc',
  colors: {
    // 基础颜色
    foreground: '#FFFFFF',
    background: '#000000',
    border: '#FFFFFF',
    errorForeground: '#FF0000',
    focusBorder: '#FFFFFF',

    // 按钮
    'button.background': '#238636',
    'button.hoverBackground': '#2EA043',
    'button.foreground': '#FFFFFF',
    'button.border': '#238636',
    'button.dangerBackground': '#CC0000',
    'button.dangerForeground': '#FFFFFF',
    'button.outlineBorder': '#FFFFFF',
    'button.outlineForeground': '#FFFFFF',
    'button.secondaryBackground': '#1A1A1A',
    'button.secondaryForeground': '#FFFFFF',
    'button.ghostForeground': '#FFFFFF',
    'button.linkForeground': '#58A6FF',

    // 卡片
    'card.background': '#000000',
    'card.border': '#FFFFFF',
    'card.foreground': '#FFFFFF',
    'card.headerBorder': '#FFFFFF',
    'card.footerBorder': '#FFFFFF',

    // 侧边栏
    'sidebar.background': '#000000',
    'sidebar.border': '#FFFFFF',
    'sidebar.foreground': '#FFFFFF',
    'sidebar.searchBackground': '#000000',
    'sidebar.activeBackground': '#1A1A1A',
    'sidebar.activeIndicator': '#FFFFFF',
    'sidebar.sectionTitle': '#FFFFFF',
    'sidebar.secondaryForeground': '#FFFFFF',

    // 顶部栏
    'topbar.background': '#000000',
    'topbar.menuBackground': '#000000',
    'topbar.menuBorder': '#FFFFFF',
    'topbar.menuItemText': '#FFFFFF',
    'topbar.menuSeparator': '#FFFFFF',
    'topbar.dangerForeground': '#FF0000',
  },
}
```

### 4. 主题导出 (themes/index.ts)

```typescript
export { lightModernTheme } from './lightModern'
export { darkModernTheme } from './darkModern'
export { highContrastTheme } from './highContrast'

export type { ThemeData } from '../colorTypes'
```

## 主题加载流程

1. ThemeProvider 初始化
2. 根据 themeType 确定加载哪个主题
3. 遍历主题的 colors 对象
4. 调用 element.style.setProperty 设置每个 CSS 变量
