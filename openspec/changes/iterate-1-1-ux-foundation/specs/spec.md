# Spec: 前端UX基础组件体系建设

## 组件接口

### LoadingSkeleton

```typescript
// 预设骨架屏
export function PageSkeleton(): JSX.Element
export function CardSkeleton({ rows?: number }: { rows?: number }): JSX.Element
export function TableSkeleton({ rows?: number, cols?: number }: { rows?: number; cols?: number }): JSX.Element
export function FormSkeleton({ fields?: number }: { fields?: number }): JSX.Element
export function ChatSkeleton({ messages?: number }: { messages?: number }): JSX.Element
```

### EmptyState

```typescript
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  variant?: 'default' | 'search' | 'data' | 'error'
}
export function EmptyState(props: EmptyStateProps): JSX.Element
```

### ErrorBoundary

```typescript
interface ErrorBoundaryProps {
  fallback?: ReactNode
  children: ReactNode
}
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  // 捕获子组件错误，展示fallback或默认错误页面
}
export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps): JSX.Element
```

### FormField

```typescript
interface FormFieldProps {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'number' | 'switch'
  placeholder?: string
  description?: string
  options?: { label: string; value: string }[]
  control: Control
  rules?: ZodSchema
}
export function FormField(props: FormFieldProps): JSX.Element
```

## 验收标准

1. 所有组件TypeScript编译零错误
2. npm run build 成功
3. LoadingSkeleton各预设可渲染
4. EmptyState各变体可渲染
5. ErrorBoundary能捕获错误并展示fallback
6. FormField可与react-hook-form配合使用
7. 不影响现有任何页面功能
