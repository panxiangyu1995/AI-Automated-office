/**
 * Activity Bar Colors
 *
 * Color definitions for the activity bar component.
 */

import { registerColor } from '../colorRegistry'

export const activityBarBackground = registerColor('activityBar.background', {
  light: '#F3F3F3',
  dark: '#1C2128',
  hc: '#000000',
}, 'Activity bar background color')

export const activityBarForeground = registerColor('activityBar.foreground', {
  light: '#616161',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Activity bar inactive item foreground')

export const activityBarActiveBackground = registerColor('activityBar.activeBackground', {
  light: '#E0E0E0',
  dark: '#0F1419',
  hc: '#1A1A1A',
}, 'Activity bar active item background')

export const activityBarActiveForeground = registerColor('activityBar.activeForeground', {
  light: '#333333',
  dark: '#FFFFFF',
  hc: '#FFFFFF',
}, 'Activity bar active item foreground')

export const activityBarBorder = registerColor('activityBar.border', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#6FC3DF',
}, 'Activity bar separator border color')
