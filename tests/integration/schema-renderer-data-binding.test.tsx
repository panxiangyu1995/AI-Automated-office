import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SchemaRenderer, type SchemaDocument } from '@/features/schema/runtime/schemaRenderer'

describe('Schema renderer data binding and conditional rendering', () => {
  it('binds values from runtime data and supports conditional display', async () => {
    const document: SchemaDocument = {
      id: 'doc-binding',
      nodes: [
        { id: 'name', type: 'text', bind: 'user.name' },
        { id: 'visible', type: 'text', content: 'Visible block', visibleWhen: 'flags.showBlock' },
        { id: 'hidden', type: 'text', content: 'Hidden block', visibleWhen: '!flags.showBlock' },
      ],
    }

    render(
      <SchemaRenderer
        document={document}
        runtimeData={{
          user: { name: 'Alice' },
          flags: { showBlock: true },
        }}
      />
    )

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Visible block')).toBeInTheDocument()
    expect(screen.queryByText('Hidden block')).not.toBeInTheDocument()
  })

  it('supports repeat rendering and permission-aware filtering', async () => {
    const document: SchemaDocument = {
      id: 'doc-repeat',
      nodes: [
        {
          id: 'row',
          type: 'text',
          bind: 'label',
          repeat: 'items',
        },
        {
          id: 'edit-only',
          type: 'text',
          content: 'Edit-only node',
          requiredPermission: 'edit',
        },
      ],
    }

    render(
      <SchemaRenderer
        document={document}
        runtimeData={{
          items: [{ label: 'Item A' }, { label: 'Item B' }],
        }}
        permissionContext={{
          canView: true,
          canEdit: false,
        }}
      />
    )

    expect(await screen.findByText('Item A')).toBeInTheDocument()
    expect(screen.getByText('Item B')).toBeInTheDocument()
    expect(screen.queryByText('Edit-only node')).not.toBeInTheDocument()
  })

  it('reports unresolved binding paths through debug metadata before render execution', () => {
    const capturedMetadata: { validationErrors: string[] }[] = []
    const document: SchemaDocument = {
      id: 'doc-validation',
      nodes: [
        { id: 'missing-bind', type: 'text', bind: 'missing.path' },
        { id: 'missing-condition', type: 'text', visibleWhen: 'flags.notExists' },
      ],
    }

    render(
      <SchemaRenderer
        document={document}
        runtimeData={{ flags: {} }}
        onDebugMetadata={(metadata) => capturedMetadata.push({ validationErrors: metadata.validationErrors })}
      />
    )

    expect(capturedMetadata).toHaveLength(1)
    expect(capturedMetadata[0].validationErrors).toEqual([
      'Node missing-bind has unresolved bind path: missing.path',
      'Node missing-condition has unresolved visibleWhen path: flags.notExists',
    ])
  })
})
