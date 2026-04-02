# Specification: 主题系统组件迁移

## 需求来源

### PRD 需求
- FR1-FR6: 桌面端 UI 基本框架

### 架构约束
- 技术栈：React + TypeScript + Tailwind CSS
- 组件库：Shadcn/ui
- 样式系统：Tailwind CSS + CSS 变量

### UX 规范
- 主题切换应即时生效
- 组件样式保持一致

## 功能规格

### 按钮颜色定义

| 颜色 ID | light | dark | hc | 描述 |
|---------|-------|------|-----|------|
| button.background | #238636 | #238636 | #238636 | 默认按钮背景 |
| button.hoverBackground | #2EA043 | #2EA043 | #2EA043 | 默认按钮悬停背景 |
| button.foreground | #FFFFFF | #FFFFFF | #FFFFFF | 默认按钮文字 |
| button.border | #238636 | #238636 | #238636 | 默认按钮边框 |
| button.dangerBackground | #DA3633 | #DA3633 | #DA3633 | 危险按钮背景 |
| button.dangerForeground | #FFFFFF | #FFFFFF | #FFFFFF | 危险按钮文字 |
| button.outlineBorder | #C8C8C8 | #30363D | #6FC3DF | 轮廓按钮边框 |
| button.outlineForeground | #333333 | #C9D1D9 | #FFFFFF | 轮廓按钮文字 |
| button.secondaryBackground | #F5F5F5 | #21262D | #1A1A1A | 次级按钮背景 |
| button.secondaryForeground | #333333 | #C9D1D9 | #FFFFFF | 次级按钮文字 |
| button.ghostForeground | #333333 | #C9D1D9 | #FFFFFF | 幽灵按钮文字 |
| button.linkForeground | #0066CC | #58A6FF | #58A6FF | 链接按钮文字 |

### 卡片颜色定义

| 颜色 ID | light | dark | hc | 描述 |
|---------|-------|------|-----|------|
| card.background | #FFFFFF | #161B22 | #000000 | 卡片背景 |
| card.border | #E0E0E0 | #30363D | #FFFFFF | 卡片边框 |
| card.foreground | #333333 | #C9D1D9 | #FFFFFF | 卡片文字 |

### 侧边栏颜色定义

| 颜色 ID | light | dark | hc | 描述 |
|---------|-------|------|-----|------|
| sidebar.background | #F5F5F5 | #161B22 | #000000 | 侧边栏背景 |
| sidebar.border | #E0E0E0 | #21262D | #FFFFFF | 侧边栏边框 |
| sidebar.foreground | #333333 | #C9D1D9 | #FFFFFF | 侧边栏文字 |
| sidebar.searchBackground | #FFFFFF | #0D1117 | #000000 | 搜索框背景 |
| sidebar.activeBackground | #E8E8E8 | #21262D | #1A1A1A | 激活项背景 |
| sidebar.activeIndicator | #238636 | #238636 | #FFFFFF | 激活指示条 |

### 顶部栏颜色定义

| 颜色 ID | light | dark | hc | 描述 |
|---------|-------|------|-----|------|
| topbar.background | #F5F5F5 | #1C2128 | #000000 | 顶部栏背景 |
| topbar.menuBackground | #FFFFFF | #161B22 | #000000 | 菜单背景 |
| topbar.menuBorder | #E0E0E0 | #30363D | #FFFFFF | 菜单边框 |
| topbar.menuItemText | #333333 | #C9D1D9 | #FFFFFF | 菜单项文字 |
| topbar.menuSeparator | #E0E0E0 | #30363D | #FFFFFF | 菜单分隔线 |
| topbar.dangerForeground | #CC0000 | #F85149 | #FF0000 | 危险操作文字 |

## 迁移规则

### CSS 变量使用规范

**在 CVA (class-variance-authority) 中使用:**
```tsx
variant: {
  default: "bg-[var(--ao-button-background)] text-[var(--ao-button-foreground)]",
}
```

**在 style 属性中使用:**
```tsx
style={{
  backgroundColor: 'var(--ao-card-background)',
  border: '1px solid var(--ao-card-border)',
}}
```

### 颜色 ID 映射规则

| 当前硬编码 | CSS 变量 |
|-----------|---------|
| #161B22 | var(--ao-sidebar-background) |
| #1C2128 | var(--ao-topbar-background) |
| #21262D | var(--ao-sidebar-activeBackground) |
| #30363D | var(--ao-button-outlineBorder) |
| #C9D1D9 | var(--ao-sidebar-foreground) |
| #8B949E | var(--ao-sidebar-secondaryForeground) |
| #FFFFFF | var(--ao-button-foreground) |
| #238636 | var(--ao-button-background) |
| #2EA043 | var(--ao-button-hoverBackground) |
| #F85149 | var(--ao-topbar-dangerForeground) |
| #58A6FF | var(--ao-button-linkForeground) |
| #0D1117 | var(--ao-sidebar-searchBackground) |

## 边界条件

1. **组件未定义的颜色**: 使用 fallback 到基础颜色
2. **部分 variant 缺失**: 使用 default 值作为 fallback
3. **CSS 变量未定义**: 浏览器使用默认值（通常为初始值）

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| CSS 变量未注册 | 浏览器忽略，组件可能显示异常 |
| 颜色值格式错误 | 保持原硬编码值，不影响功能 |
