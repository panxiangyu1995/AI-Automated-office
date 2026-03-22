import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteContainer, type WorkbenchRouteDefinition } from '@/components/common'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useUIStore } from '@/stores/uiStore'

describe('RouteContainer', () => {
  beforeEach(() => {
    useUIStore.setState({ activeActivityItem: 'dashboard' })
    useAuthStore.setState({
      user: null,
      isAuthenticated: true,
      accessToken: 'token',
      refreshToken: 'refresh',
      permissions: {
        roles: ['admin'],
        permissions: [],
        dataScopes: {},
      },
      isRestoring: false,
    })
    usePermissionStore.setState({
      permissions: new Set<string>(),
      forbiddenModal: { open: false, data: null },
      shownForbiddenResources: new Set<string>(),
    })
  })

  afterEach(() => {
    usePermissionStore.getState().hideForbidden()
  })

  it('renders static route components through the unified container entry', async () => {
    usePermissionStore.getState().setPermissions(['admin_user_read'])

    const route: WorkbenchRouteDefinition = {
      id: 'users-list',
      path: '/admin/users',
      title: 'Users',
      resource: 'admin/users',
      mode: 'static',
      requiredPermission: 'admin_user_read',
      component: () => <div>Users static page</div>,
    }

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/admin/users" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Users static page')).toBeInTheDocument()
  })

  it('blocks route access at the container layer when permission is missing', async () => {
    const route: WorkbenchRouteDefinition = {
      id: 'audit-page',
      path: '/admin/audit',
      title: 'Audit Logs',
      resource: 'admin/audit',
      mode: 'static',
      requiredPermission: 'admin_audit_read',
      component: () => <div>Audit content</div>,
    }

    render(
      <MemoryRouter initialEntries={['/admin/audit']}>
        <Routes>
          <Route path="/admin/audit" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('You do not have permission to access Audit Logs.')).toBeInTheDocument()
    expect(screen.queryByText('Audit content')).not.toBeInTheDocument()
  })

  it('supports dynamic route mapping through route definitions', async () => {
    usePermissionStore.getState().setPermissions(['*'])

    const route: WorkbenchRouteDefinition = {
      id: 'dynamic-contract',
      path: '/dynamic/contracts',
      title: 'Dynamic Contracts',
      resource: 'dynamic/contracts',
      mode: 'dynamic',
    }

    render(
      <MemoryRouter initialEntries={['/dynamic/contracts']}>
        <Routes>
          <Route path="/dynamic/contracts" element={<RouteContainer route={route} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Dynamic Contracts')).toBeInTheDocument()
    expect(screen.getByText('Dynamic page host is ready to accept schema-driven content.')).toBeInTheDocument()
  })
})
