# Design: 主题系统基础架构

## 技术方案

### 1. 类型定义 (colorTypes.ts)

```typescript
// 主题类型
export type ThemeType = 'light' | 'dark' | 'hc' | 'system'

// 颜色标识符
export type ColorIdentifier = string

// 颜色值类型
export type ColorValue = string | ColorIdentifier | ColorTransform

// 颜色默认值（针对四种主题类型）
export interface ColorDefaults {
  light: ColorValue | null
  dark: ColorValue | null
  hc: ColorValue | null
}

// 颜色变换类型
export type ColorTransform =
  | { op: 'darken'; value: ColorValue; factor: number }
  | { op: 'lighten'; value: ColorValue; factor: number }
  | { op: 'transparent'; value: ColorValue; factor: number }
  | { op: 'mix'; color: ColorValue; with: ColorValue; ratio?: number }

// 颜色定义接口
export interface ColorDefinition {
  id: ColorIdentifier
  description: string
  defaults: ColorDefaults
}

// 主题数据接口
export interface ThemeData {
  id: string
  name: string
  type: 'light' | 'dark' | 'hc'
  extends?: string
  colors: Record<string, string>
}
```

### 2. 颜色变换工具 (colorUtils.ts)

```typescript
/**
 * 将 hex 颜色转换为 HSL
 */
function hexToHsl(hex: string): [number, number, number]

/**
 * HSL 转 hex
 */
function hslToHex(h: number, s: number, l: number): string

/**
 * 使颜色变暗
 * @param color - 原始颜色（hex格式）
 * @param factor - 变暗系数（0-1）
 */
export function darken(color: string, factor: number): string

/**
 * 使颜色变亮
 * @param color - 原始颜色（hex格式）
 * @param factor - 变亮系数（0-1）
 */
export function lighten(color: string, factor: number): string

/**
 * 调整颜色透明度
 * @param color - 原始颜色（hex格式）
 * @param factor - 透明系数（0-1）
 */
export function transparent(color: string, factor: number): string

/**
 * 混合两种颜色
 * @param color1 - 颜色1
 * @param color2 - 颜色2
 * @param ratio - 混合比例（默认0.5）
 */
export function mix(color1: string, color2: string, ratio?: number): string
```

### 3. 颜色注册表 (colorRegistry.ts)

```typescript
// CSS 变量名前缀
const CSS_VAR_PREFIX = '--ao-'

/**
 * 注册颜色到注册表
 */
export function registerColor(
  id: ColorIdentifier,
  defaults: ColorDefaults,
  description: string
): ColorIdentifier

/**
 * 转换为 CSS 变量名
 * 示例: 'button.background' -> '--ao-button-background'
 */
export function toCssVariableName(id: ColorIdentifier): string

/**
 * 获取 CSS 变量
 * 示例: 'button.background' -> 'var(--ao-button-background)'
 */
export function toCssVariable(id: ColorIdentifier): string

/**
 * 获取带默认值的 CSS 变量
 */
export function toCssVariableWithDefault(id: ColorIdentifier, defaultValue: string): string

/**
 * 根据主题类型解析颜色值
 */
export function resolveColorValue(value: ColorValue, theme: 'light' | 'dark' | 'hc'): string

/**
 * 获取所有已注册的颜色
 */
export function getAllColors(): ColorDefinition[]
```

### 4. 基础颜色定义 (colors/baseColors.ts)

```typescript
import { registerColor } from '../colorRegistry'

// 基础颜色
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

export const errorForeground = registerColor('errorForeground', {
  light: '#A1260D',
  dark: '#F48771',
  hc: '#F48771',
}, 'Foreground color for error messages')

export const focusBorder = registerColor('focusBorder', {
  light: '#0078D4',
  dark: '#0078D4',
  hc: '#F38518',
}, 'Border color of focused elements')

export const selectionBackground = registerColor('selectionBackground', {
  light: '#ADD6FF80',
  dark: '#264F78',
  hc: '#F38518',
}, 'Background color of text selections')

// 边框颜色
export const border = registerColor('border', {
  light: '#C8C8C8',
  dark: '#3C3C3C',
  hc: '#6FC3DF',
}, 'Border color of UI elements')

export const borderStrong = registerColor('borderStrong', {
  light: '#A8A8A8',
  dark: '#6B6B6B',
  hc: '#F38518',
}, 'Stronger border color')
```

## 颜色标识符命名规范

采用 `{category}.{component}-{state}` 格式：

```
foreground                    # 基础颜色
background
border
errorForeground
focusBorder
selectionBackground

button.background            # 按钮
button.foreground
button.hoverBackground
button.border
button.secondaryBackground

card.background             # 卡片
card.border
card.foreground

input.background             # 输入框
input.foreground
input.border

sidebar.background          # 侧边栏
sidebar.foreground
sidebar.border
```

## CSS 变量命名规范

- 前缀: `--ao-`
- 示例: `--ao-button-background`
- 对应 Tailwind: `var(--ao-button-background)`
