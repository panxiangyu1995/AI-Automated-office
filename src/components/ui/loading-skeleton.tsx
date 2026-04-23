import { cn } from '@/lib/utils'

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md', className)}
      style={{ backgroundColor: 'var(--ao-editor-inactiveSelectionBackground, var(--ao-border))' }}
    />
  )
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-8 w-48" />
        <SkeletonBox className="h-9 w-32" />
      </div>
      <div className="flex gap-4">
        <SkeletonBox className="h-10 w-24" />
        <SkeletonBox className="h-10 w-24" />
        <SkeletonBox className="h-10 w-24" />
      </div>
      <SkeletonBox className="h-[1px] w-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-4 flex-1" />
            <SkeletonBox className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="rounded-lg border p-5 space-y-4"
      style={{ borderColor: 'var(--ao-card-border, var(--ao-border))' }}
    >
      <SkeletonBox className="h-5 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} className="h-4 w-full" />
      ))}
      <div className="flex gap-2 pt-2">
        <SkeletonBox className="h-8 w-16" />
        <SkeletonBox className="h-8 w-16" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonBox key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5 p-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <SkeletonBox className="h-9 w-24" />
        <SkeletonBox className="h-9 w-24" />
      </div>
    </div>
  )
}

export function ChatSkeleton({ messages = 4 }: { messages?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: messages }).map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 1 && 'flex-row-reverse')}>
          <SkeletonBox className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-2 max-w-[70%]">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-20 w-64" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { SkeletonBox }
export { SkeletonBox as Skeleton }
