"use client"

import { Children, useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"

const noop = () => () => {}

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange)
  return () => document.removeEventListener("fullscreenchange", onChange)
}

// 누르면 그 자리에서 무언가를 하는 요소. 여기에 초점이 있을 때 Space 와 Enter 는 그 요소의 것이다.
function isControl(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    target.closest("a, button, input, textarea, select") !== null
  )
}

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", "PageDown"])
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp"])

// 발표를 한 장씩 넘겨 보는 틀. 장은 서버에서 그려서 children 으로 받고, 여기서는 넘기는 일만 한다.
// initial 은 처음 보여 줄 장이다. 0 부터 센다. backHref 는 같은 발표를 이어 보는 화면의 주소다.
export function SlideDeck({
  title,
  backHref,
  initial,
  children,
}: {
  title: string
  backHref: string
  initial: number
  children: React.ReactNode
}) {
  const slides = Children.toArray(children)
  const last = Math.max(slides.length - 1, 0)
  const pathname = usePathname()
  const stageRef = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(Math.min(Math.max(initial, 0), last))
  const canFullscreen = useSyncExternalStore(
    noop,
    () => document.fullscreenEnabled === true,
    () => false
  )
  const fullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => document.fullscreenElement !== null,
    () => false
  )

  function go(next: number) {
    const target = Math.min(Math.max(next, 0), last)
    if (target === index) {
      return
    }
    setIndex(target)
    stageRef.current?.scrollTo({ top: 0 })
    // 새로 고쳐도 보던 장에서 이어 보게 주소에 장 번호를 적어 둔다.
    // 뒤로 가기에 장마다 쌓이지 않게 지금 기록을 바꿔 끼운다.
    window.history.replaceState(
      null,
      "",
      target === 0 ? pathname : `${pathname}?s=${target + 1}`
    )
  }

  function toggleFullscreen() {
    // 브라우저가 막으면 아무 일도 일어나지 않는다. 발표는 그대로 볼 수 있다.
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const onControl = isControl(event.target)

      if (NEXT_KEYS.has(event.key) || (event.key === " " && !onControl)) {
        event.preventDefault()
        go(index + 1)
      } else if (PREVIOUS_KEYS.has(event.key)) {
        event.preventDefault()
        go(index - 1)
      } else if (event.key === "Home") {
        event.preventDefault()
        go(0)
      } else if (event.key === "End") {
        event.preventDefault()
        go(last)
      } else if ((event.key === "f" || event.key === "F") && canFullscreen) {
        toggleFullscreen()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  const position = `${slides.length}장 가운데 ${index + 1}장`

  return (
    <div className="flex h-dvh flex-1 flex-col bg-app">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4 sm:px-6">
        <p className="min-w-0 flex-1 truncate text-label-m">{title}</p>
        <Link
          href={backHref}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          전체 보기
        </Link>
        {canFullscreen && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={fullscreen ? "전체 화면 끄기" : "전체 화면 켜기"}
            onClick={toggleFullscreen}
          >
            {fullscreen ? (
              <Minimize aria-hidden="true" strokeWidth={1.5} />
            ) : (
              <Maximize aria-hidden="true" strokeWidth={1.5} />
            )}
          </Button>
        )}
      </header>
      {/* 장이 화면보다 길면 이 안에서 내려 본다. 짧으면 가운데에 둔다. */}
      <main
        ref={stageRef}
        className="flex min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-10 sm:py-12"
      >
        {/* 넓은 화면에서는 멀리서도 읽히게 장 전체를 키운다. */}
        <section
          aria-roledescription="슬라이드"
          aria-label={position}
          aria-live="polite"
          className="m-auto flex w-full max-w-[880px] flex-col gap-6 lg:[zoom:1.25] 2xl:[zoom:1.5]"
        >
          {slides[index]}
        </section>
      </main>
      <footer className="shrink-0 border-t bg-card">
        <div
          role="progressbar"
          aria-label="발표 진행"
          aria-valuemin={1}
          aria-valuemax={slides.length}
          aria-valuenow={index + 1}
          aria-valuetext={position}
          className="h-1 bg-muted"
        >
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${((index + 1) / slides.length) * 100}%` }}
          />
        </div>
        <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
          <p className="hidden text-caption text-muted-foreground sm:block">
            화살표 키로 넘깁니다.
            {canFullscreen && " F 키로 전체 화면을 켜고 끕니다."}
          </p>
          <div className="col-start-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="이전 장"
              disabled={index === 0}
              onClick={() => go(index - 1)}
            >
              <ChevronLeft aria-hidden="true" strokeWidth={1.5} />
            </Button>
            <span className="min-w-14 text-center text-label-m tabular-nums">
              {index + 1} / {slides.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="다음 장"
              disabled={index === last}
              onClick={() => go(index + 1)}
            >
              <ChevronRight aria-hidden="true" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
