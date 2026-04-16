/**
 * Base Colors
 * 
 * Defines foundational UI colors that are used across the entire application.
 * Based on VSCode's color registry pattern.
 */

import { registerColor } from '../colorRegistry'

// ============================================
// Basic Colors
// ============================================

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

export const warningForeground = registerColor('warningForeground', {
  light: '#BF8803',
  dark: '#CCA700',
  hc: '#CCA700',
}, 'Foreground color for warning messages')

export const infoForeground = registerColor('infoForeground', {
  light: '#0068BF',
  dark: '#4FC1FF',
  hc: '#4FC1FF',
}, 'Foreground color for informational messages')

export const successForeground = registerColor('successForeground', {
  light: '#107C10',
  dark: '#89D185',
  hc: '#89D185',
}, 'Foreground color for success messages')

// ============================================
// Focus & Selection
// ============================================

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

export const selectionHighlightBackground = registerColor('selectionHighlightBackground', {
  light: '#ADD6FF40',
  dark: '#264F7840',
  hc: '#F3851840',
}, 'Background color of selection highlight')

// ============================================
// Borders
// ============================================

export const border = registerColor('border', {
  light: '#C8C8C8',
  dark: '#3C3C3C',
  hc: '#6FC3DF',
}, 'Border color of UI elements')

export const borderStrong = registerColor('borderStrong', {
  light: '#A8A8A8',
  dark: '#6B6B6B',
  hc: '#F38518',
}, 'Stronger border color, used for emphasis')

export const borderDisabled = registerColor('borderDisabled', {
  light: '#C8C8C850',
  dark: '#3C3C3C50',
  hc: '#6FC3DF50',
}, 'Disabled border color')

// ============================================
// Activity Bar
// ============================================
// (Moved to activityBarColors.ts)

// ============================================
// Sidebar
// ============================================
// (Moved to sidebarColors.ts)

// ============================================
// Editor / Workbench
// ============================================

export const editorBackground = registerColor('editor.background', {
  light: '#FFFFFF',
  dark: '#1F1F1E',
  hc: '#000000',
}, 'Editor background color')

export const editorForeground = registerColor('editor.foreground', {
  light: '#616161',
  dark: '#CCCCCC',
  hc: '#FFFFFF',
}, 'Editor foreground color')

export const editorLineHighlightBackground = registerColor('editor.lineHighlightBackground', {
  light: '#F0F0F0',
  dark: '#2A2A2A',
  hc: '#000000',
}, 'Background color of highlighted line')

// ============================================
// Status Bar
// ============================================
// (Moved to statusBarColors.ts)

// ============================================
// Input Controls
// ============================================

export const inputBackground = registerColor('input.background', {
  light: '#FFFFFF',
  dark: '#3C3C3C',
  hc: '#000000',
}, 'Input box background color')

export const inputForeground = registerColor('input.foreground', {
  light: '#616161',
  dark: '#CCCCCC',
  hc: '#FFFFFF',
}, 'Input box foreground color')

export const inputBorder = registerColor('input.border', {
  light: '#C8C8C8',
  dark: '#3C3C3C',
  hc: '#6FC3DF',
}, 'Input box border color')

export const inputFocusBorder = registerColor('input.focusBorder', {
  light: '#0078D4',
  dark: '#0078D4',
  hc: '#F38518',
}, 'Input box focus border color')

// ============================================
// Scrollbar
// ============================================

export const scrollbarSliderBackground = registerColor('scrollbarSlider.background', {
  light: '#C8C8C880',
  dark: '#42424280',
  hc: '#FFFFFF20',
}, 'Scrollbar slider background color')

export const scrollbarSliderHoverBackground = registerColor('scrollbarSlider.hoverBackground', {
  light: '#C8C8C8B0',
  dark: '#686868B0',
  hc: '#FFFFFF40',
}, 'Scrollbar slider hover background color')

export const scrollbarSliderActiveBackground = registerColor('scrollbarSlider.activeBackground', {
  light: '#C8C8C8D0',
  dark: '#909090D0',
  hc: '#FFFFFF60',
}, 'Scrollbar slider active background color')
