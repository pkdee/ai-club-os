import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Figma 의 Button 과 IconButton 을 옮긴 것이다. 이름은 shadcn/ui 관례를 따른다.
// variant: default = Primary, outline = Secondary, ghost = Ghost, destructive = Danger
// size: default = MD(40px), sm = SM(32px), icon 과 icon-sm 은 IconButton
// buttonVariants 를 링크에 바로 쓸 수 있도록, 기본 클래스와 variant 클래스가 같은 속성을 두고 겹치지 않게 한다.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding text-label-m whitespace-nowrap transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:pointer-events-none disabled:text-disabled-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-disabled",
        outline:
          "border-input bg-card text-foreground hover:bg-accent disabled:border-border",
        ghost: "border-transparent text-foreground hover:bg-accent",
        destructive:
          "border-transparent bg-destructive text-primary-foreground hover:bg-destructive-hover disabled:bg-disabled",
      },
      size: {
        default: "h-10 gap-2 px-4",
        sm: "h-8 gap-1.5 px-3",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-5",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
