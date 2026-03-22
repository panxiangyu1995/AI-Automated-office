import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DetailSectionRenderer } from '@/features/forms/runtime/DetailSectionRenderer'
import type { DetailSectionSchema } from '@/features/forms/runtime/detailSectionSchema'

describe('Detail section renderer', () => {
  const baseSchema: DetailSectionSchema = {
    id: 'employee-detail',
    title: 'Employee Details',
    version: { version: '1.0.0' },
    sections: [
      {
        id: 'basic-info',
        title: 'Basic Information',
        order: 1,
        layout: 'grid',
        columns: 2,
        blocks: [
          { id: 'name-field', type: 'field', fieldId: 'name' },
          { id: 'email-field', type: 'field', fieldId: 'email' },
        ],
      },
    ],
    fields: [
      { id: 'name', label: 'Name', type: 'input' },
      { id: 'email', label: 'Email', type: 'input' },
      { id: 'department', label: 'Department', type: 'input' },
    ],
  }

  const baseData = {
    name: 'John Doe',
    email: 'john@example.com',
    department: 'Engineering',
  }

  it('renders field blocks with data', () => {
    render(<DetailSectionRenderer schema={baseSchema} data={baseData} />)

    expect(screen.getByText('Employee Details')).toBeInTheDocument()
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('renders attachment blocks', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'attachments',
          title: 'Attachments',
          order: 1,
          blocks: [
            {
              id: 'docs',
              type: 'attachment',
              label: 'Documents',
              bind: 'attachments',
            },
          ],
        },
      ],
    }

    const data = {
      ...baseData,
      attachments: [
        { id: '1', name: 'resume.pdf' },
        { id: '2', name: 'contract.pdf' },
      ],
    }

    render(<DetailSectionRenderer schema={schema} data={data} />)

    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    expect(screen.getByText('contract.pdf')).toBeInTheDocument()
  })

  it('renders relation blocks', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'relations',
          title: 'Related Items',
          order: 1,
          blocks: [
            {
              id: 'projects',
              type: 'relation',
              label: 'Projects',
              bind: 'projects',
              relationType: 'one-to-many',
              displayFields: ['name'],
            },
          ],
        },
      ],
    }

    const data = {
      ...baseData,
      projects: [
        { id: 'p1', name: 'Project Alpha' },
        { id: 'p2', name: 'Project Beta' },
      ],
    }

    render(<DetailSectionRenderer schema={schema} data={data} />)

    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    expect(screen.getByText('Project Beta')).toBeInTheDocument()
  })

  it('renders timeline blocks', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'timeline',
          title: 'Activity Timeline',
          order: 1,
          blocks: [
            {
              id: 'history',
              type: 'timeline',
              label: 'History',
              bind: 'events',
              dateField: 'date',
              titleField: 'action',
              descriptionField: 'detail',
            },
          ],
        },
      ],
    }

    const data = {
      ...baseData,
      events: [
        { id: 'e1', date: '2024-01-15', action: 'Created', detail: 'Record created' },
        { id: 'e2', date: '2024-01-20', action: 'Updated', detail: 'Email changed' },
      ],
    }

    render(<DetailSectionRenderer schema={schema} data={data} />)

    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })

  it('respects section-level visibility conditions', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'hidden-section',
          title: 'Hidden Section',
          order: 1,
          visibleWhen: 'showSecret',
          blocks: [{ id: 'secret', type: 'field', fieldId: 'name' }],
        },
        {
          id: 'visible-section',
          title: 'Visible Section',
          order: 2,
          blocks: [{ id: 'public', type: 'field', fieldId: 'email' }],
        },
      ],
    }

    const data = { ...baseData, showSecret: false }

    render(<DetailSectionRenderer schema={schema} data={data} />)

    expect(screen.queryByText('Hidden Section')).toBeNull()
    expect(screen.getByText('Visible Section')).toBeInTheDocument()
  })

  it('respects block-level visibility conditions', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'test-section',
          title: 'Test Section',
          order: 1,
          blocks: [
            { id: 'visible-field', type: 'field', fieldId: 'name' },
            { id: 'hidden-field', type: 'field', fieldId: 'email', visibleWhen: 'showEmail' },
          ],
        },
      ],
    }

    const data = { ...baseData, showEmail: false }

    render(<DetailSectionRenderer schema={schema} data={data} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.queryByText('Email')).toBeNull()
  })

  it('respects permission context for view access', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'restricted',
          title: 'Restricted Section',
          order: 1,
          blocks: [
            {
              id: 'sensitive',
              type: 'field',
              fieldId: 'name',
              requiredPermission: 'edit',
            },
          ],
        },
      ],
    }

    render(
      <DetailSectionRenderer
        schema={schema}
        data={baseData}
        permissionContext={{ canView: true, canEdit: false }}
      />
    )

    // Field should be hidden because edit permission is required
    expect(screen.queryByText('Name')).toBeNull()
  })

  it('renders nested group blocks', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'grouped-section',
          title: 'Grouped Section',
          order: 1,
          blocks: [
            {
              id: 'group1',
              type: 'group',
              title: 'Personal Info',
              layout: 'horizontal',
              children: [
                { id: 'name-field', type: 'field', fieldId: 'name' },
                { id: 'email-field', type: 'field', fieldId: 'email' },
              ],
            },
          ],
        },
      ],
    }

    render(<DetailSectionRenderer schema={schema} data={baseData} />)

    expect(screen.getByText('Personal Info')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders divider blocks', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'divider-section',
          title: 'Divider Test',
          order: 1,
          blocks: [
            { id: 'field1', type: 'field', fieldId: 'name' },
            { id: 'div1', type: 'divider' },
            { id: 'field2', type: 'field', fieldId: 'email' },
          ],
        },
      ],
    }

    render(<DetailSectionRenderer schema={schema} data={baseData} />)

    const divider = document.querySelector('.divider-block')
    expect(divider).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'empty-section',
          title: 'Empty Section',
          order: 1,
          blocks: [
            { id: 'empty-attachments', type: 'attachment', label: 'Files' },
            { id: 'empty-relations', type: 'relation', relationType: 'one-to-many', label: 'Related' },
            { id: 'empty-timeline', type: 'timeline', label: 'History' },
          ],
        },
      ],
    }

    render(<DetailSectionRenderer schema={schema} data={{}} />)

    expect(screen.getByText('No attachments')).toBeInTheDocument()
    expect(screen.getByText('No related items')).toBeInTheDocument()
    expect(screen.getByText('No timeline events')).toBeInTheDocument()
  })

  it('supports custom renderers', () => {
    const CustomFieldRenderer = vi.fn(({ field, value }) => (
      <div data-testid="custom-field">
        Custom: {field?.label} = {String(value)}
      </div>
    ))

    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        {
          id: 'custom-section',
          title: 'Custom Section',
          order: 1,
          blocks: [{ id: 'custom-field', type: 'field', fieldId: 'name' }],
        },
      ],
    }

    render(
      <DetailSectionRenderer
        schema={schema}
        data={baseData}
        customRenderers={{ field: CustomFieldRenderer }}
      />
    )

    expect(screen.getByTestId('custom-field')).toBeInTheDocument()
    expect(screen.getByText('Custom: Name = John Doe')).toBeInTheDocument()
  })

  it('orders sections by order property', () => {
    const schema: DetailSectionSchema = {
      ...baseSchema,
      sections: [
        { id: 'third', title: 'Third Section', order: 3, blocks: [] },
        { id: 'first', title: 'First Section', order: 1, blocks: [] },
        { id: 'second', title: 'Second Section', order: 2, blocks: [] },
      ],
    }

    render(<DetailSectionRenderer schema={schema} data={baseData} />)

    const sections = screen.getAllByRole('heading', { level: 3 })
    expect(sections[0]).toHaveTextContent('First Section')
    expect(sections[1]).toHaveTextContent('Second Section')
    expect(sections[2]).toHaveTextContent('Third Section')
  })
})

