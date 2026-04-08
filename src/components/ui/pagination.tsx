import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
)
Pagination.displayName = 'Pagination'

const PaginationContent = ({ className, ...props }: React.ComponentProps<'ul'>) => (
  <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />
)
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li className={cn('', className)} {...props} />
)
PaginationItem.displayName = 'PaginationItem'

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof buttonVariants> & { onClick?: () => void; disabled?: boolean }) => (
  <button
    className={cn(buttonVariants({ variant: 'ghost' }), 'hover:bg-transparent', className)}
    onClick={props.onClick}
    disabled={props.disabled}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
  </button>
)
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof buttonVariants> & { onClick?: () => void; disabled?: boolean }) => (
  <button
    className={cn(buttonVariants({ variant: 'ghost' }), 'hover:bg-transparent', className)}
    onClick={props.onClick}
    disabled={props.disabled}
    {...props}
  >
    <ChevronRight className="h-4 w-4" />
  </button>
)
PaginationNext.displayName = 'PaginationNext'

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    role="status"
    aria-label="More pages"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
  </span>
)
PaginationEllipsis.displayName = 'PaginationEllipsis'

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
}
