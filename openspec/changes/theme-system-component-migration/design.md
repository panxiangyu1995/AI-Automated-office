# Design: 主题系统组件迁移

## 技术方案

### 1. 颜色定义

#### 按钮颜色 (colors/buttonColors.ts)

```typescript
import { registerColor } from '../colorRegistry'

// 默认按钮
export const buttonBackground = registerColor('button.background', {
  light: '#238636',
  dark: '#238636',
  hc: '#238636',
}, 'Button background color')

export const buttonHoverBackground = registerColor('button.hoverBackground', {
  light: '#2EA043',
  dark: '#2EA043',
  hc: '#2EA043',
}, 'Button hover background color')

export const buttonForeground = registerColor('button.foreground', {
  light: '#FFFFFF',
  dark: '#FFFFFF',
  hc: '#FFFFFF',
}, 'Button foreground color')

export const buttonBorder = registerColor('button.border', {
  light: '#238636',
  dark: '#238636',
  hc: '#238636',
}, 'Button border color')

// 危险按钮
export const buttonDangerBackground = registerColor('button.dangerBackground', {
  light: '#DA3633',
  dark: '#DA3633',
  hc: '#DA3633',
}, 'Danger button background color')

export const buttonDangerHoverBackground = registerColor('button.dangerHoverBackground', {
  light: '#F85149',
  dark: '#F85149',
  hc: '#F85149',
}, 'Danger button hover background color')

export const buttonDangerForeground = registerColor('button.dangerForeground', {
  light: '#FFFFFF',
  dark: '#FFFFFF',
  hc: '#FFFFFF',
}, 'Danger button foreground color')

// 轮廓按钮
export const buttonOutlineBorder = registerColor('button.outlineBorder', {
  light: '#C8C8C8',
  dark: '#30363D',
  hc: '#6FC3DF',
}, 'Outline button border color')

export const buttonOutlineHoverBackground = registerColor('button.outlineHoverBackground', {
  light: '#F5F5F5',
  dark: '#21262D',
  hc: '#1A1A1A',
}, 'Outline button hover background color')

export const buttonOutlineHoverBorder = registerColor('button.outlineHoverBorder', {
  light: '#A8A8A8',
  dark: '#484F58',
  hc: '#FFFFFF',
}, 'Outline button hover border color')

export const buttonOutlineForeground = registerColor('button.outlineForeground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Outline button foreground color')

// 次级按钮
export const buttonSecondaryBackground = registerColor('button.secondaryBackground', {
  light: '#F5F5F5',
  dark: '#21262D',
  hc: '#1A1A1A',
}, 'Secondary button background color')

export const buttonSecondaryHoverBackground = registerColor('button.secondaryHoverBackground', {
  light: '#E8E8E8',
  dark: '#30363D',
  hc: '#2A2A2A',
}, 'Secondary button hover background color')

export const buttonSecondaryForeground = registerColor('button.secondaryForeground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Secondary button foreground color')

export const buttonSecondaryBorder = registerColor('button.secondaryBorder', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#6FC3DF',
}, 'Secondary button border color')

// 幽灵按钮
export const buttonGhostHoverBackground = registerColor('button.ghostHoverBackground', {
  light: '#F5F5F5',
  dark: '#21262D',
  hc: '#1A1A1A',
}, 'Ghost button hover background color')

export const buttonGhostForeground = registerColor('button.ghostForeground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Ghost button foreground color')

// 链接按钮
export const buttonLinkForeground = registerColor('button.linkForeground', {
  light: '#0066CC',
  dark: '#58A6FF',
  hc: '#58A6FF',
}, 'Link button foreground color')
```

#### 卡片颜色 (colors/cardColors.ts)

```typescript
import { registerColor } from '../colorRegistry'

export const cardBackground = registerColor('card.background', {
  light: '#FFFFFF',
  dark: '#161B22',
  hc: '#000000',
}, 'Card background color')

export const cardBorder = registerColor('card.border', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#FFFFFF',
}, 'Card border color')

export const cardForeground = registerColor('card.foreground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Card foreground color')

export const cardHeaderBorder = registerColor('card.headerBorder', {
  light: '#E0E0E0',
  dark: '#21262D',
  hc: '#FFFFFF',
}, 'Card header border color')

export const cardFooterBorder = registerColor('card.footerBorder', {
  light: '#E0E0E0',
  dark: '#21262D',
  hc: '#FFFFFF',
}, 'Card footer border color')
```

#### 侧边栏颜色 (colors/sidebarColors.ts)