describe('Detail section schema utilities', () => {
  it('validates schema and returns errors', async () => {
    const { validateDetailSectionSchema } = await import(
      '@/features/forms/runtime/detailSectionSchema'
    )

    const invalidSchema = {
      id: '',
      version: { version: '' },
      sections: [
        {
          id: '',
          blocks: [
            { id: '', type: 'field' }, // missing fieldId
            { id: 'rel', type: 'relation' }, // missing relationType
            { id: 'grp', type: 'group', children: [] }, // empty children
          ],
        },
      ],
      fields: [],
    } as unknown as Parameters<typeof validateDetailSectionSchema>[0]

    const errors = validateDetailSectionSchema(invalidSchema)

    expect(errors).toContain('Schema id is required')
    expect(errors).toContain('Schema version is required')
    expect(errors).toContain('Section 0 id is required')
  })

  it('builds runtime contract with correct permissions', async () => {
    const { buildDetailSectionRuntimeContract } = await import(
      '@/features/forms/runtime/detailSectionSchema'
    )

    const schema = {
      id: 'test',
      version: { version: '1.0.0' },
      sections: [
        {
          id: 'section1',
          order: 1,
          blocks: [
            { id: 'field1', type: 'field' as const, fieldId: 'name' },
            {
              id: 'field2',
              type: 'field' as const,
              fieldId: 'secret',
              requiredPermission: 'edit' as const,
            },
          ],
        },
      ],
      fields: [],
    }

    const contract = buildDetailSectionRuntimeContract(
      schema,
      {},
      { canView: true, canEdit: false }
    )

    expect(contract).toHaveLength(1)
    expect(contract[0].blocks).toHaveLength(2)
    expect(contract[0].blocks[0].canView).toBe(true)
    expect(contract[0].blocks[1].canView).toBe(false) // requires edit permission
  })
})
