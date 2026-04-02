# 主题系统实现规划

**创建日期：** 2026-04-01  
**状态：** 规划中  
**参考：** VSCode 主题架构 + UX 设计规范主题系统架构

---

## 1. 现状分析

### 1.1 当前样式架构

#### globals.css
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... 16 个颜色变量 */
}

.dark {
  --background: 222.2 84% 4.9%;
  /* ... 16 个颜色变量 */
}
```

**问题：**
- 只有 light/dark 两套主题
- 缺少高对比度主题支持
- 颜色定义分散，缺乏统一注册表
- 无法支持主题继承和颜色变换

#### tailwind.config.js
```js
colors: {
  // 品牌色系统
  brand: { 50-950 },
  // 状态色
  success: { DEFAULT, light, dark },
  warning: { DEFAULT, light, dark },
  error: { DEFAULT, light, dark },
  info: { DEFAULT, light, dark },
  // HSL 变量
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  /* ... */
}
```

**问题：**
- Tailwind 颜色直接引用 HSL CSS 变量
- 无法动态切换，依赖 `.dark` class

### 1.2 硬编码颜色清单

#### button.tsx
```tsx
// 全部使用硬编码 GitHub 暗色主题色
variant: {
  default: "bg-[#238636] text-white hover:bg-[#2EA043] border border-[#238636]",
  destructive: "bg-[#DA3633] text-white hover:bg-[#F85149] border border-[#DA3633]",
  outline: "border border-[#30363D] bg-transparent hover:bg-[#21262D] hover:border-[#484F58] text-[#C9D1D9]",
  secondary: "bg-[#21262D] text-[#C9D1D9] hover:bg-[#30363D] border border-[#30363D]",
  ghost: "hover:bg-[#21262D] hover:text-[#C9D1D9] text-[#C9D1D9]",
  link: "text-[#58A6FF] underline-offset-4 hover:underline",
}
```

#### card.tsx
```tsx
// Card
style={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}

// CardHeader
style={{ borderBottom: '1px solid #21262D' }}

// CardTitle
style={{ color: '#C9D1D9' }}

// CardDescription
style={{ color: '#8B949E' }}

// CardFooter
style={{ borderTop: '1px solid #21262D' }}
```

#### TopBar.tsx
```tsx
// 背景
style={{ backgroundColor: '#1C2128' }}

// 菜单 Trigger
style={{ color: '#C9D1D9' }}

// 菜单 Content
style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}

// 菜单 Item
style={{ color: '#C9D1D9', backgroundColor: '#161B22' }}

// 菜单 Separator
style={{ backgroundColor: '#30363D' }}

// 危险按钮
style={{ color: '#F85149', backgroundColor: '#161B22' }}
```

#### Sidebar.tsx
```tsx
// 背景
style={{ backgroundColor: '#161B22' }}

// 头部边框
style={{ borderBottom: '1px solid #21262D' }}

// 搜索框
style={{ backgroundColor: '#0D1117', gap: '8px' }}

// 搜索图标
style={{ color: '#8B949E' }}

// 输入文字
style={{ color: '#C9D1D9' }}

// 分类按钮
style={{
  backgroundColor: isActive ? '#21262D' : 'transparent',
  color: hasActiveChild || isActive ? '#FFFFFF' : '#C9D1D9',
}}

// 分类图标
style={{ color: hasActiveChild || isActive ? '#FFFFFF' : '#8B949E' }}

// 激活指示条
style={{ backgroundColor: '#238636' }}

// 次级文字
style={{ color: '#8B949E' }}

