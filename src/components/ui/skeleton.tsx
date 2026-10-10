import * as React from "react"

import { cn } from "@/lib/utils"

// Figma 의 Skeleton 을 옮긴 것이다. 내용이 들어올 자리를 옅게 깜빡이는 막대로 보여 준다.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-skeleton motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
