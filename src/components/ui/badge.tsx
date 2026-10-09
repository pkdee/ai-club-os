import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Figma 의 Badge 를 옮긴 것이다. 색과 함께 항상 글자로 뜻을 전한다.
const badgeVariants = cva(
  "inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2 text-label-s whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        brand: "bg-primary-subtle text-brand",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        danger: "bg-danger-subtle text-danger",
        info: "bg-info-subtle text-info",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
