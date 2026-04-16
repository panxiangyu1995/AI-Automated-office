/**
 * Dark Modern Theme
 * 
 * A modern dark theme based on GitHub's dark color scheme.
 * Suitable for nighttime or low-light environments.
 */

import type { ThemeData } from '../colorTypes'

export const darkModernTheme: ThemeData = {
  id: 'darkModern',
  name: 'Dark Modern',
  type: 'dark',
  colors: {
    // Base Colors
    foreground: '#CCCCCC',
    background: '#1F1F1E',
    border: '#3C3C3C',
    borderStrong: '#6B6B6B',
    errorForeground: '#F48771',
    warningForeground: '#CCA700',
    infoForeground: '#4FC1FF',
    successForeground: '#89D185',
    focusBorder: '#0078D4',

    // Selection
    selectionBackground: '#264F78',
    selectionHighlightBackground: '#264F7840',

    // Borders
    borderDisabled: '#3C3C3C50',

    // Activity Bar
    activityBarBackground: '#1C2128',
    activityBarForeground: '#C9D1D9',
    'activityBar.activeBackground': '#0F1419',
    'activityBar.activeForeground': '#FFFFFF',
    'activityBar.border': '#30363D',

    // Sidebar
    sidebarBackground: '#161B22',
    sidebarBorder: '#21262D',
    sidebarForeground: '#C9D1D9',
    sidebarHeaderBorder: '#21262D',
    sidebarSearchBackground: '#0D1117',
    sidebarSearchIcon: '#8B949E',
    sidebarSectionTitle: '#8B949E',
    sidebarActiveBackground: '#21262D',
    sidebarActiveForeground: '#FFFFFF',
    sidebarActiveIndicator: '#238636',
    sidebarSecondaryForeground: '#8B949E',
    sidebarBadgeBorder: '#30363D',
    sidebarBadgeForeground: '#8B949E',

    // Editor
    editorBackground: '#1F1F1E',
    editorForeground: '#CCCCCC',
    editorLineHighlightBackground: '#2A2A2A',

    // Status Bar
    statusBarBackground: '#161B22',
    statusBarForeground: '#8B949E',
    'statusBar.border': '#30363D',

    // Workbench
    'workbench.background': '#0F1419',
    'workbench.foreground': '#C9D1D9',
    'workbench.secondaryForeground': '#8B949E',

    // Tab Bar
    'tabBar.background': '#161B22',
    'tabBar.border': '#21262D',
    'tabBar.foreground': '#8B949E',
    'tabBar.activeBackground': '#0F1419',
    'tabBar.activeForeground': '#FFFFFF',
    'tabBar.hoverBackground': '#21262D',

    // Bottom Panel
    'bottomPanel.background': '#161B22',
    'bottomPanel.border': '#30363D',
    'bottomPanel.foreground': '#8B949E',
    'bottomPanel.activeBackground': '#21262D',
    'bottomPanel.activeForeground': '#FFFFFF',
    'bottomPanel.hoverBackground': '#21262D40',

    // AI Chat Panel
    'aiChatPanel.background': '#0F1419',
    'aiChatPanel.border': '#30363D',
    'aiChatPanel.foreground': '#C9D1D9',

    // Input
    inputBackground: '#3C3C3C',
    inputForeground: '#CCCCCC',
    inputBorder: '#3C3C3C',
    inputFocusBorder: '#0078D4',

    // Scrollbar
    scrollbarSliderBackground: '#42424280',
    scrollbarSliderHoverBackground: '#686868B0',
    scrollbarSliderActiveBackground: '#909090D0',

    // Button
    'button.background': '#238636',
    'button.hoverBackground': '#2EA043',
    'button.foreground': '#FFFFFF',
    'button.border': '#238636',
    'button.dangerBackground': '#DA3633',
    'button.dangerHoverBackground': '#F85149',
    'button.dangerForeground': '#FFFFFF',
    'button.dangerBorder': '#DA3633',
    'button.outlineBorder': '#30363D',
    'button.outlineHoverBackground': '#21262D',
    'button.outlineHoverBorder': '#484F58',
    'button.outlineForeground': '#C9D1D9',
    'button.secondaryBackground': '#21262D',
    'button.secondaryHoverBackground': '#30363D',
    'button.secondaryForeground': '#C9D1D9',
    'button.secondaryBorder': '#30363D',
    'button.ghostHoverBackground': '#21262D',
    'button.ghostForeground': '#C9D1D9',
    'button.linkForeground': '#58A6FF',

    // Card
    'card.background': '#161B22',
    'card.border': '#30363D',
    'card.foreground': '#C9D1D9',
    'card.headerBorder': '#21262D',
    'card.footerBorder': '#21262D',

    // Command Palette
    'commandPalette.background': '#161B22',
    'commandPalette.border': '#30363D',
    'commandPalette.foreground': '#C9D1D9',
    'commandPalette.secondaryForeground': '#8B949E',
    'commandPalette.selectedBackground': '#21262D',
    'commandPalette.badgeBackground': '#21262D',
    'commandPalette.footerBackground': '#0D1117',
    'commandPalette.activeForeground': '#FFFFFF',

    // Topbar
    'topbar.background': '#1C2128',
    'topbar.border': '#30363D',
    'topbar.foreground': '#C9D1D9',
    'topbar.menuItemForeground': '#C9D1D9',
    'topbar.menuItemHoverBackground': '#30363D',
    'topbar.menuItemActiveBackground': '#30363D',
    'topbar.menuBackground': '#161B22',
    'topbar.menuBorder': '#30363D',
    'topbar.menuItemText': '#C9D1D9',
    'topbar.menuSeparator': '#30363D',
    'topbar.dangerForeground': '#F85149',
  },
}