```typescript
import { registerColor } from '../colorRegistry'

export const sidebarBackground = registerColor('sidebar.background', {
  light: '#F5F5F5',
  dark: '#161B22',
  hc: '#000000',
}, 'Sidebar background color')

export const sidebarBorder = registerColor('sidebar.border', {
  light: '#E0E0E0',
  dark: '#21262D',
  hc: '#FFFFFF',
}, 'Sidebar border color')

export const sidebarForeground = registerColor('sidebar.foreground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Sidebar foreground color')

export const sidebarHeaderBorder = registerColor('sidebar.headerBorder', {
  light: '#E0E0E0',
  dark: '#21262D',
  hc: '#FFFFFF',
}, 'Sidebar header border color')

export const sidebarSearchBackground = registerColor('sidebar.searchBackground', {
  light: '#FFFFFF',
  dark: '#0D1117',
  hc: '#000000',
}, 'Sidebar search background color')

export const sidebarSearchIcon = registerColor('sidebar.searchIcon', {
  light: '#666666',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Sidebar search icon color')

export const sidebarSectionTitle = registerColor('sidebar.sectionTitle', {
  light: '#666666',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Sidebar section title color')

export const sidebarActiveBackground = registerColor('sidebar.activeBackground', {
  light: '#E8E8E8',
  dark: '#21262D',
  hc: '#1A1A1A',
}, 'Sidebar active item background')

export const sidebarActiveForeground = registerColor('sidebar.activeForeground', {
  light: '#000000',
  dark: '#FFFFFF',
  hc: '#FFFFFF',
}, 'Sidebar active item foreground')

export const sidebarActiveIndicator = registerColor('sidebar.activeIndicator', {
  light: '#238636',
  dark: '#238636',
  hc: '#FFFFFF',
}, 'Sidebar active indicator color')

export const sidebarSecondaryForeground = registerColor('sidebar.secondaryForeground', {
  light: '#666666',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Sidebar secondary foreground color')

export const sidebarBadgeBorder = registerColor('sidebar.badgeBorder', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#FFFFFF',
}, 'Sidebar badge border color')

export const sidebarBadgeForeground = registerColor('sidebar.badgeForeground', {
  light: '#666666',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Sidebar badge foreground color')
```

#### 顶部栏颜色 (colors/topbarColors.ts)

```typescript
import { registerColor } from '../colorRegistry'

export const topbarBackground = registerColor('topbar.background', {
  light: '#F5F5F5',
  dark: '#1C2128',
  hc: '#000000',
}, 'Topbar background color')

export const topbarBorder = registerColor('topbar.border', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#FFFFFF',
}, 'Topbar border color')

export const topbarForeground = registerColor('topbar.foreground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Topbar foreground color')

export const topbarMenuItemForeground = registerColor('topbar.menuItemForeground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Topbar menu item foreground')

export const topbarMenuItemHoverBackground = registerColor('topbar.menuItemHoverBackground', {
  light: '#E8E8E8',
  dark: '#30363D',
  hc: '#1A1A1A',
}, 'Topbar menu item hover background')

export const topbarMenuItemActiveBackground = registerColor('topbar.menuItemActiveBackground', {
  light: '#E8E8E8',
  dark: '#30363D',
  hc: '#1A1A1A',
}, 'Topbar menu item active background')

export const topbarMenuBackground = registerColor('topbar.menuBackground', {
  light: '#FFFFFF',
  dark: '#161B22',
  hc: '#000000',
}, 'Topbar menu background')

export const topbarMenuBorder = registerColor('topbar.menuBorder', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#FFFFFF',
}, 'Topbar menu border')

export const topbarMenuItemText = registerColor('topbar.menuItemText', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Topbar menu item text')

export const topbarMenuSeparator = registerColor('topbar.menuSeparator', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#FFFFFF',
}, 'Topbar menu separator')

export const topbarDangerForeground = registerColor('topbar.dangerForeground', {
  light: '#CC0000',
  dark: '#F85149',
  hc: '#FF0000',
}, 'Topbar danger foreground')
```

### 2. 组件迁移示例

#### Button 组件迁移

**Before:**
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#238636] text-white hover:bg-[#2EA043] border border-[#238636]",
        destructive: "bg-[#DA3633] text-white hover:bg-[#F85149] border border-[#DA3633]",
        outline: "border border-[#30363D] bg-transparent hover:bg-[#21262D] hover:border-[#484F58] text-[#C9D1D9]",
        secondary: "bg-[#21262D] text-[#C9D1D9] hover:bg-[#30363D] border border-[#30363D]",
        ghost: "hover:bg-[#21262D] hover:text-[#C9D1D9] text-[#C9D1D9]",
        link: "text-[#58A6FF] underline-offset-4 hover:underline",
      },
    },
  }
)
```

**After:**
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--ao-button-background)] text-[var(--ao-button-foreground)] hover:bg-[var(--ao-button-hoverBackground)] border border-[var(--ao-button-border)]",
        destructive: "bg-[var(--ao-button-dangerBackground)] text-[var(--ao-button-dangerForeground)] hover:bg-[var(--ao-button-dangerHoverBackground)] border border-[var(--ao-button-dangerBorder)]",
        outline: "border border-[var(--ao-button-outlineBorder)] bg-transparent hover:bg-[var(--ao-button-outlineHoverBackground)] hover:border-[var(--ao-button-outlineHoverBorder)] text-[var(--ao-button-outlineForeground)]",
        secondary: "bg-[var(--ao-button-secondaryBackground)] text-[var(--ao-button-secondaryForeground)] hover:bg-[var(--ao-button-secondaryHoverBackground)] border border-[var(--ao-button-secondaryBorder)]",
        ghost: "hover:bg-[var(--ao-button-ghostHoverBackground)] text-[var(--ao-button-ghostForeground)]",
        link: "text-[var(--ao-button-linkForeground)] underline-offset-4 hover:underline",
      },
    },
  }
)
```

#### Card 组件迁移

**Before:**
```tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg shadow-sm", className)}
      style={{
        backgroundColor: '#161B22',
        border: '1px solid #30363D',
      }}
      {...props}
    />
  )
)
```

**After:**
```tsx
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
```

### 3. 迁移检查清单

| 组件 | 硬编码数量 | 迁移状态 |
|-----|----------|---------|
| button.tsx | 6 variant | 待迁移 |
| card.tsx | 5 处 | 待迁移 |
| TopBar.tsx | 50+ 处 | 待迁移 |
| Sidebar.tsx | 30+ 处 | 待迁移 |