// 边框
style={{ borderColor: '#30363D' }}
```

### 1.3 组件迁移优先级

| 优先级 | 组件 | 硬编码数量 | 说明 |
|-------|------|----------|------|
| P0 | button.tsx | 6 个 variant | 核心交互组件 |
| P0 | card.tsx | 5 处 | 通用容器组件 |
| P0 | TopBar.tsx | 50+ 处 | 全局顶部栏 |
| P0 | Sidebar.tsx | 30+ 处 | 全局侧边栏 |
| P1 | ActivityBar.tsx | 待分析 | 全局活动栏 |
| P1 | StatusBar.tsx | 待分析 | 全局状态栏 |
| P1 | 输入框/下拉框等 | 待分析 | 表单组件 |
| P2 | 其他 UI 组件 | 待分析 | 次要组件 |

---

## 2. 目标架构

### 2.1 目录结构

```
src/
├── theme/
│   ├── index.ts                    # 统一导出
│   ├── colorRegistry.ts            # 颜色注册表
│   ├── colorTypes.ts               # 类型定义
│   ├── colorUtils.ts               # 颜色变换工具
│   ├── ThemeProvider.tsx           # React 主题 Provider
│   ├── useTheme.ts                 # useTheme Hook
│   ├── themes/
│   │   ├── index.ts               # 主题导出
│   │   ├── lightModern.ts         # 亮色主题数据
│   │   ├── darkModern.ts          # 暗色主题数据
│   │   └── highContrast.ts        # 高对比度主题数据
│   └── colors/
│       ├── index.ts               # 颜色导出
│       ├── baseColors.ts         # 基础颜色定义
│       ├── buttonColors.ts       # 按钮颜色
│       ├── cardColors.ts         # 卡片颜色
│       ├── inputColors.ts        # 输入框颜色
│       ├── sidebarColors.ts      # 侧边栏颜色
│       ├── topbarColors.ts       # 顶部栏颜色
│       └── ...
```

### 2.2 颜色标识符规范

采用 `{category}.{component}-{state}` 格式：

```typescript
// 基础颜色
foreground
background
border
borderStrong
errorForeground
focusBorder
selectionBackground

// 按钮
button.background
button.foreground
button.hoverBackground
button.border
button.secondaryBackground
button.secondaryForeground
button.dangerBackground
button.dangerForeground

// 卡片
card.background
card.border
card.foreground

// 输入框
input.background
input.foreground
input.border
input.placeholderForeground

// 侧边栏
sidebar.background
sidebar.border
sidebar.foreground
sidebar.activeBackground
sidebar.activeForeground
sidebar.activeIndicator

// 顶部栏
topbar.background
topbar.border
topbar.foreground
topbar.menuItem.foreground
topbar.menuItem.hoverBackground

// 活动栏
activityBar.background
activityBar.foreground
activityBar.activeBorder
activityBar.inactiveForeground
```

### 2.3 主题类型

```typescript
export type ThemeType = 'light' | 'dark' | 'hc' | 'system'
```

| 类型 | 说明 | CSS 类名 |
|-----|------|---------|
| `light` | 亮色主题 | `.light` |
| `dark` | 暗色主题 | `.dark` |
| `hc` | 高对比度主题 | `.hc` |
| `system` | 跟随系统 | 动态切换 |

### 2.4 CSS 变量命名

```typescript
const CSS_VAR_PREFIX = '--ao-'

// 示例
// 'button.background' -> '--ao-button-background'
// 'sidebar.background' -> '--ao-sidebar-background'
```

---

## 3. 实现方案

### 3.1 阶段一：基础架构（P0）

#### Step 1.1: 创建类型定义
```typescript
// src/theme/colorTypes.ts
export type ThemeType = 'light' | 'dark' | 'hc' | 'system'
export type ColorIdentifier = string
export type ColorValue = string | ColorIdentifier | ColorTransform

export interface ColorDefaults {
  light: ColorValue | null
  dark: ColorValue | null
  hc: ColorValue | null
}

export type ColorTransform =
  | { op: 'darken'; value: ColorValue; factor: number }
  | { op: 'lighten'; value: ColorValue; factor: number }
  | { op: 'transparent'; value: ColorValue; factor: number }
  | { op: 'mix'; color: ColorValue; with: ColorValue; ratio?: number }

export interface ColorDefinition {
  id: ColorIdentifier
  description: string
  defaults: ColorDefaults
}

export interface ThemeData {
  id: string
  name: string
  type: 'light' | 'dark' | 'hc'
  extends?: string
  colors: Record<string, string>
}
```

#### Step 1.2: 实现颜色变换工具
```typescript
// src/theme/colorUtils.ts
export function darken(color: string, factor: number): string
export function lighten(color: string, factor: number): string
export function transparent(color: string, factor: number): string
export function mix(color1: string, color2: string, ratio?: number): string
```

#### Step 1.3: 实现颜色注册表
```typescript
// src/theme/colorRegistry.ts
export function registerColor(
  id: ColorIdentifier,
  defaults: ColorDefaults,
  description: string
): ColorIdentifier

export function toCssVariableName(id: ColorIdentifier): string
export function toCssVariable(id: ColorIdentifier): string
export function toCssVariableWithDefault(id: ColorIdentifier, defaultValue: string): string
export function resolveColorValue(value: ColorValue, theme: 'light' | 'dark' | 'hc'): string
export function getAllColors(): ColorDefinition[]
```

#### Step 1.4: 定义基础颜色
```typescript
// src/theme/colors/baseColors.ts
export const foreground = registerColor('foreground', {
  light: '#616161',
  dark: '#CCCCCC',
  hc: '#FFFFFF',
}, 'Overall foreground color')

