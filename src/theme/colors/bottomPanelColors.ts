/**
 * Bottom Panel Colors
 *
 * Color definitions for the bottom panel component.
 */

import { registerColor } from '../colorRegistry'

export const bottomPanelBackground = registerColor('bottomPanel.background', {
  light: '#F3F3F3',
  dark: '#161B22',
  hc: '#000000',
}, 'Bottom panel background color')

export const bottomPanelBorder = registerColor('bottomPanel.border', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#6FC3DF',
}, 'Bottom panel top border color')

export const bottomPanelForeground = registerColor('bottomPanel.foreground', {
  light: '#666666',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Bottom panel inactive foreground color')

export const bottomPanelActiveBackground = registerColor('bottomPanel.activeBackground', {
  light: '#E8E8E8',
  dark: '#21262D',
  hc: '#1A1A1A',
}, 'Bottom panel active tab background color')

export const bottomPanelActiveForeground = registerColor('bottomPanel.activeForeground', {
  light: '#333333',
  dark: '#FFFFFF',
  hc: '#FFFFFF',
}, 'Bottom panel active tab foreground color')

export const bottomPanelHoverBackground = registerColor('bottomPanel.hoverBackground', {
  light: '#F0F0F0',
  dark: '#21262D40',
  hc: '#1A1A1A',
}, 'Bottom panel hover background color')
