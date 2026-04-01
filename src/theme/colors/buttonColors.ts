/**
 * Button Colors
 * 
 * Color definitions for button component variants.
 * Based on GitHub's button styling.
 */

import { registerColor } from '../colorRegistry'

// Default button
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

// Danger button
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

export const buttonDangerBorder = registerColor('button.dangerBorder', {
  light: '#DA3633',
  dark: '#DA3633',
  hc: '#DA3633',
}, 'Danger button border color')

// Outline button
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

// Secondary button
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

// Ghost button
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

// Link button
export const buttonLinkForeground = registerColor('button.linkForeground', {
  light: '#0066CC',
  dark: '#58A6FF',
  hc: '#58A6FF',
}, 'Link button foreground color')
