import { Wrench } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// 사용한 도구를 이름표로 줄지어 보여 준다. 도구가 없으면 아무것도 그리지 않는다.
export function ToolChips({
  tools,
  className,
}: {
  tools: string[]
  className?: string
}) {
  if (tools.length === 0) {
    return null
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <Wrench
        aria-hidden="true"
        strokeWidth={1.5}
        className="mt-1 size-3.5 shrink-0 text-icon-subtle"
      />
      <ul aria-label="사용한 도구" className="flex flex-wrap gap-1.5">
        {tools.map((tool) => (
          <li key={tool} className="flex">
            <Badge>{tool}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
