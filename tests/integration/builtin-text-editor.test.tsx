import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteContainer, type WorkbenchRouteDefinition } from '@/components/common'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useUIStore } from '@/stores/uiStore'
import { useEditorStore } from '@/stores/editorStore'
import { BuiltinTextEditorPage } from '@/features/editor/pages'

describe('Built-in text editor', () => {
  beforeEach(() => {
    localStorage.clear()
    useUIStore.setState({
      activeActivityItem: 'dashboard',
      editorSidebarEntries: [],
      recentSidebarEntries: [],
    })
    useEditorStore.setState({ activeDocument: null })
    useAuthStore.setState({
      user: null,
      isAuthenticated: true,
      accessToken: 'token',
      refreshToken: 'refresh',
      permissions: {
        roles: ['admin'],
        permissions: ['*'],
        dataScopes: {},
      },
      isRestoring: false,
    })
    usePermissionStore.setState({
      permissions: new Set<string>(['*']),
      forbiddenModal: { open: false, data: null },
      shownForbiddenResources: new Set<string>(),
    })
  })

  it('loads existing plain text content and saves updates', async () => {
    localStorage.setItem(
      'editor:text:contract.txt',
      JSON.stringify({ content: 'Initial content', updatedAt: '2026-03-22T00:00:00.000Z' })
    )

    const route: WorkbenchRouteDefinition = {
      id: 'builtin-editor-route',
      path: '/editor/:docId',
      title: 'Text Editor',
      resource: 'editor/text',
      mode: 'editor',
      resolveDescriptor: (context) => ({
        id: 'builtin-editor-descriptor',
        title: 'Text Editor',
        mode: 'editor',
        render: () => <BuiltinTextEditorPage context={context} />,
      }),
    }

    render(
      <MemoryRouter initialEntries={['/editor/contract.txt']}>
        <Routes>
          <Route path="/editor/:docId" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    const editor = (await screen.findByLabelText('Built-in text editor')) as HTMLTextAreaElement
    expect(editor.value).toBe('Initial content')
    expect(useEditorStore.getState().activeDocument?.isDirty).toBe(false)

    fireEvent.change(editor, { target: { value: 'Updated content' } })
    expect(useEditorStore.getState().activeDocument?.isDirty).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const stored = localStorage.getItem('editor:text:contract.txt')
    expect(stored).not.toBeNull()
    expect(stored).toContain('Updated content')
    expect(useEditorStore.getState().activeDocument?.isDirty).toBe(false)
  })

  it('supports readonly mode and close confirmation for dirty drafts', async () => {
    const route: WorkbenchRouteDefinition = {
      id: 'builtin-editor-route-readonly',
      path: '/editor/:docId',
      title: 'Text Editor',
      resource: 'editor/text',
      mode: 'editor',
      resolveDescriptor: (context) => ({
        id: 'builtin-editor-descriptor-readonly',
        title: 'Text Editor',
        mode: 'editor',
        render: () => <BuiltinTextEditorPage context={context} />,
      }),
    }

    render(
      <MemoryRouter initialEntries={['/editor/readonly.txt?mode=readonly']}>
        <Routes>
          <Route path="/editor/:docId" element={<RouteContainer route={route} />} />
          <Route path="/" element={<div>Home route</div>} />
        </Routes>
      </MemoryRouter>
    )

    const editor = (await screen.findByLabelText('Built-in text editor')) as HTMLTextAreaElement
    expect(editor.readOnly).toBe(true)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Edit' }))
    const editable = (await screen.findByLabelText('Built-in text editor')) as HTMLTextAreaElement
    fireEvent.change(editable, { target: { value: 'dirty text' } })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Home route')).toBeInTheDocument()
    confirmSpy.mockRestore()
  })
})

