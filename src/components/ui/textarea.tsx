import * as React from "react"

import { controlClassName } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        controlClassName,
        "flex field-sizing-content min-h-24 resize-none py-2.5",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
