import { useMemo, type ReactNode } from 'react'
import { useLocation, useOutlet, useParams } from 'react-router-dom'
import { SettingsPanel } from '../../features/settings/components/SettingsPanel'
import { useUIStore } from '../../stores/uiStore'
import { WorkbenchHostRenderer, type WorkbenchHostDescriptor, type WorkbenchPageContext } from './workbenchHost'

interface WorkbenchProps {
  children?: ReactNode
  className?: string
  descriptor?: WorkbenchHostDescriptor
}

export function Workbench({ children, className = '', descriptor }: WorkbenchProps) {
  const { activeActivityItem } = useUIStore()
  const location = useLocation()
  const params = useParams()
  const outlet = useOutlet()

  const pageContext = useMemo<WorkbenchPageContext>(
    () => ({
      route: location.pathname,
      params,
      searchParams: new URLSearchParams(location.search),
      activeActivityItem,
      permission: {
        canView: true,
        canEdit: true,
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
              <h2 className="mb-2 text-2xl font-bold text-slate-800">欢迎使用 AI-Automated-Office</h2>
              <p className="text-slate-500">AI 赋能的企业 ERP 系统</p>
            </div>
          )
        ),
    }
  }, [activeActivityItem, children, descriptor, location.pathname, outlet])

  return (
    <main className={`flex-1 overflow-auto ${className}`} style={{ backgroundColor: '#F8FAFC' }}>
      <WorkbenchHostRenderer descriptor={resolvedDescriptor} context={pageContext} />
    </main>
  )
}
