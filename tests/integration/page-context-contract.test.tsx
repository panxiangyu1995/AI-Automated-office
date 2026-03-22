import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteContainer, type WorkbenchPageContext, type WorkbenchRouteDefinition } from '@/components/common'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useUIStore } from '@/stores/uiStore'

describe('Page open mode and context contract', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeActivityItem: 'dashboard',
      recentSidebarEntries: [],
    })

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

  it('provides open mode, data source, and permission context fields', async () => {
    let capturedContext: WorkbenchPageContext | null = null

    const route: WorkbenchRouteDefinition = {
      id: 'contract-editor',
      path: '/contracts/:id',
      title: 'Contract Editor',
      resource: 'contracts/editor',
      mode: 'editor',
      requiredPermission: ['contract_read', 'contract_write'],
      dataSource: {
        sourceType: 'api',
        sourceId: 'contracts-api',
      },
      resolveDescriptor: (context) => {
        capturedContext = context
        return {
          id: 'contract-editor-host',
          title: 'Contract Editor Host',
          mode: 'editor',
          render: () => <div>Contract editor view</div>,
        }
      },
    }

    render(
      <MemoryRouter initialEntries={['/contracts/42?tab=summary']}>
        <Routes>
          <Route path="/contracts/:id" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Contract editor view')).toBeInTheDocument()
    expect(capturedContext).not.toBeNull()
    expect(capturedContext?.routeId).toBe('contract-editor')
    expect(capturedContext?.resourceId).toBe('contracts/editor')
    expect(capturedContext?.openMode).toBe('editor')
    expect(capturedContext?.dataSource.sourceType).toBe('api')
    expect(capturedContext?.dataSource.sourceId).toBe('contracts-api')
    expect(capturedContext?.dataSource.query.tab).toBe('summary')
    expect(capturedContext?.permission.requiredPermissions).toEqual(['contract_read', 'contract_write'])
  })

  it('supports host lifecycle callbacks for open and close phases', async () => {
    const onBeforeOpen = vi.fn()
    const onAfterOpen = vi.fn()
    const onBeforeClose = vi.fn()
    const onAfterClose = vi.fn()

    const route: WorkbenchRouteDefinition = {
      id: 'lifecycle-view',
      path: '/lifecycle',
      title: 'Lifecycle View',
      resource: 'lifecycle/view',
      mode: 'dynamic',
      resolveDescriptor: () => ({
        id: 'lifecycle-host',
        title: 'Lifecycle Host',
        mode: 'dynamic',
        lifecycle: {
          onBeforeOpen,
          onAfterOpen,
          onBeforeClose,
          onAfterClose,
        },
        render: () => <div>Lifecycle view</div>,
      }),
    }

    const { unmount } = render(
      <MemoryRouter initialEntries={['/lifecycle']}>
        <Routes>
          <Route path="/lifecycle" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Lifecycle view')).toBeInTheDocument()
    expect(onBeforeOpen).toHaveBeenCalledTimes(1)
    expect(onAfterOpen).toHaveBeenCalledTimes(1)

    unmount()

    expect(onBeforeClose).toHaveBeenCalledTimes(1)
    expect(onAfterClose).toHaveBeenCalledTimes(1)
  })
})
