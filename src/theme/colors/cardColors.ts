/**
 * Card Colors
 * 
 * Color definitions for card component.
 */

import { registerColor } from '../colorRegistry'

export const cardBackground = registerColor('card.background', {
  light: '#FFFFFF',
  dark: '#161B22',
  hc: '#000000',
}, 'Card background color')

export const cardBorder = registerColor('card.border', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#FFFFFF',
}, 'Card border color')

export const cardForeground = registerColor('card.foreground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Card foreground color')

export const cardHeaderBorder = registerColor('card.headerBorder', {
  light: '#E0E0E0',
  dark: '#21262D',
  hc: '#FFFFFF',
}, 'Card header border color')

export const cardFooterBorder = registerColor('card.footerBorder', {
  light: '#E0E0E0',
  dark: '#21262D',
  hc: '#FFFFFF',
}, 'Card footer border color')
