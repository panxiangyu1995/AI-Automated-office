import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'

export type SchemaNodeType = 'stack' | 'text' | 'card' | 'divider'

export interface SchemaNode {
  id: string
  type: SchemaNodeType | string
  content?: string
  direction?: 'vertical' | 'horizontal'
  children?: SchemaNode[]
  debugThrow?: boolean
  bind?: string
  visibleWhen?: string
  repeat?: string
  requiredPermission?: 'view' | 'edit'
}

export interface SchemaDocument {
  id: string
  title?: string
  nodes: SchemaNode[]
}

export interface SchemaRendererDebugMetadata {
  documentId: string
  nodeCount: number
  renderedNodeIds: string[]
  validationErrors: string[]
}

interface SchemaRendererProps {
  document: SchemaDocument
  runtimeData?: Record<string, unknown>
  permissionContext?: {
    canView: boolean
    canEdit: boolean
  }
  onDebugMetadata?: (metadata: SchemaRendererDebugMetadata) => void
}

interface SchemaRendererErrorBoundaryProps {
  document: SchemaDocument
  children: ReactNode
}

interface SchemaRendererErrorBoundaryState {
  error: Error | null
}

const WHITELIST_NODE_TYPES: SchemaNodeType[] = ['stack', 'text', 'card', 'divider']

function collectNodeIds(nodes: SchemaNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectNodeIds(node.children ?? [])])
}

function isWhitelistedNodeType(type: string): type is SchemaNodeType {
  return WHITELIST_NODE_TYPES.includes(type as SchemaNodeType)
}

function getPathValue(data: unknown, path: string): unknown {
  if (!path) {
    return undefined
  }

  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined || typeof acc !== 'object') {
      return undefined
    }

    return (acc as Record<string, unknown>)[segment]
  }, data)
}

function evaluateVisibility(expression: string, data: unknown): boolean {
  const trimmed = expression.trim()
  if (!trimmed) {
    return true
  }

  if (trimmed.startsWith('!')) {
    return !getPathValue(data, trimmed.slice(1))
  }

  return !!getPathValue(data, trimmed)
}

function canRenderByPermission(
  node: SchemaNode,
  permissionContext: NonNullable<SchemaRendererProps['permissionContext']>
): boolean {
  if (!node.requiredPermission) {
    return true
  }

  if (node.requiredPermission === 'edit') {
    return permissionContext.canEdit
  }

  return permissionContext.canView
}

function renderSchemaNode(
  node: SchemaNode,
  data: unknown,
  permissionContext: NonNullable<SchemaRendererProps['permissionContext']>
): ReactNode {
  if (!canRenderByPermission(node, permissionContext)) {
    return null
  }

  if (node.visibleWhen && !evaluateVisibility(node.visibleWhen, data)) {
    return null
  }

  if (node.repeat) {
    const collection = getPathValue(data, node.repeat)
    if (!Array.isArray(collection)) {
      return null
    }

    return (
      <Fragment key={node.id}>
        {collection.map((item, index) => {
          const repeatedNode: SchemaNode = {
            ...node,
            id: `${node.id}-${index}`,
            repeat: undefined,
          }
          return renderSchemaNode(repeatedNode, item, permissionContext)
        })}
      </Fragment>
    )
  }

  if (!isWhitelistedNodeType(node.type)) {
    return (
      <div
        key={node.id}
        data-schema-node-id={node.id}
        data-schema-node-type={node.type}
        className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
      >
        Unsupported schema node: {node.type}
      </div>
    )
  }

  if (node.debugThrow) {
    throw new Error(`Schema node ${node.id} forced a renderer error`)
  }

  if (node.type === 'text') {
    const boundValue = node.bind ? getPathValue(data, node.bind) : undefined
    const resolvedContent = boundValue === undefined || boundValue === null ? node.content ?? '' : String(boundValue)

    return (
      <p
        key={node.id}
        data-schema-node-id={node.id}
        data-schema-node-type={node.type}
        className="text-sm leading-6 text-slate-700"
      >
        {resolvedContent}
      </p>
    )
  }

  if (node.type === 'divider') {
    return (
      <hr
        key={node.id}
        data-schema-node-id={node.id}
        data-schema-node-type={node.type}
        className="border-t border-slate-200"
      />
    )
  }

  if (node.type === 'card') {
    return (
      <section
        key={node.id}
        data-schema-node-id={node.id}
        data-schema-node-type={node.type}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="space-y-2">{(node.children ?? []).map((child) => renderSchemaNode(child, data, permissionContext))}</div>
      </section>
    )
  }

  const stackClass = node.direction === 'horizontal' ? 'flex-row items-start' : 'flex-col'
  return (
    <div
      key={node.id}
      data-schema-node-id={node.id}
      data-schema-node-type={node.type}
      className={`flex gap-3 ${stackClass}`}
    >
      {(node.children ?? []).map((child) => renderSchemaNode(child, data, permissionContext))}
    </div>
  )
}

class SchemaRendererErrorBoundary extends Component<
  SchemaRendererErrorBoundaryProps,
  SchemaRendererErrorBoundaryState
> {
  state: SchemaRendererErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): SchemaRendererErrorBoundaryState {
    return { error }
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Keeping boundary behavior local; the caller can inspect fallback in tests or UI.
  }

  componentDidUpdate(prevProps: SchemaRendererErrorBoundaryProps) {
    if (prevProps.document.id !== this.props.document.id && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Schema renderer error: {this.state.error.message}
        </div>
      )
    }

    return this.props.children
  }
}

export function SchemaRenderer({
  document,
  runtimeData = {},
  permissionContext = {
    canView: true,
    canEdit: true,
  },
  onDebugMetadata,
}: SchemaRendererProps) {
  const validationErrors = collectSchemaBindingErrors(document, runtimeData)
  const renderedNodeIds = collectNodeIds(document.nodes)
  onDebugMetadata?.({
    documentId: document.id,
    nodeCount: renderedNodeIds.length,
    renderedNodeIds,
    validationErrors,
  })

  return (
    <SchemaRendererErrorBoundary document={document}>
      <SchemaRendererContent document={document} runtimeData={runtimeData} permissionContext={permissionContext} />
    </SchemaRendererErrorBoundary>
  )
}

function SchemaRendererContent({
  document,
  runtimeData,
  permissionContext,
}: {
  document: SchemaDocument
  runtimeData: unknown
  permissionContext: NonNullable<SchemaRendererProps['permissionContext']>
}) {
  return (
    <div className="space-y-3" data-schema-document-id={document.id}>
      {document.title && <h3 className="text-base font-semibold text-slate-900">{document.title}</h3>}
      {document.nodes.map((node) => renderSchemaNode(node, runtimeData, permissionContext))}
    </div>
  )
}

function collectSchemaBindingErrors(document: SchemaDocument, runtimeData: unknown): string[] {
  const errors: string[] = []

  const visitNode = (node: SchemaNode) => {
    const checkPath = (path: string | undefined, field: 'bind' | 'repeat' | 'visibleWhen') => {
      if (!path) {
        return
      }

      const normalized = field === 'visibleWhen' && path.startsWith('!') ? path.slice(1) : path
      if (!normalized) {
        return
      }

      const value = getPathValue(runtimeData, normalized)
      if (value === undefined) {
        errors.push(`Node ${node.id} has unresolved ${field} path: ${path}`)
      }
    }

    checkPath(node.bind, 'bind')
    checkPath(node.repeat, 'repeat')
    checkPath(node.visibleWhen, 'visibleWhen')
    ;(node.children ?? []).forEach(visitNode)
  }

  document.nodes.forEach(visitNode)
  return errors
}