export const background = registerColor('background', {
  light: '#FFFFFF',
  dark: '#1F1F1E',
  hc: '#000000',
}, 'Overall background color')

// ... 更多基础颜色
```

### 3.2 阶段二：React 集成（P0）

#### Step 2.1: 实现 ThemeProvider
```tsx
// src/theme/ThemeProvider.tsx
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeType, setThemeType] = useState<ThemeType>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'hc'>('dark')

  // 监听系统主题变化
  // 动态加载主题 CSS 变量
  // 注入到 document.documentElement

  return (
    <ThemeContext.Provider value={{ themeType, resolvedTheme, setThemeType }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

#### Step 2.2: 实现 useTheme Hook
```tsx
// src/theme/useTheme.ts
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

// 使用方式
const { resolvedTheme, setThemeType } = useTheme()
```

#### Step 2.3: 更新 App.tsx
```tsx
// src/App.tsx
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

### 3.3 阶段三：组件迁移（P0-P1）

#### Step 3.1: 迁移 Button 组件
```tsx
// src/components/ui/button.tsx
import { toCssVariable } from '@/theme/colorRegistry'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: `
          bg-[var(--ao-button-background)] text-[var(--ao-button-foreground)] 
          hover:bg-[var(--ao-button-hoverBackground)] border border-[var(--ao-button-border)]
        `,
        destructive: `
          bg-[var(--ao-button-dangerBackground)] text-[var(--ao-button-dangerForeground)] 
          hover:bg-[var(--ao-button-dangerHoverBackground)] border border-[var(--ao-button-dangerBorder)]
        `,
        outline: `
          border border-[var(--ao-button-outlineBorder)] bg-transparent 
          hover:bg-[var(--ao-button-outlineHoverBackground)] 
          hover:border-[var(--ao-button-outlineHoverBorder)] 
          text-[var(--ao-button-outlineForeground)]
        `,
        secondary: `
          bg-[var(--ao-button-secondaryBackground)] text-[var(--ao-button-secondaryForeground)] 
          hover:bg-[var(--ao-button-secondaryHoverBackground)] border border-[var(--ao-button-secondaryBorder)]
        `,
        ghost: `
          hover:bg-[var(--ao-button-ghostHoverBackground)] text-[var(--ao-button-ghostForeground)]
        `,
        link: `text-[var(--ao-button-linkForeground)] underline-offset-4 hover:underline`,
      },
      // ...
    },
  }
)
```

#### Step 3.2: 迁移 Card 组件
```tsx
// src/components/ui/card.tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg shadow-sm", className)}
      style={{
        backgroundColor: 'var(--ao-card-background)',
        border: '1px solid var(--ao-card-border)',
      }}
      {...props}
    />
  )
)

