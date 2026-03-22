import { useMemo } from 'react'
import {
  BarChart3,
  CheckSquare,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Minus,
  LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  buildCardLayoutRuntimeContract,
  type CardLayoutSchema,
  type CardBlock,
  type ChartCardBlock,
  type TodoCardBlock,
  type QuickEntryBlock,
  type MetricCardBlock,
  type ContainerBlock,
  type CardWritebackHandler,
  type FieldPermission,
} from './cardLayoutSchema'

export interface CardLayoutRendererProps {
  schema: CardLayoutSchema
  data?: Record<string, unknown>
  permissionContext?: FieldPermission
  onWriteback?: CardWritebackHandler
}

const WIDTH_CLASSES: Record<string, string> = {
  sm: 'col-span-1',
  md: 'col-span-2',
  lg: 'col-span-3',
  full: 'col-span-full',
}

const ICON_MAP: Record<string, LucideIcon> = {
  chart: BarChart3,
  todo: CheckSquare,
  'quick-entry': LayoutGrid,
  metric: TrendingUp,
}

export function CardLayoutRenderer({
  schema,
  data = {},
  permissionContext = { canView: true, canEdit: true },
  onWriteback,
}: CardLayoutRendererProps) {
  const sections = useMemo(
    () => buildCardLayoutRuntimeContract(schema, data, permissionContext),
    [schema, data, permissionContext]
  )

  return (
    <div className="space-y-6" data-card-layout-id={schema.id}>
      {schema.title && (
        <h2 className="text-lg font-semibold text-slate-900">{schema.title}</h2>
      )}
      {sections.map((section) => (
        <section key={section.id} className="space-y-4">
          {section.title && (
            <h3 className="text-sm font-medium text-slate-700">{section.title}</h3>
          )}
          <div
            className={`grid gap-${section.gap}`}
            style={{
              gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`,
            }}
          >
            {section.blocks.map((block) => (
              <CardBlockRenderer
                key={block.id}
                block={schema.sections
                  .flatMap((s) => s.blocks)
                  .find((b) => b.id === block.id)!}
                runtimeContract={block}
                data={data}
                onWriteback={onWriteback}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

interface CardBlockRendererProps {
  block: CardBlock
  runtimeContract: {
    id: string
    type: string
    canView: boolean
    canEdit: boolean
    visible: boolean
    width: 'sm' | 'md' | 'lg' | 'full'
  }
  data: Record<string, unknown>
  onWriteback?: CardWritebackHandler
}

function CardBlockRenderer({ block, runtimeContract, data, onWriteback }: CardBlockRendererProps) {
  if (!runtimeContract.canView || !runtimeContract.visible) {
    return null
  }

  const widthClass = WIDTH_CLASSES[runtimeContract.width]

  switch (block.type) {
    case 'chart':
      return (
        <ChartCard
          block={block as ChartCardBlock}
          data={data}
          widthClass={widthClass}
        />
      )
    case 'todo':
      return (
        <TodoCard
          block={block as TodoCardBlock}
          data={data}
          canEdit={runtimeContract.canEdit}
          widthClass={widthClass}
          onWriteback={onWriteback}
        />
      )
    case 'quick-entry':
      return (
        <QuickEntryCard
          block={block as QuickEntryBlock}
          widthClass={widthClass}
        />
      )
    case 'metric':
      return (
        <MetricCard
          block={block as MetricCardBlock}
          data={data}
          widthClass={widthClass}
        />
      )
    case 'container':
      return (
        <ContainerCard
          block={block as ContainerBlock}
          data={data}
          widthClass={widthClass}
        />
      )
    case 'divider':
      return (
        <div className={`${widthClass} col-span-full`}>
          <hr className="border-t border-slate-200" />
        </div>
      )
    default:
      return null
  }
}

function ChartCard({
  block,
  data,
  widthClass,
}: {
  block: ChartCardBlock
  data: Record<string, unknown>
  widthClass: string
}) {
  const chartData = block.bind ? (data[block.bind] as unknown[]) : []
  const Icon = ICON_MAP.chart ?? BarChart3

  return (
    <Card className={`${widthClass} min-h-[200px]`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-slate-500" />
          {block.title ?? 'Chart'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData && chartData.length > 0 ? (
          <div className="flex h-[140px] items-center justify-center rounded-md bg-slate-50">
            <div className="text-center text-sm text-slate-500">
              Chart: {block.chartType} ({chartData.length} data points)
            </div>
          </div>
        ) : (
          <div className="flex h-[140px] items-center justify-center rounded-md bg-slate-50">
            <div className="text-center text-sm text-slate-400">
              No chart data available
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TodoCard({
  block,
  data,
  canEdit,
  widthClass,
  onWriteback,
}: {
  block: TodoCardBlock
  data: Record<string, unknown>
  canEdit: boolean
  widthClass: string
  onWriteback?: CardWritebackHandler
}) {
  const todos = block.bind ? (data[block.bind] as Array<{ id: string; title: string; completed?: boolean }>) : []
  const displayTodos = block.maxItems ? todos?.slice(0, block.maxItems) : todos
  const Icon = ICON_MAP.todo ?? CheckSquare

  const handleToggle = (todoId: string, completed: boolean) => {
    if (canEdit && onWriteback) {
      onWriteback({
        type: 'card_update',
        cardId: block.id,
        data: { todoId, completed: !completed },
        timestamp: Date.now(),
      })
    }
  }

  return (
    <Card className={`${widthClass} min-h-[200px]`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-slate-500" />
          {block.title ?? 'Tasks'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayTodos && displayTodos.length > 0 ? (
          <ul className="space-y-2">
            {displayTodos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={todo.completed ?? false}
                  disabled={!canEdit}
                  onChange={() => handleToggle(todo.id, todo.completed ?? false)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span
                  className={
                    todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                  }
                >
                  {todo.title}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-[100px] items-center justify-center">
            <div className="text-sm text-slate-400">No tasks</div>
          </div>
        )}
        {canEdit && block.allowAdd && (
          <button className="mt-3 text-xs text-blue-600 hover:underline">
            + Add task
          </button>
        )}
      </CardContent>
    </Card>
  )
}

function QuickEntryCard({
  block,
  widthClass,
}: {
  block: QuickEntryBlock
  widthClass: string
}) {
  const Icon = ICON_MAP['quick-entry'] ?? LayoutGrid
  const columns = block.columns ?? 4
  const entries = block.entries ?? []

  return (
    <Card className={`${widthClass}`}>
      {block.title && (
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Icon className="h-4 w-4 text-slate-500" />
            {block.title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div
          className={`grid gap-3`}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {entries.map((entry) => {
            const EntryIcon = entry.icon ? ICON_MAP[entry.icon] : LayoutGrid
            return (
              <button
                key={entry.id}
                className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition-colors hover:bg-slate-100"
                onClick={() => {
                  if (entry.route) {
                    window.location.hash = entry.route
                  }
                }}
              >
                {EntryIcon && <EntryIcon className="h-5 w-5 text-slate-600" />}
                <span className="text-xs font-medium text-slate-700">{entry.label}</span>
              </button>
            )
          })}
          {entries.length === 0 && (
            <div className="col-span-full py-4 text-center text-sm text-slate-400">
              No quick actions configured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({
  block,
  data,
  widthClass,
}: {
  block: MetricCardBlock
  data: Record<string, unknown>
  widthClass: string
}) {
  const value = block.bind ? data[block.bind] : undefined
  let displayValue = value !== undefined ? String(value) : '--'

  if (block.format === 'currency') {
    displayValue = block.prefix + (typeof value === 'number' ? value.toLocaleString() : displayValue) + (block.suffix ?? '')
  } else if (block.format === 'percent') {
    displayValue = typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : displayValue
  } else if (block.format === 'number') {
    displayValue = typeof value === 'number' ? value.toLocaleString() : displayValue
  }

  const TrendIcon = block.trend === 'up' ? TrendingUp : block.trend === 'down' ? TrendingDown : Minus
  const trendColor = block.trend === 'up' ? 'text-green-600' : block.trend === 'down' ? 'text-red-600' : 'text-slate-500'

  return (
    <Card className={`${widthClass}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">{block.title ?? 'Metric'}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{displayValue}</p>
          </div>
          {block.trend && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              {block.trendValue && (
                <span className="text-xs font-medium">{block.trendValue}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ContainerCard({
  block,
  data,
  widthClass,
}: {
  block: ContainerBlock
  data: Record<string, unknown>
  widthClass: string
}) {
  const columns = block.columns ?? 2

  return (
    <Card className={`${widthClass}`}>
      {block.title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{block.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {block.children?.map((child) => (
            <div key={child.id} className="col-span-1">
              <CardBlockRenderer
                block={child}
                runtimeContract={{
                  id: child.id,
                  type: child.type,
                  canView: true,
                  canEdit: true,
                  visible: true,
                  width: 'width' in child ? (child.width as 'sm' | 'md' | 'lg' | 'full') : 'md',
                }}
                data={data}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
