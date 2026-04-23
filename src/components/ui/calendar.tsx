/**
 * Calendar Component - Simplified placeholder
 * This is a basic placeholder implementation
 */

import { cn } from "@/lib/utils"

export interface CalendarProps {
  className?: string
  mode?: 'single' | 'range' | 'multiple'
  selected?: Date | Date[] | undefined
  onSelect?: (date: Date | undefined) => void
}

export function Calendar({ className, selected, onSelect }: CalendarProps) {
  return (
    <div className={cn("p-3 border rounded-md bg-background", className)}>
      <input
        type="date"
        className="w-full p-2 border rounded"
        onChange={(e) => {
          if (onSelect) {
            const date = e.target.value ? new Date(e.target.value) : undefined
            onSelect(date)
          }
        }}
        value={selected instanceof Date ? selected.toISOString().split('T')[0] : ''}
      />
    </div>
  )
}
