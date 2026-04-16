/**
 * Workbench Colors
 *
 * Color definitions for the workbench/editor area.
 */

import { registerColor } from '../colorRegistry'

export const workbenchBackground = registerColor('workbench.background', {
  light: '#FFFFFF',
  dark: '#0F1419',
  hc: '#000000',
}, 'Workbench main background color')

export const workbenchForeground = registerColor('workbench.foreground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Workbench primary foreground color')

export const workbenchSecondaryForeground = registerColor('workbench.secondaryForeground', {
  light: '#666666',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Workbench secondary/muted foreground color')
