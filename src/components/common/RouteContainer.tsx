import { useEffect, useMemo, type ComponentType } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ForbiddenPage } from '@/components/permission'
import { usePermission } from '@/features/permission/hooks'
import { useUIStore } from '@/stores/uiStore'
import {
  WorkbenchHostRenderer,
  type WorkbenchDataSourceContext,
  type WorkbenchHostDescriptor,
  type WorkbenchHostMode,
  type WorkbenchPageContext,
} from './workbenchHost'

export interface WorkbenchRouteDefinition {
  id: string
  path: string
  title: string
  resource: string
  mode: WorkbenchHostMode
  requiredPermission?: string | string[]
  dataSource?: Partial<WorkbenchDataSourceContext>
  component?: ComponentType
  resolveDescriptor?: (context: WorkbenchPageContext) => WorkbenchHostDescriptor
}

interface RouteContainerProps {
  route: WorkbenchRouteDefinition
}

export function RouteContainer({ route }: RouteContainerProps) {
  const location = useLocation()
  const params = useParams()
  const activeActivityItem = useUIStore((state) => state.activeActivityItem)
  const registerRecentSidebarEntry = useUIStore((state) => state.registerRecentSidebarEntry)
  const { hasPermission } = usePermission()

  const hasAccess = route.requiredPermission ? hasPermission(route.requiredPermission) : true
  const requiredPermissions = normalizeRequiredPermissions(route.requiredPermission)

  const pageContext = useMemo<WorkbenchPageContext>(
    () => ({
      routeId: route.id,
      resourceId: route.resource,
      openMode: route.mode,
      route: location.pathname,
      params,
      searchParams: new URLSearchParams(location.search),
      dataSource: {
        sourceType: route.dataSource?.sourceType ?? 'route',
        sourceId: route.dataSource?.sourceId ?? route.resource,
        query: route.dataSource?.query ?? Object.fromEntries(new URLSearchParams(location.search)),
      },
      activeActivityItem,
      permission: {
        canView: hasAccess,
        canEdit: hasAccess,
        requiredPermissions,
        fieldPermissions: {},
      },
    }),
    [activeActivityItem, hasAccess, location.pathname, location.search, params, requiredPermissions, route.dataSource?.query, route.dataSource?.sourceId, route.dataSource?.sourceType, route.id, route.mode, route.resource]
  )

  const requiredPermissionLabel = Array.isArray(route.requiredPermission)
    ? route.requiredPermission.join(' | ')
    : route.requiredPermission

  useEffect(() => {
    if (!hasAccess) {
      return
    }

    registerRecentSidebarEntry({
      id: route.id,
      label: route.title,
      description: route.resource,
      kind: 'recent',
      target: {
        path: location.pathname,
        mode: route.mode,
        activityItem: activeActivityItem,
      },
    })
  }, [activeActivityItem, hasAccess, location.pathname, registerRecentSidebarEntry, route.id, route.mode, route.resource, route.title])

  if (!hasAccess) {
    return (
      <ForbiddenPage
        resource={route.resource}
        requiredPermission={requiredPermissionLabel}
        message={`You do not have permission to access ${route.title}.`}
      />
    )
  }

  const descriptor = route.resolveDescriptor?.(pageContext) ?? createDefaultDescriptor(route)

  return <WorkbenchHostRenderer descriptor={descriptor} context={pageContext} />
}

function createDefaultDescriptor(route: WorkbenchRouteDefinition): WorkbenchHostDescriptor {
  return {
    id: route.id,
    title: route.title,
    mode: route.mode,
    render: () => {
      if (!route.component) {
        return undefined
      }

      const Component = route.component
      return <Component />
    },
  }
}

function normalizeRequiredPermissions(requiredPermission?: string | string[]): string[] {
  if (!requiredPermission) {
    return []
  }

  return Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
}
