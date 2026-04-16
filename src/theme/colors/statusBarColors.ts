/**
 * Status Bar Colors
 *
 * Color definitions for the status bar component.
 */

import { registerColor } from '../colorRegistry'

export const statusBarBackground = registerColor('statusBar.background', {
  light: '#007ACC',
  dark: '#161B22',
  hc: '#000000',
}, 'Status bar background color')

export const statusBarForeground = registerColor('statusBar.foreground', {
  light: '#FFFFFF',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Status bar foreground color')

export const statusBarBorder = registerColor('statusBar.border', {
  light: '#007ACC',
  dark: '#30363D',
  hc: '#6FC3DF',
}, 'Status bar top border color')
