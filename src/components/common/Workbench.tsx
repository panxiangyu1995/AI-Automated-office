import { useMemo, useEffect, type ReactNode } from 'react'
import { useLocation, useOutlet, useParams } from 'react-router-dom'
import { SettingsPanel } from '../../features/settings/components/SettingsPanel'
import { useUIStore } from '../../stores/uiStore'
import {
  WorkbenchHostRenderer,
  type WorkbenchHostDescriptor,
  type WorkbenchPageContext,
} from './workbenchHost'
import { TabBar } from './TabBar'
import { useWorkbenchStore } from '../../stores/workbenchStore'
import { getRouteTitle } from '../../lib/routes'

interface WorkbenchProps {
  children?: ReactNode
  className?: string
  descriptor?: WorkbenchHostDescriptor
}

export function Workbench({ children, className = '', descriptor }: WorkbenchProps) {
  const activeActivityItem = useUIStore((state) => state.activeActivityItem)
  const { tabs, activeTabId, addTab } = useWorkbenchStore()
  const location = useLocation()
  const params = useParams()
  const outlet = useOutlet()

  const pageContext = useMemo<WorkbenchPageContext>(
    () => ({
      routeId: `workbench:${location.pathname || '/'}`,
      resourceId: location.pathname || '/',
      openMode: 'static',
      route: location.pathname,
      params,
      searchParams: new URLSearchParams(location.search),
      dataSource: {
        sourceType: 'route',
        sourceId: location.pathname || '/',
        query: Object.fromEntries(new URLSearchParams(location.search)),
      },
      activeActivityItem,
      permission: {
        canView: true,
        canEdit: true,
        requiredPermissions: [],
        fieldPermissions: {},
      },
    }),
    [activeActivityItem, location.pathname, location.search, params]
  )

  const resolvedDescriptor = useMemo<WorkbenchHostDescriptor>(() => {
    if (descriptor) {
      return descriptor
    }

    if (activeActivityItem === 'settings') {
      return {
        id: 'settings-static-host',
        title: 'Settings',
        mode: 'static',
        render: () => <SettingsPanel />,
      }
    }

    return {
      id: `static-route:${location.pathname || '/'}`,
      title: 'Workbench',
      mode: 'static',
      render: () =>
        outlet ?? (
          children || (
            <div className="flex h-full flex-col items-center justify-center p-8">
              <h2
                className="mb-2 text-2xl font-bold"
                style={{ color: '#C9D1D9' }}
              >
                欢迎使用 AI-Automated-Office
              </h2>
              <p style={{ color: '#8B949E' }}>AI 赋能的企业 ERP 系统</p>
            </div>
          )
        ),
    }
  }, [activeActivityItem, children, descriptor, location.pathname, outlet])

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? null,
    [tabs, activeTabId]
  )

  const handleNewTab = () => {
    addTab({
      title: '新建标签页',
      type: 'custom',
      closable: true,
      dirty: false,
    })
  }

  useEffect(() => {
    if (tabs.length === 0) return

    const existingTab = tabs.find(
      (t) => t.routeKey === `route:${location.pathname}`
    )
    if (!existingTab) {
      addTab({
        title: getRouteTitle(location.pathname),
        type: 'custom',
        closable: true,
        dirty: false,
        routeKey: `route:${location.pathname}`,
      })
    }
  }, [location.pathname])

  return (
    <main
      className={`flex flex-1 flex-col overflow-hidden ${className}`}
      style={{ backgroundColor: '#0F1419' }}
    >
      <TabBar onNewTab={handleNewTab} />

      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <WorkbenchHostRenderer
            descriptor={{
              ...resolvedDescriptor,
              id: `tab:${activeTab.id}`,
              title: activeTab.title,
            }}
            context={pageContext}
          />
        ) : (
          <WorkbenchHostRenderer
            descriptor={resolvedDescriptor}
            context={pageContext}
          />
        )}
      </div>
    </main>
  )
}
