import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Figma 의 Alert 를 옮긴 것이다. 색만으로 뜻을 전하지 않도록 아이콘과 제목을 함께 쓴다.
const alertVariants = cva(
  "grid w-full gap-y-1 rounded-lg border p-4 text-left has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg:not([class*='size-'])]:size-5",
  {
    variants: {
      tone: {
        info: "border-info-border bg-info-subtle text-info *:[svg]:text-icon-info",
        success:
          "border-success-border bg-success-subtle text-success *:[svg]:text-icon-success",
        warning:
          "border-warning-border bg-warning-subtle text-warning *:[svg]:text-icon-warning",
        danger:
          "border-danger-border bg-danger-subtle text-danger *:[svg]:text-icon-danger",
      },
    },
    defaultVariants: {
      tone: "info",
    },
  }
)

function Alert({
  className,
  tone = "info",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("text-label-m", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-body-s text-foreground", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
