import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#58A6FF] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#238636] text-white hover:bg-[#2EA043]",
        secondary:
          "border-transparent bg-[#21262D] text-[#C9D1D9] hover:bg-[#30363D]",
        destructive:
          "border-transparent bg-[#DA3633] text-white hover:bg-[#F85149]",
        outline: "border-[#30363D] text-[#C9D1D9] hover:bg-[#21262D]",
        success: "border-transparent bg-[#238636] text-white",
        warning: "border-transparent bg-[#D29922] text-white",
        info: "border-transparent bg-[#1F6FEB] text-white",
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
