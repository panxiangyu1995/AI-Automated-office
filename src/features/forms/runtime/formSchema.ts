export type FormFieldType = 'input' | 'select' | 'date' | 'attachment' | 'computed'

export interface FieldValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  message?: string
}

export interface FieldPermission {
  canView: boolean
  canEdit: boolean
}

export interface FormFieldSchema {
  id: string
  label: string
  type: FormFieldType
  defaultValue?: string
  placeholder?: string
  options?: string[]
  validation?: FieldValidationRule
  visible?: boolean
  editable?: boolean
  permission?: FieldPermission
}

export interface FormSchemaVersion {
  version: string
  publishedAt?: string
}

export interface DynamicFormSchema {
  id: string
  title?: string
  version: FormSchemaVersion
  fields: FormFieldSchema[]
}

export interface FormFieldRuntimeContract {
  id: string
  label: string
  type: FormFieldType
  value: string
  canView: boolean
  canEdit: boolean
  validation?: FieldValidationRule
  options?: string[]
}

export function resolveFieldAccess(field: FormFieldSchema): FieldPermission {
  const canView = field.permission?.canView ?? field.visible ?? true
  const canEdit = field.permission?.canEdit ?? field.editable ?? true
  return { canView, canEdit }
}

export function buildRuntimeContract(schema: DynamicFormSchema, values?: Record<string, string>): FormFieldRuntimeContract[] {
  return schema.fields.map((field) => {
    const access = resolveFieldAccess(field)
    return {
      id: field.id,
      label: field.label,
      type: field.type,
      value: values?.[field.id] ?? field.defaultValue ?? '',
      canView: access.canView,
      canEdit: access.canEdit,
      validation: field.validation,
      options: field.options,
    }
  })
}

export function validateFormSchema(schema: DynamicFormSchema): string[] {
  const errors: string[] = []
  if (!schema.id) {
    errors.push('Schema id is required')
  }
  if (!schema.version?.version) {
    errors.push('Schema version is required')
  }

  schema.fields.forEach((field) => {
    if (!field.id) {
      errors.push('Field id is required')
    }
    if (!field.label) {
      errors.push(`Field ${field.id} label is required`)
    }
    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      errors.push(`Field ${field.id} must define select options`)
    }
  })

  return errors
}

export function applyDefaultValues(schema: DynamicFormSchema): Record<string, string> {
  return schema.fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.id] = field.defaultValue ?? ''
    return acc
  }, {})
}

