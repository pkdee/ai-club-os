import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { ToolIcon } from "./tool-icon"

// 사용한 도구를 이름표로 줄지어 보여 준다. 이름 앞에 도구의 로고나 종류 아이콘을 둔다.
// 도구가 없으면 아무것도 그리지 않는다.
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
    <ul
      aria-label="사용한 도구"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {tools.map((tool) => (
        <li key={tool} className="flex">
          <Badge className="gap-1.5">
            <ToolIcon name={tool} className="size-3.5" />
            {tool}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
