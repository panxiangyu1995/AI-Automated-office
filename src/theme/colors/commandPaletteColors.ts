/**
 * Command Palette Colors
 *
 * Color definitions for the command palette overlay component.
 */

import { registerColor } from '../colorRegistry'

export const commandPaletteBackground = registerColor('commandPalette.background', {
  light: '#FFFFFF',
  dark: '#161B22',
  hc: '#000000',
}, 'Command palette background color')

export const commandPaletteBorder = registerColor('commandPalette.border', {
  light: '#E0E0E0',
  dark: '#30363D',
  hc: '#6FC3DF',
}, 'Command palette border color')

export const commandPaletteForeground = registerColor('commandPalette.foreground', {
  light: '#333333',
  dark: '#C9D1D9',
  hc: '#FFFFFF',
}, 'Command palette text color')

export const commandPaletteSecondaryForeground = registerColor('commandPalette.secondaryForeground', {
  light: '#666666',
  dark: '#8B949E',
  hc: '#FFFFFF',
}, 'Command palette secondary/muted text color')

export const commandPaletteSelectedBackground = registerColor('commandPalette.selectedBackground', {
  light: '#E8E8E8',
  dark: '#21262D',
  hc: '#1A1A1A',
}, 'Command palette selected item background')

export const commandPaletteBadgeBackground = registerColor('commandPalette.badgeBackground', {
  light: '#E0E0E0',
  dark: '#21262D',
  hc: '#1A1A1A',
}, 'Command palette badge/shortcut key background')

export const commandPaletteFooterBackground = registerColor('commandPalette.footerBackground', {
  light: '#F3F3F3',
  dark: '#0D1117',
  hc: '#0A0A0A',
}, 'Command palette footer background')

export const commandPaletteActiveForeground = registerColor('commandPalette.activeForeground', {
  light: '#333333',
  dark: '#FFFFFF',
  hc: '#FFFFFF',
}, 'Command palette active/selected text color')
