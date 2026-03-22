import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Sidebar } from '@/components/common'
import { useUIStore, type SidebarResourceEntry } from '@/stores/uiStore'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-probe">{location.pathname}</div>
}

describe('Sidebar resource entry model', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarWidth: 240,
      sidebarCollapsed: false,
      activeActivityItem: 'dashboard',
      dynamicSidebarEntries: [],
      editorSidebarEntries: [],
      recentSidebarEntries: [],
    })
  })

  it('keeps fixed navigation entries for admin routes', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Sidebar />
      </MemoryRouter>
    )

    expect(await screen.findByText('用户管理')).toBeInTheDocument()
    expect(screen.getByText('组织架构')).toBeInTheDocument()
  })

  it('renders dynamic resources, editor entries, and recent items', async () => {
    const dynamicEntry: SidebarResourceEntry = {
      id: 'dynamic-approval',
      label: '审批模板',
      description: 'dynamic/approval-template',
      kind: 'dynamic',
      target: { path: '/dynamic/approval-template', mode: 'dynamic', activityItem: 'approval' },
    }
    const editorEntry: SidebarResourceEntry = {
      id: 'editor-handbook',
      label: '员工手册',
      description: 'editor/handbook.md',
      kind: 'editor',
      target: { path: '/editor/handbook', mode: 'editor', activityItem: 'knowledge' },
    }
    const recentEntry: SidebarResourceEntry = {
      id: 'recent-audit',
      label: '审计日志',
      description: 'admin/audit',
      kind: 'recent',
      target: { path: '/admin/audit', mode: 'static', activityItem: 'dashboard' },
    }

    useUIStore.setState({
      dynamicSidebarEntries: [dynamicEntry],
      editorSidebarEntries: [editorEntry],
      recentSidebarEntries: [recentEntry],
    })

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <Sidebar />
      </MemoryRouter>
    )

    expect(await screen.findByText('动态资源')).toBeInTheDocument()
    expect(screen.getByText('审批模板')).toBeInTheDocument()
    expect(screen.getByText('编辑器')).toBeInTheDocument()
    expect(screen.getByText('员工手册')).toBeInTheDocument()
    expect(screen.getByText('最近打开')).toBeInTheDocument()
    expect(screen.getByText('审计日志')).toBeInTheDocument()
  })

  it('opens sidebar resources through the shared host protocol', async () => {
    useUIStore.setState({
      activeActivityItem: 'dashboard',
      editorSidebarEntries: [
        {
          id: 'editor-contract',
          label: '销售合同',
          description: 'editor/contract.docx',
          kind: 'editor',
          target: { path: '/editor/contract', mode: 'editor', activityItem: 'sales' },
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <Sidebar />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(await screen.findByText('销售合同'))

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/editor/contract')
    expect(useUIStore.getState().activeActivityItem).toBe('sales')
  })
})
