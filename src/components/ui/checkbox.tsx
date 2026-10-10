import * as React from "react"

import { cn } from "@/lib/utils"

// Figma 의 Checkbox. 이름표와 도움말을 함께 묶어 글자를 눌러도 켜고 끌 수 있다.
function CheckboxField({
  label,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  label: React.ReactNode
  description?: React.ReactNode
}) {
  const id = React.useId()

  return (
    <label
      data-slot="checkbox-field"
      className={cn("flex items-start gap-3", className)}
    >
      <input
        type="checkbox"
        aria-describedby={description ? `${id}-help` : undefined}
        className="mt-1 size-4 shrink-0 accent-primary disabled:opacity-50"
        {...props}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label-m">{label}</span>
        {description && (
          <span id={`${id}-help`} className="text-caption text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  )
}

export { CheckboxField }
