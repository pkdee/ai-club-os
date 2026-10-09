import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// Figma 의 Input 과 Textarea 가 함께 쓰는 입력 칸 모양.
// 좁은 화면에서는 글자를 16px 로 둔다. 그보다 작으면 iOS 에서 입력할 때 화면이 확대된다.
const controlClassName =
  "w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground outline-none transition-colors placeholder:text-tertiary focus-visible:border-ring focus-visible:inset-ring-1 focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-danger-border-strong aria-invalid:focus-visible:border-danger-border-strong aria-invalid:focus-visible:inset-ring-danger-border-strong md:text-body-m"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(controlClassName, "h-10", className)}
      {...props}
    />
  )
}

export { Input, controlClassName }
