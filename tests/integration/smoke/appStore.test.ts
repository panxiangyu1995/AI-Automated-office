import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/stores/appStore'

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({ initialized: false, theme: 'system', sidebarCollapsed: false })
})

describe('app store', () => {
  it('updates theme and sidebar state', () => {
    const { setTheme, toggleSidebar } = useAppStore.getState()
    setTheme('dark')
    toggleSidebar()
    const state = useAppStore.getState()
    expect(state.theme).toBe('dark')
    expect(state.sidebarCollapsed).toBe(true)
  })
})
