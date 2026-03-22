import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { buildRuntimeContract, type DynamicFormSchema, type FormFieldRuntimeContract } from './formSchema'

export interface DynamicFormRendererProps {
  schema: DynamicFormSchema
  values?: Record<string, string>
  onChange?: (nextValues: Record<string, string>) => void
  onSubmit?: (values: Record<string, string>) => void
  submitLabel?: string
}

type SectionGroup = {
  title: string
  groups: Record<string, FormFieldRuntimeContract[]>
}

export function DynamicFormRenderer({
  schema,
  values,
  onChange,
  onSubmit,
  submitLabel,
}: DynamicFormRendererProps) {
  const [internalValues, setInternalValues] = useState<Record<string, string>>(values ?? {})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const runtimeFields = useMemo(() => buildRuntimeContract(schema, internalValues), [schema, internalValues])

  const grouped = useMemo<SectionGroup[]>(() => {
    const map = new Map<string, SectionGroup>()
    schema.fields.forEach((field) => {
      const section = field.section ?? 'General'
      const group = field.group ?? 'default'
      if (!map.has(section)) {
        map.set(section, { title: section, groups: {} })
      }
      const sectionGroup = map.get(section)!
      sectionGroup.groups[group] = sectionGroup.groups[group] ?? []
      const runtime = runtimeFields.find((runtimeField) => runtimeField.id === field.id)
      if (runtime) {
        sectionGroup.groups[group].push(runtime)
      }
    })
    return Array.from(map.values())
  }, [schema.fields, runtimeFields])

  const updateField = (fieldId: string, value: string) => {
    const nextValues = { ...internalValues, [fieldId]: value }
    setInternalValues(nextValues)
    setTouched((prev) => ({ ...prev, [fieldId]: true }))
    setErrors((prev) => ({ ...prev, [fieldId]: '' }))
    onChange?.(nextValues)
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        const nextErrors: Record<string, string> = {}
        runtimeFields.forEach((field) => {
          if (field.validation?.required && !internalValues[field.id]) {
            nextErrors[field.id] = field.validation.message ?? `${field.label} is required`
          }
        })
        setErrors(nextErrors)
        setTouched(
          runtimeFields.reduce<Record<string, boolean>>((acc, field) => {
            acc[field.id] = true
            return acc
          }, {})
        )
        if (Object.keys(nextErrors).length === 0) {
          onSubmit?.(internalValues)
        }
      }}
    >
      {grouped.map((section) => (
        <section key={section.title} className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">{section.title}</h3>
          {Object.entries(section.groups).map(([groupName, fields]) => (
            <div key={`${section.title}-${groupName}`} className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  onChange={updateField}
                  error={errors[field.id]}
                  showError={Boolean(touched[field.id])}
                />
              ))}
            </div>
          ))}
        </section>
      ))}

      {onSubmit && (
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            {submitLabel ?? 'Submit'}
          </button>
        </div>
      )}
    </form>
  )
}

function FieldRenderer({
  field,
  onChange,
  error,
  showError,
}: {
  field: FormFieldRuntimeContract
  onChange: (fieldId: string, value: string) => void
  error?: string
  showError?: boolean
}) {
  if (!field.canView) {
    return null
  }

  const isDisabled = !field.canEdit
  const hasRequired = field.validation?.required

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700" htmlFor={field.id}>
        {field.label}
        {hasRequired && <span className="ml-1 text-red-500">*</span>}
      </label>

      {field.type === 'input' && (
        <Input
          id={field.id}
          value={field.value}
          disabled={isDisabled}
          placeholder={field.validation?.message ?? field.label}
          onChange={(event) => onChange(field.id, event.target.value)}
        />
      )}

      {field.type === 'select' && (
        <Select value={field.value} onValueChange={(value) => onChange(field.id, value)} disabled={isDisabled}>
          <SelectTrigger id={field.id}>
            <SelectValue placeholder={field.label} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === 'date' && (
        <Input
          id={field.id}
          type="date"
          value={field.value}
          disabled={isDisabled}
          onChange={(event) => onChange(field.id, event.target.value)}
        />
      )}

      {field.type === 'attachment' && (
        <Input
          id={field.id}
          type="file"
          disabled={isDisabled}
          onChange={(event) => onChange(field.id, event.target.value)}
        />
      )}

      {field.type === 'computed' && (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Checkbox checked={Boolean(field.value)} disabled />
          <span>{field.value || 'Computed value pending'}</span>
        </div>
      )}

      {showError && error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
