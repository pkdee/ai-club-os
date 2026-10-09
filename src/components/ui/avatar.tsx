import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Figma 의 Avatar 를 옮긴 것이다. 이름의 첫 글자를 보여 준다.
const avatarVariants = cva(
  "flex shrink-0 items-center justify-center rounded-full bg-primary-subtle text-brand select-none",
  {
    variants: {
      size: {
        sm: "size-6 text-label-s",
        md: "size-8 text-label-s",
        lg: "size-10 text-label-m",
        xl: "size-14 text-h3",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

// 이름은 옆에 글자로 함께 보여 주는 것을 전제로 하므로 화면 낭독기에는 숨긴다.
function Avatar({
  className,
  size,
  name,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof avatarVariants> & { name: string }) {
  return (
    <span
      data-slot="avatar"
      aria-hidden="true"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {Array.from(name)[0]}
    </span>
  )
}

export { Avatar, avatarVariants }
