/**
 * AI Chat Panel Colors
 *
 * Color definitions for the AI chat panel component.
 */

import { registerColor } from '../colorRegistry'

export const aiChatPanelBackground = registerColor('aiChatPanel.background', {
  light: '#F5F5F5',
  dark: '#0F1419',
  hc: '#000000',
}, 'AI chat panel background color')

export const aiChatPanelBorder = registerColor('aiChatPanel.border', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#6FC3DF',
}, 'AI chat panel left border color')

export const aiChatPanelForeground = registerColor('aiChatPanel.foreground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'AI chat panel foreground color')
