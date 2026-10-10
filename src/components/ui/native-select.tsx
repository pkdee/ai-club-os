import * as React from "react"
import { ChevronDown } from "lucide-react"

import { controlClassName } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Figma 의 Select 를 옮긴 것이다. 브라우저의 기본 고르기 창을 그대로 써서 작은 화면과 키보드에서 익숙하게 동작한다.
function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div data-slot="native-select" className={cn("relative", className)}>
      <select
        className={cn(controlClassName, "h-10 appearance-none pr-9")}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        strokeWidth={1.5}
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-icon-subtle"
      />
    </div>
  )
}

export { NativeSelect }
