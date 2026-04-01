/**
 * Theme Provider
 * 
 * Provides theme context and manages theme switching.
 * Must wrap the application to enable theme functionality.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getAllColors, toCssVariableName } from './colorRegistry'
import type { ThemeType } from './colorTypes'

interface ThemeContextValue {
  themeType: ThemeType
  resolvedTheme: 'light' | 'dark' | 'hc'
  setThemeType: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'ao-theme-type'

/**
 * Load theme into DOM - sets CSS variables and theme class
 */
function loadTheme(resolvedTheme: 'light' | 'dark' | 'hc') {
  const root = document.documentElement
  
  // Remove old theme class and add new one
  root.classList.remove('light', 'dark', 'hc')
  root.classList.add(resolvedTheme)
  
  // Get all registered colors and set CSS variables
  const colors = getAllColors()
  for (const color of colors) {
    const defaults = color.defaults[resolvedTheme]
    if (defaults !== null) {
      root.style.setProperty(toCssVariableName(color.id), defaults as string)
    }
  }
}

/**
 * Get system theme preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Theme Provider Component
 * 
 * Manages theme state and provides theme context to child components.
 * Handles:
 * - Theme type persistence in localStorage
 * - System theme detection
 * - Theme switching
 * - CSS variable injection
 * 
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize from localStorage or default to 'system'
  const [themeType, setThemeTypeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'hc' || stored === 'system') {
        return stored
      }
    }
    return 'system'
  })

  // Resolve the actual theme (system -> light/dark)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'hc'>(() => {
    if (themeType === 'system') return getSystemTheme()
    return themeType
  })

  // Set theme and persist to localStorage
  const setThemeType = (newTheme: ThemeType) => {
    setThemeTypeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme)
    }
  }

  // Initial theme load on mount
  useEffect(() => {
    const initialTheme = themeType === 'system' ? getSystemTheme() : themeType
    setResolvedTheme(initialTheme)
    loadTheme(initialTheme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (themeType !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const newTheme: 'light' | 'dark' = e.matches ? 'dark' : 'light'
      setResolvedTheme(newTheme)
      loadTheme(newTheme)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [themeType])

  return (
    <ThemeContext.Provider value={{ themeType, resolvedTheme, setThemeType }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 * 
 * @throws Error if used outside of ThemeProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { themeType, resolvedTheme, setThemeType } = useTheme()
 *   return <button onClick={() => setThemeType('dark')}>Switch to Dark</button>
 * }
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
