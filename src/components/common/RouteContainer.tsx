import { useEffect, useMemo, type ComponentType } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ForbiddenPage } from '@/components/permission'
import { usePermission } from '@/features/permission/hooks'
import { useUIStore } from '@/stores/uiStore'
import {
  WorkbenchHostRenderer,
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
  component?: ComponentType
  resolveDescriptor?: (context: WorkbenchPageContext) => WorkbenchHostDescriptor
}

interface RouteContainerProps {
  route: WorkbenchRouteDefinition
}

export function RouteContainer({ route }: RouteContainerProps) {
  const location = useLocation()
  const params = useParams()
  const { activeActivityItem, registerRecentSidebarEntry } = useUIStore()
  const { hasPermission } = usePermission()

  const hasAccess = route.requiredPermission ? hasPermission(route.requiredPermission) : true

  const pageContext = useMemo<WorkbenchPageContext>(
    () => ({
      route: location.pathname,
      params,
      searchParams: new URLSearchParams(location.search),
      activeActivityItem,
      permission: {
        canView: hasAccess,
        canEdit: hasAccess,
        fieldPermissions: {},
      },
    }),
    [activeActivityItem, hasAccess, location.pathname, location.search, params]
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
