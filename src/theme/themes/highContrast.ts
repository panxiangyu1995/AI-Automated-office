/**
 * High Contrast Theme
 * 
 * An accessibility-focused theme with high contrast colors.
 * Meets WCAG AAA standards for users with visual impairments.
 */

import type { ThemeData } from '../colorTypes'

export const highContrastTheme: ThemeData = {
  id: 'highContrast',
  name: 'High Contrast',
  type: 'hc',
  colors: {
    // Base Colors
    foreground: '#FFFFFF',
    background: '#000000',
    border: '#FFFFFF',
    borderStrong: '#FFFFFF',
    errorForeground: '#FF6B6B',
    warningForeground: '#FFD93D',
    infoForeground: '#6BCBFF',
    successForeground: '#6BFF6B',
    focusBorder: '#FFFFFF',

    // Selection
    selectionBackground: '#F38518',
    selectionHighlightBackground: '#F3851840',

    // Borders
    borderDisabled: '#FFFFFF50',

    // Activity Bar
    activityBarBackground: '#000000',
    activityBarForeground: '#FFFFFF',
    activityBarBadgeBackground: '#F38518',

    // Sidebar
    sidebarBackground: '#000000',
    sidebarBorder: '#FFFFFF',
    sidebarForeground: '#FFFFFF',
    sidebarHeaderBorder: '#FFFFFF',
    sidebarSearchBackground: '#000000',
    sidebarSearchIcon: '#FFFFFF',
    sidebarSectionTitle: '#FFFFFF',
    sidebarActiveBackground: '#1A1A1A',
    sidebarActiveForeground: '#FFFFFF',
    sidebarActiveIndicator: '#FFFFFF',
    sidebarSecondaryForeground: '#FFFFFF',
    sidebarBadgeBorder: '#FFFFFF',
    sidebarBadgeForeground: '#FFFFFF',

    // Editor
    editorBackground: '#000000',
    editorForeground: '#FFFFFF',
    editorLineHighlightBackground: '#1A1A1A',

    // Status Bar
    statusBarBackground: '#000000',
    statusBarForeground: '#FFFFFF',

    // Input
    inputBackground: '#000000',
    inputForeground: '#FFFFFF',
    inputBorder: '#FFFFFF',
    inputFocusBorder: '#FFFFFF',

    // Scrollbar
    scrollbarSliderBackground: '#FFFFFF20',
    scrollbarSliderHoverBackground: '#FFFFFF40',
    scrollbarSliderActiveBackground: '#FFFFFF60',

    // Button
    'button.background': '#238636',
    'button.hoverBackground': '#2EA043',
    'button.foreground': '#FFFFFF',
    'button.border': '#FFFFFF',
    'button.dangerBackground': '#FF0000',
    'button.dangerHoverBackground': '#FF4444',
    'button.dangerForeground': '#FFFFFF',
    'button.dangerBorder': '#FFFFFF',
    'button.outlineBorder': '#FFFFFF',
    'button.outlineHoverBackground': '#1A1A1A',
    'button.outlineHoverBorder': '#FFFFFF',
    'button.outlineForeground': '#FFFFFF',
    'button.secondaryBackground': '#1A1A1A',
    'button.secondaryHoverBackground': '#2A2A2A',
    'button.secondaryForeground': '#FFFFFF',
    'button.secondaryBorder': '#FFFFFF',
    'button.ghostHoverBackground': '#1A1A1A',
    'button.ghostForeground': '#FFFFFF',
    'button.linkForeground': '#58A6FF',

    // Card
    'card.background': '#000000',
    'card.border': '#FFFFFF',
    'card.foreground': '#FFFFFF',
    'card.headerBorder': '#FFFFFF',
    'card.footerBorder': '#FFFFFF',

    // Topbar
    'topbar.background': '#000000',
    'topbar.border': '#FFFFFF',
    'topbar.foreground': '#FFFFFF',
    'topbar.menuItemForeground': '#FFFFFF',
    'topbar.menuItemHoverBackground': '#1A1A1A',
    'topbar.menuItemActiveBackground': '#1A1A1A',
    'topbar.menuBackground': '#000000',
    'topbar.menuBorder': '#FFFFFF',
    'topbar.menuItemText': '#FFFFFF',
    'topbar.menuSeparator': '#FFFFFF',
    'topbar.dangerForeground': '#FF0000',
  },
}
