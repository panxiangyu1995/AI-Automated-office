import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { RouteContainer, type WorkbenchRouteDefinition } from '@/components/common'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useUIStore } from '@/stores/uiStore'
import { useEditorStore } from '@/stores/editorStore'
import { BuiltinMarkdownEditorPage } from '@/features/editor/pages'

describe('Built-in markdown editor', () => {
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

  it('loads markdown content, supports table cell edit, and saves through unified contract', async () => {
    localStorage.setItem(
      'editor:markdown:report.md',
      JSON.stringify({
        content: '# Report\n\n| Name | Value |\n| --- | --- |\n| Sales | 100 |\n',
        updatedAt: '2026-03-22T00:00:00.000Z',
      })
    )

    const route: WorkbenchRouteDefinition = {
      id: 'builtin-markdown-route',
      path: '/editor/:docId',
      title: 'Markdown Editor',
      resource: 'editor/markdown',
      mode: 'editor',
      resolveDescriptor: (context) => ({
        id: 'builtin-markdown-descriptor',
        title: 'Markdown Editor',
        mode: 'editor',
        render: () => <BuiltinMarkdownEditorPage context={context} />,
      }),
    }

    render(
      <MemoryRouter initialEntries={['/editor/report.md']}>
        <Routes>
          <Route path="/editor/:docId" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    const source = (await screen.findByLabelText('Built-in markdown editor')) as HTMLTextAreaElement
    expect(source.value).toContain('# Report')
    expect(await screen.findByText('Report')).toBeInTheDocument()

    const cellInput = screen.getByLabelText('table-cell-0-1')
    fireEvent.change(cellInput, { target: { value: '250' } })
    expect(useEditorStore.getState().activeDocument?.isDirty).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const stored = localStorage.getItem('editor:markdown:report.md')
    expect(stored).toContain('250')
    expect(useEditorStore.getState().activeDocument?.isDirty).toBe(false)
  })

  it('honors readonly mode for markdown source and table cells', async () => {
    localStorage.setItem(
      'editor:markdown:readonly.md',
      JSON.stringify({
        content: '| Name | Value |\n| --- | --- |\n| Sales | 100 |\n',
        updatedAt: '2026-03-22T00:00:00.000Z',
      })
    )

    const route: WorkbenchRouteDefinition = {
      id: 'builtin-markdown-readonly-route',
      path: '/editor/:docId',
      title: 'Markdown Editor',
      resource: 'editor/markdown',
      mode: 'editor',
      resolveDescriptor: (context) => ({
        id: 'builtin-markdown-readonly-descriptor',
        title: 'Markdown Editor',
        mode: 'editor',
        render: () => <BuiltinMarkdownEditorPage context={context} />,
      }),
    }

    render(
      <MemoryRouter initialEntries={['/editor/readonly.md?mode=readonly']}>
        <Routes>
          <Route path="/editor/:docId" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    const source = (await screen.findByLabelText('Built-in markdown editor')) as HTMLTextAreaElement
    const cellInput = screen.getByLabelText('table-cell-0-1') as HTMLInputElement
    expect(source.readOnly).toBe(true)
    expect(cellInput.readOnly).toBe(true)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})

