# Specification: 主题系统基础架构

## 需求来源

### PRD 需求
- FR1-FR6: 桌面端 UI 基本框架

### 架构约束
- 技术栈：React + TypeScript + Tailwind CSS
- 组件库：Shadcn/ui
- 样式系统：Tailwind CSS + CSS 变量

### UX 规范
- 主题系统架构参考 VSCode 设计
- 颜色标识符采用 `{category}.{component}-{state}` 格式
- CSS 变量前缀为 `--ao-`

## 功能规格

### 类型定义

#### ThemeType
```typescript
type ThemeType = 'light' | 'dark' | 'hc' | 'system'
```
| 值 | 说明 |
|---|------|
| light | 亮色主题 |
| dark | 暗色主题 |
| hc | 高对比度主题 |
| system | 跟随系统设置 |

#### ColorIdentifier
```typescript
type ColorIdentifier = string
```
颜色标识符格式：`{category}.{component}-{state}`

#### ColorDefaults
```typescript
interface ColorDefaults {
  light: ColorValue | null
  dark: ColorValue | null
  hc: ColorValue | null
}
```
每个颜色必须定义三种主题下的值。

### 颜色变换函数

#### darken(color, factor)
- **输入**: hex 颜色字符串, 变暗系数 (0-1)
- **输出**: 变暗后的 hex 颜色
- **示例**: `darken('#FFFFFF', 0.2)` -> `#CCCCCC`

#### lighten(color, factor)
- **输入**: hex 颜色字符串, 变亮系数 (0-1)
- **输出**: 变亮后的 hex 颜色
- **示例**: `lighten('#000000', 0.2)` -> `#333333`

#### transparent(color, factor)
- **输入**: hex 颜色字符串, 透明系数 (0-1)
- **输出**: 带透明度的 hex 颜色（追加 alpha）
- **示例**: `transparent('#0078D4', 0.5)` -> `#0078D480`

#### mix(color1, color2, ratio?)
- **输入**: 两个 hex 颜色, 混合比例 (默认 0.5)
- **输出**: 混合后的 hex 颜色
- **示例**: `mix('#000000', '#FFFFFF', 0.5)` -> `#7F7F7F`

### 颜色注册表

#### registerColor(id, defaults, description)
- **输入**: 颜色 ID, 默认值, 描述
- **输出**: 颜色 ID
- **行为**: 将颜色注册到全局注册表

#### toCssVariableName(id)
- **输入**: 颜色 ID (`button.background`)
- **输出**: CSS 变量名 (`--ao-button-background`)

#### toCssVariable(id)
- **输入**: 颜色 ID
- **输出**: CSS 变量 (`var(--ao-button-background)`)

#### resolveColorValue(value, theme)
- **输入**: 颜色值, 主题类型
- **输出**: 解析后的 hex 颜色

## 基础颜色定义

| 颜色 ID | light | dark | hc | 描述 |
|---------|-------|------|-----|------|
| foreground | #616161 | #CCCCCC | #FFFFFF | 主文字颜色 |
| background | #FFFFFF | #1F1F1E | #000000 | 主背景颜色 |
| border | #C8C8C8 | #3C3C3C | #6FC3DF | 边框颜色 |
| errorForeground | #A1260D | #F48771 | #F48771 | 错误文字颜色 |
| focusBorder | #0078D4 | #0078D4 | #F38518 | 焦点边框颜色 |

## 边界条件

1. **无效颜色格式**: 传入非 hex 格式时返回原值
2. **超出范围系数**: 系数超出 0-1 范围时自动截断
3. **空颜色 ID**: 抛出错误

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 无效 hex 格式 | 抛出 TypeError |
| 颜色 ID 为空 | 抛出 Error |
| 注册已存在的颜色 ID | 覆盖已有定义 |
