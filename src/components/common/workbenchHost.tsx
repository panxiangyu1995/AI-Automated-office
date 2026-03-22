import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, FileCog, LayoutTemplate } from 'lucide-react'
import type { ActivityBarItem } from '../../stores/uiStore'

export type WorkbenchHostMode = 'static' | 'dynamic' | 'editor'
export type WorkbenchPageOpenMode = WorkbenchHostMode

export type WorkbenchFieldPermission = 'hidden' | 'readonly' | 'editable'

export interface WorkbenchDataSourceContext {
  sourceType: 'route' | 'api' | 'memory' | 'plugin'
  sourceId: string
  query: Record<string, string>
}

export interface WorkbenchPermissionContext {
  canView: boolean
  canEdit: boolean
  requiredPermissions: string[]
  fieldPermissions: Record<string, WorkbenchFieldPermission>
}

export interface WorkbenchPageContext {
  routeId: string
  resourceId: string
  openMode: WorkbenchPageOpenMode
  route: string
  params: Readonly<Record<string, string | undefined>>
  searchParams: URLSearchParams
  dataSource: WorkbenchDataSourceContext
  activeActivityItem: ActivityBarItem
  permission: WorkbenchPermissionContext
}

export interface WorkbenchHostLifecycleCallbacks {
  onBeforeOpen?: (context: WorkbenchPageContext) => void
  onAfterOpen?: (context: WorkbenchPageContext) => void
  onBeforeClose?: (context: WorkbenchPageContext) => void
  onAfterClose?: (context: WorkbenchPageContext) => void
  onError?: (error: Error, context: WorkbenchPageContext) => void
}

export interface WorkbenchHostDescriptor {
  id: string
  title: string
  mode: WorkbenchHostMode
  render?: (context: WorkbenchPageContext) => ReactNode
  lifecycle?: WorkbenchHostLifecycleCallbacks
  onMount?: (context: WorkbenchPageContext) => void
  onUnmount?: (context: WorkbenchPageContext) => void
  onError?: (error: Error, context: WorkbenchPageContext) => void
}

interface WorkbenchHostRendererProps {
  descriptor: WorkbenchHostDescriptor
  context: WorkbenchPageContext
}

interface WorkbenchHostErrorBoundaryProps extends WorkbenchHostRendererProps {
  children?: ReactNode
}

interface WorkbenchHostErrorBoundaryState {
  error: Error | null
}

export class WorkbenchHostErrorBoundary extends Component<
  WorkbenchHostErrorBoundaryProps,
  WorkbenchHostErrorBoundaryState
> {
  state: WorkbenchHostErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): WorkbenchHostErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    this.props.descriptor.lifecycle?.onError?.(error, this.props.context)
    this.props.descriptor.onError?.(error, this.props.context)
  }

  componentDidUpdate(prevProps: WorkbenchHostErrorBoundaryProps) {
    if (prevProps.descriptor.id !== this.props.descriptor.id && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return <WorkbenchHostFallback mode={this.props.descriptor.mode} title={this.props.descriptor.title} />
    }

    return this.props.children
  }
}

export function WorkbenchHostRenderer({ descriptor, context }: WorkbenchHostRendererProps) {
  useEffect(() => {
    descriptor.lifecycle?.onBeforeOpen?.(context)
    descriptor.onMount?.(context)
    descriptor.lifecycle?.onAfterOpen?.(context)

    return () => {
      descriptor.lifecycle?.onBeforeClose?.(context)
      descriptor.onUnmount?.(context)
      descriptor.lifecycle?.onAfterClose?.(context)
    }
  }, [descriptor, context])

  return (
    <WorkbenchHostErrorBoundary descriptor={descriptor} context={context}>
      <WorkbenchHostContent descriptor={descriptor} context={context} />
    </WorkbenchHostErrorBoundary>
  )
}

function WorkbenchHostContent({ descriptor, context }: WorkbenchHostRendererProps) {
  return descriptor.render?.(context) ?? <WorkbenchModePlaceholder mode={descriptor.mode} title={descriptor.title} />
}

function WorkbenchModePlaceholder({
  mode,
  title,
}: {
  mode: WorkbenchHostMode
  title: string
}) {
  if (mode === 'dynamic') {
    return (
      <WorkbenchHostSurface
        icon={<LayoutTemplate className="h-8 w-8 text-slate-500" />}
        title={title}
        description="Dynamic page host is ready to accept schema-driven content."
      />
    )
  }

  if (mode === 'editor') {
    return (
      <WorkbenchHostSurface
        icon={<FileCog className="h-8 w-8 text-slate-500" />}
        title={title}
        description="Editor host is ready to accept built-in or extension editors."
      />
    )
  }

  return null
}

function WorkbenchHostFallback({
  mode,
  title,
}: {
  mode: WorkbenchHostMode
  title: string
}) {
  return (
    <WorkbenchHostSurface
      icon={<AlertTriangle className="h-8 w-8 text-amber-600" />}
      title={`${title} unavailable`}
      description={`The ${mode} host hit a runtime error. Reload or switch to another page.`}
    />
  )
}

function WorkbenchHostSurface({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center p-8">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}
