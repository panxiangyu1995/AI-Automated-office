import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ao-button.linkForeground)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--ao-sidebarActiveIndicator)] text-white hover:bg-[var(--ao-successForeground)]",
        secondary:
          "border-transparent bg-[var(--ao-bottomPanel.activeBackground)] text-[var(--ao-foreground)] hover:bg-[var(--ao-border)]",
        destructive:
          "border-transparent bg-[var(--ao-errorForeground)] text-white hover:bg-[var(--ao-errorForeground)]",
        outline: "border-[var(--ao-border)] text-[var(--ao-foreground)] hover:bg-[var(--ao-bottomPanel.activeBackground)]",
        success: "border-transparent bg-[var(--ao-sidebarActiveIndicator)] text-white",
        warning: "border-transparent bg-[var(--ao-warningForeground)] text-white",
        info: "border-transparent bg-[var(--ao-button.linkForeground)] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(badgeVariants({ variant }), className)} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
