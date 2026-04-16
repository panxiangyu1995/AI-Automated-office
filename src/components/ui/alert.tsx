import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "border-[var(--ao-errorForeground)]/50 text-[var(--ao-errorForeground)] [&>svg]:text-[var(--ao-errorForeground)]",
        warning:
          "border-[var(--ao-warningForeground)]/50 text-[var(--ao-warningForeground)] [&>svg]:text-[var(--ao-warningForeground)]",
        success:
          "border-[var(--ao-successForeground)]/50 text-[var(--ao-successForeground)] [&>svg]:text-[var(--ao-successForeground)]",
        info:
          "border-[var(--ao-button.linkForeground)]/50 text-[var(--ao-button.linkForeground)] [&>svg]:text-[var(--ao-button.linkForeground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    style={{
      backgroundColor: 'var(--ao-bottomPanel.background)',
      borderColor: 'var(--ao-border)',
      color: 'var(--ao-foreground)',
    }}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    style={{ color: 'var(--ao-foreground)' }}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    style={{ color: 'var(--ao-workbench.secondaryForeground)' }}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
