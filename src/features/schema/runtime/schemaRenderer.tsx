import { Component, type ErrorInfo, type ReactNode } from 'react'

export type SchemaNodeType = 'stack' | 'text' | 'card' | 'divider'

export interface SchemaNode {
  id: string
  type: SchemaNodeType | string
  content?: string
  direction?: 'vertical' | 'horizontal'
  children?: SchemaNode[]
  debugThrow?: boolean
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
}

interface SchemaRendererProps {
  document: SchemaDocument
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

function renderSchemaNode(node: SchemaNode): ReactNode {
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
    return (
      <p
        key={node.id}
        data-schema-node-id={node.id}
        data-schema-node-type={node.type}
        className="text-sm leading-6 text-slate-700"
      >
        {node.content ?? ''}
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
        <div className="space-y-2">{(node.children ?? []).map((child) => renderSchemaNode(child))}</div>
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
      {(node.children ?? []).map((child) => renderSchemaNode(child))}
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

export function SchemaRenderer({ document, onDebugMetadata }: SchemaRendererProps) {
  const renderedNodeIds = collectNodeIds(document.nodes)
  onDebugMetadata?.({
    documentId: document.id,
    nodeCount: renderedNodeIds.length,
    renderedNodeIds,
  })

  return (
    <SchemaRendererErrorBoundary document={document}>
      <SchemaRendererContent document={document} />
    </SchemaRendererErrorBoundary>
  )
}

function SchemaRendererContent({ document }: { document: SchemaDocument }) {
  return (
    <div className="space-y-3" data-schema-document-id={document.id}>
      {document.title && <h3 className="text-base font-semibold text-slate-900">{document.title}</h3>}
      {document.nodes.map((node) => renderSchemaNode(node))}
    </div>
  )
}
