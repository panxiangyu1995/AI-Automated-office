import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { RouteContainer, type WorkbenchRouteDefinition } from '@/components/common'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useUIStore } from '@/stores/uiStore'
import { useEditorStore } from '@/stores/editorStore'
import { BuiltinJsonEditorPage } from '@/features/editor/pages'

describe('Built-in json editor', () => {
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

  it('loads json content, validates, formats and saves', async () => {
    localStorage.setItem(
      'editor:json:config.json',
      JSON.stringify({
        content: '{"name":"ERP","version":1}',
        updatedAt: '2026-03-22T00:00:00.000Z',
      })
    )

    const route: WorkbenchRouteDefinition = {
      id: 'builtin-json-route',
      path: '/editor/:docId',
      title: 'JSON Editor',
      resource: 'editor/json',
      mode: 'editor',
      resolveDescriptor: (context) => ({
        id: 'builtin-json-descriptor',
        title: 'JSON Editor',
        mode: 'editor',
        render: () => <BuiltinJsonEditorPage context={context} />,
      }),
    }

    render(
      <MemoryRouter initialEntries={['/editor/config.json']}>
        <Routes>
          <Route path="/editor/:docId" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    const source = (await screen.findByLabelText('Built-in json editor')) as HTMLTextAreaElement
    expect(source.value).toContain('"name":"ERP"')
    expect(screen.getByText('Valid JSON')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Format JSON' }))
    expect(source.value).toContain('\n  "name": "ERP"')

    fireEvent.change(source, { target: { value: '{invalid json}' } })
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    fireEvent.change(source, { target: { value: '{\n  "name": "ERP",\n  "version": 2\n}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const stored = localStorage.getItem('editor:json:config.json')
    expect(stored).not.toBeNull()
    const parsedStored = JSON.parse(stored as string) as { content: string }
    expect(parsedStored.content).toContain('"version": 2')
    expect(useEditorStore.getState().activeDocument?.isDirty).toBe(false)
  })

  it('shows template/config workflow panel for config-like files', async () => {
    const route: WorkbenchRouteDefinition = {
      id: 'builtin-json-config-route',
      path: '/editor/:docId',
      title: 'JSON Editor',
      resource: 'editor/json',
      mode: 'editor',
      resolveDescriptor: (context) => ({
        id: 'builtin-json-config-descriptor',
        title: 'JSON Editor',
        mode: 'editor',
        render: () => <BuiltinJsonEditorPage context={context} />,
      }),
    }

    render(
      <MemoryRouter initialEntries={['/editor/template-config.json']}>
        <Routes>
          <Route path="/editor/:docId" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/Template\/Config workflow mode is active/i)).toBeInTheDocument()
  })
})