// 其他子组件类似...
```

#### Step 3.3: 迁移 TopBar 和 Sidebar
- 大量硬编码颜色需要替换为 CSS 变量
- 建议分批次迁移，每次只修改少量组件

### 3.4 阶段四：预设主题定义（P1）

#### Step 4.1: 定义暗色主题
```typescript
// src/theme/themes/darkModern.ts
export const darkModernTheme: ThemeData = {
  id: 'darkModern',
  name: 'Dark Modern',
  type: 'dark',
  colors: {
    // 基础颜色
    foreground: '#CCCCCC',
    background: '#1F1F1E',
    border: '#3C3C3C',
    
    // 按钮
    'button.background': '#238636',
    'button.hoverBackground': '#2EA043',
    'button.foreground': '#FFFFFF',
    'button.border': '#238636',
    
    // 侧边栏
    'sidebar.background': '#161B22',
    'sidebar.border': '#21262D',
    'sidebar.foreground': '#C9D1D9',
    
    // 顶部栏
    'topbar.background': '#1C2128',
    'topbar.foreground': '#C9D1D9',
    
    // ... 更多颜色
  },
}
```

#### Step 4.2: 定义亮色主题
```typescript
// src/theme/themes/lightModern.ts
export const lightModernTheme: ThemeData = {
  id: 'lightModern',
  name: 'Light Modern',
  type: 'light',
  colors: {
    foreground: '#333333',
    background: '#FFFFFF',
    border: '#E0E0E0',
    // ...
  },
}
```

#### Step 4.3: 定义高对比度主题
```typescript
// src/theme/themes/highContrast.ts
export const highContrastTheme: ThemeData = {
  id: 'highContrast',
  name: 'High Contrast',
  type: 'hc',
  colors: {
    foreground: '#FFFFFF',
    background: '#000000',
    border: '#FFFFFF',
    // ...
  },
}
```

---

## 4. 迁移清单

### 4.1 P0 优先级（必须迁移）

| 文件 | 硬编码数量 | 迁移状态 |
|-----|----------|---------|
| `src/components/ui/button.tsx` | 6 variant | 待迁移 |
| `src/components/ui/card.tsx` | 5 处 | 待迁移 |
| `src/components/common/TopBar.tsx` | 50+ 处 | 待迁移 |
| `src/components/common/Sidebar.tsx` | 30+ 处 | 待迁移 |

### 4.2 P1 优先级（建议迁移）

| 文件 | 硬编码数量 | 迁移状态 |
|-----|----------|---------|
| `src/components/common/ActivityBar.tsx` | 待统计 | 待分析 |
| `src/components/common/StatusBar.tsx` | 待统计 | 待分析 |
| `src/components/ui/input.tsx` | 待统计 | 待分析 |
| `src/components/ui/dialog.tsx` | 待统计 | 待分析 |
| `src/components/ui/dropdown-menu.tsx` | 待统计 | 待分析 |

### 4.3 P2 优先级（可选迁移）

其他 UI 组件和业务组件。

---

## 5. 风险与注意事项

### 5.1 兼容性风险

1. **Tailwind 与 CSS 变量混用**
   - 当前使用 `bg-[#hex]` 的组件需要迁移到 CSS 变量
   - 需要确保 CSS 变量在 Tailwind 构建时被正确处理

2. **内联样式与 CSS 类冲突**
   - 部分组件使用 `style={}` 内联样式
   - 需要统一迁移策略，避免样式冲突

### 5.2 性能考虑

1. **主题切换性能**
   - 使用 `element.style.setProperty()` 动态设置
   - 避免全量重新渲染

2. **CSS 变量注入**
   - 首次加载时注入所有颜色变量
   - 主题切换时只更新变化的部分

### 5.3 测试策略

1. **手动测试**
   - 亮色/暗色/高对比度主题切换
   - 各组件在不同主题下的显示效果

2. **自动化测试**
   - 主题切换功能测试
   - CSS 变量注入验证

---

## 6. 实现时间估算

| 阶段 | 任务 | 预估时间 |
|-----|------|---------|
| 1 | 基础架构（类型、工具、注册表） | 2-3 小时 |
| 2 | React 集成（Provider、Hook） | 1-2 小时 |
| 3 | 基础颜色定义 | 1-2 小时 |
| 4 | Button 组件迁移 | 1 小时 |
| 5 | Card 组件迁移 | 1 小时 |
| 6 | TopBar 组件迁移 | 2-3 小时 |
| 7 | Sidebar 组件迁移 | 2-3 小时 |
| 8 | 预设主题定义 | 2 小时 |
| 9 | 其他组件迁移 | 待定 |

**总计 P0 阶段：约 12-16 小时**

---

## 7. 下一步行动

### 立即执行

1. 创建 `src/theme/` 目录结构
2. 实现 `colorTypes.ts` 类型定义
3. 实现 `colorUtils.ts` 颜色变换工具
4. 实现 `colorRegistry.ts` 颜色注册表

### 后续步骤

5. 定义基础颜色到 `baseColors.ts`
6. 实现 `ThemeProvider.tsx` 和 `useTheme.ts`
7. 迁移 Button 组件
8. 迁移 Card 组件
9. 迁移 TopBar 组件
10. 迁移 Sidebar 组件

---

## 附录：当前硬编码颜色汇总

### GitHub Dark 主题色板

| 用途 | 颜色 |
|-----|------|
| 背景（深） | `#0D1117` |
| 背景 | `#161B22` |
| 背景（浅） | `#1C2128` |
| 边框（深） | `#21262D` |
| 边框 | `#30363D` |
| 边框（亮） | `#484F58` |
| 主文字 | `#C9D1D9` |
| 次级文字 | `#8B949E` |
| 激活文字 | `#FFFFFF` |
| 成功色 | `#238636` |
| 成功色（亮） | `#2EA043` |
| 危险色 | `#F85149` |
| 危险色（深） | `#DA3633` |
| 链接色 | `#58A6FF` |
