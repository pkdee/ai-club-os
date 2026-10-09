import { cn } from "@/lib/utils"

// 표식의 세 줄은 기록이 쌓여 길어지는 모습이다.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-icon-on-primary">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.67"
          strokeLinecap="round"
        >
          <path d="M5 7h6M5 12h10M5 17h14" />
        </svg>
      </span>
      <span className="text-h4">AI Club OS</span>
    </span>
  )
}
