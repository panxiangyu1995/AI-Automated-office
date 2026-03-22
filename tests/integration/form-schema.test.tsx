import { describe, expect, it } from 'vitest'
import {
  applyDefaultValues,
  buildRuntimeContract,
  type DynamicFormSchema,
  validateFormSchema,
} from '@/features/forms/runtime/formSchema'

describe('Dynamic form schema', () => {
  it('validates required fields and select options', () => {
    const schema: DynamicFormSchema = {
      id: 'invoice',
      version: { version: '1.0.0' },
      fields: [
        {
          id: 'type',
          label: 'Type',
          type: 'select',
          options: [],
        },
      ],
    }

    expect(validateFormSchema(schema)).toEqual(['Field type must define select options'])
  })

  it('builds runtime contract with default values and permissions', () => {
    const schema: DynamicFormSchema = {
      id: 'expense',
      version: { version: '1.0.0' },
      fields: [
        {
          id: 'amount',
          label: 'Amount',
          type: 'input',
          defaultValue: '0',
          permission: { canView: true, canEdit: false },
        },
      ],
    }

    const contract = buildRuntimeContract(schema)
    expect(contract[0]).toMatchObject({
      id: 'amount',
      value: '0',
      canView: true,
      canEdit: false,
    })
  })

  it('applies default values across all fields', () => {
    const schema: DynamicFormSchema = {
      id: 'profile',
      version: { version: '1.0.0' },
      fields: [
        { id: 'name', label: 'Name', type: 'input', defaultValue: 'N/A' },
        { id: 'role', label: 'Role', type: 'input' },
      ],
    }

    expect(applyDefaultValues(schema)).toEqual({ name: 'N/A', role: '' })
  })
})

