"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Figma 의 Avatar 를 옮긴 것이다. 프로필 사진이 있으면 사진을, 없으면 이름의 첫 글자를 보여 준다.
const avatarVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-subtle text-brand select-none",
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

// 사진을 불러오지 못하면 사진을 감춰서 밑에 있는 첫 글자가 보이게 한다.
function hide(image: HTMLImageElement) {
  image.style.display = "none"
}

// 이름은 옆에 글자로 함께 보여 주는 것을 전제로 하므로 화면 낭독기에는 숨긴다.
// src 에는 확인을 거친 사진 주소만 넣는다. 사진은 첫 글자 위에 덮어 그린다.
function Avatar({
  className,
  size,
  name,
  src,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof avatarVariants> & {
    name: string
    src?: string | null
  }) {
  return (
    <span
      data-slot="avatar"
      aria-hidden="true"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {Array.from(name)[0]}
      {src && (
        // 바깥 주소의 작은 사진이라 next/image 의 변환을 거치지 않고 그대로 불러온다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          // 어느 화면에서 불렀는지 사진 서버에 알리지 않는다.
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover"
          onError={(event) => hide(event.currentTarget)}
          // 화면이 준비되기 전에 이미 실패한 사진은 onError 가 오지 않으므로 한 번 직접 확인한다.
          ref={(image) => {
            if (image?.complete && image.naturalWidth === 0) {
              hide(image)
            }
          }}
        />
      )}
    </span>
  )
}

export { Avatar, avatarVariants }
