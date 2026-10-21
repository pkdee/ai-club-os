"use client"

import { cn } from "@/lib/utils"

// 사진을 불러오지 못하면 사진을 감춰서 밑에 있는 첫 글자가 보이게 한다.
function hide(image: HTMLImageElement) {
  image.style.display = "none"
}

// Club 의 로고. 로고가 없거나 불러오지 못하면 이름의 첫 글자를 보여 준다.
// 크기, 모서리, 색은 놓이는 자리마다 달라서 className 으로 받는다.
// 이름은 옆에 글자로 함께 보여 주는 것을 전제로 하므로 화면 낭독기에는 숨긴다.
// src 에는 clubLogoUrl 이 만든 주소만 넣는다.
export function ClubLogo({
  name,
  src,
  className,
}: {
  name: string
  src: string | null
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden select-none",
        className
      )}
    >
      {Array.from(name)[0]}
      {src && (
        // 앱이 보내 주는 작은 정사각형 그림이라 next/image 의 변환을 거치지 않는다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          className="absolute inset-0 size-full bg-card object-cover"
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
