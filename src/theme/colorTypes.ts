/**
 * Theme System Type Definitions
 * 
 * Provides type definitions for the color registry and theme system.
 */

/**
 * Theme type supported by the application
 */
export type ThemeType = 'light' | 'dark' | 'hc' | 'system'

/**
 * Color identifier format: {category}.{component}-{state}
 * @example 'button.background', 'sidebar.activeBackground'
 */
export type ColorIdentifier = string

/**
 * Color value can be:
 * - A hex color string
 * - A reference to another color identifier
 * - A color transform operation
 */
export type ColorValue = string | ColorIdentifier | ColorTransform

/**
 * Color defaults for different theme types
 */
export interface ColorDefaults {
  light: ColorValue | null
  dark: ColorValue | null
  hc: ColorValue | null
}

/**
 * Color transform operations
 */
export type ColorTransform =
  | { op: 'darken'; value: ColorValue; factor: number }
  | { op: 'lighten'; value: ColorValue; factor: number }
  | { op: 'transparent'; value: ColorValue; factor: number }
  | { op: 'mix'; color: ColorValue; with: ColorValue; ratio?: number }

/**
 * Represents a registered color definition
 */
export interface ColorDefinition {
  id: ColorIdentifier
  description: string
  defaults: ColorDefaults
}

/**
 * Theme data structure for preset themes
 */
export interface ThemeData {
  id: string
  name: string
  type: 'light' | 'dark' | 'hc'
  extends?: string
  colors: Record<string, string>
}

/**
 * Theme context value provided by ThemeProvider
 */
export interface ThemeContextValue {
  themeType: ThemeType
  resolvedTheme: 'light' | 'dark' | 'hc'
  setThemeType: (theme: ThemeType) => void
}
