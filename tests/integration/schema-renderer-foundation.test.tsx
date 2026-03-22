import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SchemaRenderer, type SchemaDocument, type SchemaRendererDebugMetadata } from '@/features/schema/runtime/schemaRenderer'

describe('Schema renderer foundation', () => {
  it('renders baseline layout and component nodes', async () => {
    const document: SchemaDocument = {
      id: 'doc-1',
      title: 'Renderer Doc',
      nodes: [
        {
          id: 'stack-root',
          type: 'stack',
          direction: 'vertical',
          children: [
            { id: 'text-1', type: 'text', content: 'Hello renderer' },
            {
              id: 'card-1',
              type: 'card',
              children: [{ id: 'text-2', type: 'text', content: 'Card content' }],
            },
            { id: 'divider-1', type: 'divider' },
          ],
        },
      ],
    }

    render(<SchemaRenderer document={document} />)

    expect(await screen.findByText('Renderer Doc')).toBeInTheDocument()
    expect(screen.getByText('Hello renderer')).toBeInTheDocument()
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders fallback output for non-whitelisted nodes', async () => {
    const document: SchemaDocument = {
      id: 'doc-unsupported',
      nodes: [{ id: 'custom-node', type: 'custom-widget' }],
    }

    render(<SchemaRenderer document={document} />)

    expect(await screen.findByText('Unsupported schema node: custom-widget')).toBeInTheDocument()
  })

  it('isolates renderer failures through error boundary', async () => {
    const document: SchemaDocument = {
      id: 'doc-error',
      nodes: [{ id: 'bad-node', type: 'text', debugThrow: true }],
    }

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<SchemaRenderer document={document} />)

    expect(await screen.findByText(/Schema renderer error:/)).toBeInTheDocument()
    consoleError.mockRestore()
  })

  it('emits debug metadata for rendered node tree', () => {
    const metadataSpy = vi.fn<(metadata: SchemaRendererDebugMetadata) => void>()
    const document: SchemaDocument = {
      id: 'doc-debug',
      nodes: [
        {
          id: 'stack-debug',
          type: 'stack',
          children: [{ id: 'text-debug', type: 'text', content: 'debug' }],
        },
      ],
    }

    render(<SchemaRenderer document={document} onDebugMetadata={metadataSpy} />)

    expect(metadataSpy).toHaveBeenCalledTimes(1)
    expect(metadataSpy).toHaveBeenCalledWith({
      documentId: 'doc-debug',
      nodeCount: 2,
      renderedNodeIds: ['stack-debug', 'text-debug'],
      validationErrors: [],
    })
  })
})
