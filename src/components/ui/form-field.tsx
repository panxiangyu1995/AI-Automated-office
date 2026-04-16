import type { Control, FieldValues, Path, ControllerRenderProps } from 'react-hook-form'
import { Controller, useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BaseFormFieldProps<T extends FieldValues> {
  name: Path<T>
  label: string
  description?: string
  className?: string
  control?: Control<T>
}

interface TextFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  type: 'text' | 'number'
  placeholder?: string
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  type: 'textarea'
  placeholder?: string
  rows?: number
}

interface SelectFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  type: 'select'
  options: { label: string; value: string }[]
  placeholder?: string
}

interface SwitchFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  type: 'switch'
}

type FormFieldProps<T extends FieldValues> =
  | TextFieldProps<T>
  | TextareaFieldProps<T>
  | SelectFieldProps<T>
  | SwitchFieldProps<T>

export function FormField<T extends FieldValues>(props: FormFieldProps<T>) {
  const ctx = useFormContext<T>()
  const control = props.control ?? ctx?.control
  if (!control) return null

  const { name, label, description, className } = props

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-2', className)}>
          <div className="flex items-center justify-between">
            <Label htmlFor={name} style={{ color: 'var(--ao-editor-foreground, var(--ao-bottomPanel.activeBackground))' }}>
              {label}
            </Label>
            {fieldState.error && (
              <span
                className="text-xs"
                style={{ color: 'var(--ao-inputValidation-errorForeground, var(--ao-errorForeground))' }}
              >
                {fieldState.error.message}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs" style={{ color: 'var(--ao-editor-foreground, var(--ao-workbench.secondaryForeground))' }}>
              {description}
            </p>
          )}
          {renderInput(props, field)}
        </div>
      )}
    />
  )
}

function renderInput<T extends FieldValues>(props: FormFieldProps<T>, field: ControllerRenderProps<T>) {
  switch (props.type) {
    case 'text':
      return (
        <Input
          id={props.name}
          placeholder={props.placeholder}
          {...field}
          value={field.value ?? ''}
        />
      )
    case 'number':
      return (
        <Input
          id={props.name}
          type="number"
          placeholder={props.placeholder}
          {...field}
          value={field.value ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
          }}
        />
      )
    case 'textarea':
      return (
        <Textarea
          id={props.name}
          placeholder={props.placeholder}
          rows={props.rows ?? 3}
          {...field}
          value={field.value ?? ''}
        />
      )
    case 'select':
      return (
        <Select value={field.value ?? ''} onValueChange={field.onChange}>
          <SelectTrigger id={props.name}>
            <SelectValue placeholder={props.placeholder ?? '请选择'} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'switch':
      return (
        <Switch id={props.name} checked={field.value ?? false} onCheckedChange={field.onChange} />
      )
    default:
      return null
  }
}
