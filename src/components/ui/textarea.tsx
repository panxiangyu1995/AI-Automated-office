import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md px-3 py-2 text-sm ring-offset-[var(--ao-workbench.background)] placeholder:text-[var(--ao-workbench.secondaryForeground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ao-button.linkForeground)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{
          backgroundColor: 'var(--ao-commandPalette.footerBackground)',
          border: '1px solid var(--ao-border)',
          color: 'var(--ao-foreground)',
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
