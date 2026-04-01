/**
 * Color Registry
 * 
 * Centralized color registration system inspired by VSCode's theme system.
 * All colors should be registered here before use.
 */

import type { 
  ColorIdentifier, 
  ColorDefaults, 
  ColorValue, 
  ColorDefinition 
} from './colorTypes'

// CSS variable prefix
const CSS_VAR_PREFIX = '--ao-'

// Internal registry storage
const colorRegistry = new Map<ColorIdentifier, ColorDefinition>()

/**
 * Convert color identifier to CSS variable name
 * @example 'button.background' -> '--ao-button-background'
 */
export function toCssVariableName(id: ColorIdentifier): string {
  return CSS_VAR_PREFIX + id.replace(/\./g, '-')
}

/**
 * Get CSS variable reference
 * @example 'button.background' -> 'var(--ao-button-background)'
 */
export function toCssVariable(id: ColorIdentifier): string {
  return `var(${toCssVariableName(id)})`
}

/**
 * Get CSS variable with fallback
 */
export function toCssVariableWithDefault(id: ColorIdentifier, defaultValue: string): string {
  return `var(${toCssVariableName(id)}, ${defaultValue})`
}

/**
 * Resolve a color value to a hex string
 * Handles color references, transforms, and plain hex values
 */
export function resolveColorValue(value: ColorValue): string {
  if (typeof value === 'string') {
    // Check if it's a color reference
    if (colorRegistry.has(value as ColorIdentifier)) {
      return toCssVariable(value as ColorIdentifier)
    }
    return value
  }
  
  // Color transform - handled during theme application
  // The actual transform is applied when building CSS variables
  if (typeof value === 'object' && 'op' in value) {
    const transform = value as { op: string; value?: ColorValue; color?: ColorValue }
    if (transform.value !== undefined) {
      return toCssVariable(transform.value as ColorIdentifier)
    }
  }
  
  return '#000000'
}

/**
 * Register a color in the registry
 * @returns The registered color identifier
 */
export function registerColor(
  id: ColorIdentifier,
  defaults: ColorDefaults,
  description: string
): ColorIdentifier {
  const definition: ColorDefinition = { id, defaults, description }
  colorRegistry.set(id, definition)
  return id
}

/**
 * Get all registered colors
 */
export function getAllColors(): ColorDefinition[] {
  return Array.from(colorRegistry.values())
}

/**
 * Get a specific color definition
 */
export function getColorDefinition(id: ColorIdentifier): ColorDefinition | undefined {
  return colorRegistry.get(id)
}

/**
 * Generate CSS variables for a specific theme type
 * Returns an object mapping CSS variable names to their values
 */
export function generateThemeCss(
  themeType: 'light' | 'dark' | 'hc'
): Record<string, string> {
  const cssVars: Record<string, string> = {}
  
  for (const [id, definition] of colorRegistry.entries()) {
    const value = definition.defaults[themeType]
    if (value !== null) {
      cssVars[toCssVariableName(id)] = resolveColorValue(value)
    }
  }
  
  return cssVars
}
