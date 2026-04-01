/**
 * Theme System - Unified Export
 * 
 * This module exports all theme system components.
 */

// Types
export type {
  ThemeType,
  ColorIdentifier,
  ColorValue,
  ColorDefaults,
  ColorTransform,
  ColorDefinition,
  ThemeData,
  ThemeContextValue,
} from './colorTypes'

// Color Utilities
export { darken, lighten, transparent, mix } from './colorUtils'

// Color Registry
export {
  registerColor,
  toCssVariableName,
  toCssVariable,
  toCssVariableWithDefault,
  resolveColorValue,
  getAllColors,
  getColorDefinition,
  generateThemeCss,
} from './colorRegistry'

// Base Colors
export * from './colors'
