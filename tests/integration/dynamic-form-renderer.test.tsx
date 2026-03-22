import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DynamicFormRenderer } from '@/features/forms/runtime/DynamicFormRenderer'
import type { DynamicFormSchema } from '@/features/forms/runtime/formSchema'

describe('Dynamic form renderer', () => {
  it('renders fields and emits change events', () => {
    const schema: DynamicFormSchema = {
      id: 'expense',
      title: 'Expense Form',
      version: { version: '1.0.0' },
      fields: [
        { id: 'title', label: 'Title', type: 'input', defaultValue: 'Trip', section: 'Base' },
        { id: 'type', label: 'Type', type: 'select', options: ['Travel', 'Meal'], section: 'Base' },
        { id: 'date', label: 'Date', type: 'date', section: 'Meta' },
      ],
    }
    const onChange = vi.fn()

    render(<DynamicFormRenderer schema={schema} onChange={onChange} />)

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'Taxi' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'Taxi' }))
  })

  it('respects field permissions and layout groups', () => {
    const schema: DynamicFormSchema = {
      id: 'approval',
      version: { version: '1.0.0' },
      fields: [
        {
          id: 'amount',
          label: 'Amount',
          type: 'input',
          permission: { canView: true, canEdit: false },
          section: 'Finance',
          group: 'A',
        },
        {
          id: 'hidden',
          label: 'Hidden',
          type: 'input',
          permission: { canView: false, canEdit: false },
          section: 'Finance',
          group: 'B',
        },
      ],
    }

    render(<DynamicFormRenderer schema={schema} />)

    expect(screen.getByText('Finance')).toBeInTheDocument()
    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement
    expect(amountInput.disabled).toBe(true)
    expect(screen.queryByLabelText('Hidden')).toBeNull()
  })

  it('blocks submit when required validation fails and calls onSubmit when valid', () => {
    const schema: DynamicFormSchema = {
      id: 'profile',
      version: { version: '1.0.0' },
      fields: [
        { id: 'name', label: 'Name', type: 'input', validation: { required: true } },
      ],
    }
    const onSubmit = vi.fn()

    render(<DynamicFormRenderer schema={schema} onSubmit={onSubmit} submitLabel="Send" />)

    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    const input = screen.getByLabelText(/Name/) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Amy' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Amy' }))
  })
})
