import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Figma 의 Input 과 Textarea 가 갖는 이름표, 입력 칸, 도움말, 오류 설명의 묶음.
function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FieldLabel(props: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" {...props} />
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-caption text-muted-foreground", className)}
      {...props}
    />
  )
}

// 오류는 색과 함께 글로 설명한다.
function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn("text-caption text-danger", className)}
      {...props}
    />
  )
}

export { Field, FieldLabel, FieldDescription, FieldError }
