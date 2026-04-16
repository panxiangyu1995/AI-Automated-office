/**
 * Tab Bar Colors
 *
 * Color definitions for the tab bar component.
 */

import { registerColor } from '../colorRegistry'

export const tabBarBackground = registerColor('tabBar.background', {
  light: '#F3F3F3',
  dark: '#161B22',
  hc: '#000000',
}, 'Tab bar background color')

export const tabBarBorder = registerColor('tabBar.border', {
  light: '#E0E0E0',
  dark: '#21262D',
  hc: '#6FC3DF',
}, 'Tab bar bottom border color')

export const tabBarForeground = registerColor('tabBar.foreground', {
  light: '#666666',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Tab bar inactive foreground color')

export const tabBarActiveBackground = registerColor('tabBar.activeBackground', {
  light: '#FFFFFF',
  dark: '#0F1419',
  hc: '#000000',
}, 'Tab bar active tab background color')

export const tabBarActiveForeground = registerColor('tabBar.activeForeground', {
  light: '#333333',
  dark: '#FFFFFF',
  hc: '#FFFFFF',
}, 'Tab bar active tab foreground color')

export const tabBarHoverBackground = registerColor('tabBar.hoverBackground', {
  light: '#E8E8E8',
  dark: '#21262D',
  hc: '#1A1A1A',
}, 'Tab bar hover background color')
