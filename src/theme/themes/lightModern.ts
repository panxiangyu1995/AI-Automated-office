/**
 * Light Modern Theme
 * 
 * A clean, modern light theme for daytime or bright environments.
 */

import type { ThemeData } from '../colorTypes'

export const lightModernTheme: ThemeData = {
  id: 'lightModern',
  name: 'Light Modern',
  type: 'light',
  colors: {
    // Base Colors
    foreground: '#616161',
    background: '#FFFFFF',
    border: '#C8C8C8',
    borderStrong: '#A8A8A8',
    errorForeground: '#A1260D',
    warningForeground: '#BF8803',
    infoForeground: '#0068BF',
    successForeground: '#107C10',
    focusBorder: '#0078D4',

    // Selection
    selectionBackground: '#ADD6FF80',
    selectionHighlightBackground: '#ADD6FF40',

    // Borders
    borderDisabled: '#C8C8C850',

    // Activity Bar
    'activityBar.background': '#F3F3F3',
    'activityBar.foreground': '#616161',
    'activityBar.activeBackground': '#E0E0E0',
    'activityBar.activeForeground': '#333333',
    'activityBar.border': '#E0E0E0',

    // Sidebar
    'sidebar.background': '#F5F5F5',
    'sidebar.border': '#E0E0E0',
    'sidebar.foreground': '#333333',
    'sidebar.headerBorder': '#E0E0E0',
    'sidebar.searchBackground': '#FFFFFF',
    'sidebar.searchIcon': '#666666',
    'sidebar.sectionTitle': '#666666',
    'sidebar.activeBackground': '#E8E8E8',
    'sidebar.activeForeground': '#000000',
    'sidebar.activeIndicator': '#238636',
    'sidebar.secondaryForeground': '#666666',
    'sidebar.badgeBorder': '#E0E0E0',
    'sidebar.badgeForeground': '#666666',

    // Editor
    editorBackground: '#FFFFFF',
    editorForeground: '#616161',
    editorLineHighlightBackground: '#F0F0F0',

    // Status Bar
    'statusBar.background': '#007ACC',
    'statusBar.foreground': '#FFFFFF',
    'statusBar.border': '#007ACC',

    // Workbench
    'workbench.background': '#FFFFFF',
    'workbench.foreground': '#333333',
    'workbench.secondaryForeground': '#666666',

    // Tab Bar
    'tabBar.background': '#F3F3F3',
    'tabBar.border': '#E0E0E0',
    'tabBar.foreground': '#666666',
    'tabBar.activeBackground': '#FFFFFF',
    'tabBar.activeForeground': '#333333',
    'tabBar.hoverBackground': '#E8E8E8',

    // Bottom Panel
    'bottomPanel.background': '#F3F3F3',
    'bottomPanel.border': '#E0E0E0',
    'bottomPanel.foreground': '#666666',
    'bottomPanel.activeBackground': '#E8E8E8',
    'bottomPanel.activeForeground': '#333333',
    'bottomPanel.hoverBackground': '#F0F0F0',

    // AI Chat Panel
    'aiChatPanel.background': '#F5F5F5',
    'aiChatPanel.border': '#E0E0E0',
    'aiChatPanel.foreground': '#333333',

    // Input
    'input.background': '#FFFFFF',
    'input.foreground': '#616161',
    'input.border': '#C8C8C8',
    'input.focusBorder': '#0078D4',

    // Scrollbar
    'scrollbarSlider.background': '#C8C8C880',
    'scrollbarSlider.hoverBackground': '#C8C8C8B0',
    'scrollbarSlider.activeBackground': '#C8C8C8D0',

    // Button
    'button.background': '#238636',
    'button.hoverBackground': '#2EA043',
    'button.foreground': '#FFFFFF',
    'button.border': '#238636',
    'button.dangerBackground': '#DA3633',
    'button.dangerHoverBackground': '#F85149',
    'button.dangerForeground': '#FFFFFF',
    'button.dangerBorder': '#DA3633',
    'button.outlineBorder': '#C8C8C8',
    'button.outlineHoverBackground': '#F5F5F5',
    'button.outlineHoverBorder': '#A8A8A8',
    'button.outlineForeground': '#333333',
    'button.secondaryBackground': '#F5F5F5',
    'button.secondaryHoverBackground': '#E8E8E8',
    'button.secondaryForeground': '#333333',
    'button.secondaryBorder': '#E0E0E0',
    'button.ghostHoverBackground': '#F5F5F5',
    'button.ghostForeground': '#333333',
    'button.linkForeground': '#0066CC',

    // Card
    'card.background': '#FFFFFF',
    'card.border': '#E0E0E0',
    'card.foreground': '#333333',
    'card.headerBorder': '#E0E0E0',
    'card.footerBorder': '#E0E0E0',

    // Command Palette
    'commandPalette.background': '#FFFFFF',
    'commandPalette.border': '#E0E0E0',
    'commandPalette.foreground': '#333333',
    'commandPalette.secondaryForeground': '#666666',
    'commandPalette.selectedBackground': '#E8E8E8',
    'commandPalette.badgeBackground': '#E0E0E0',
    'commandPalette.footerBackground': '#F3F3F3',
    'commandPalette.activeForeground': '#333333',

    // Topbar
    'topbar.background': '#F5F5F5',
    'topbar.border': '#E0E0E0',
    'topbar.foreground': '#333333',
    'topbar.menuItemForeground': '#333333',
    'topbar.menuItemHoverBackground': '#E8E8E8',
    'topbar.menuItemActiveBackground': '#E8E8E8',
    'topbar.menuBackground': '#FFFFFF',
    'topbar.menuBorder': '#E0E0E0',
    'topbar.menuItemText': '#333333',
    'topbar.menuSeparator': '#E0E0E0',
    'topbar.dangerForeground': '#CC0000',
  },
}
