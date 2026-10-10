import {
  Blocks,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  ImageIcon,
  MessageCircle,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { knownToolKind, knownToolName, type ToolKind } from "../tool-catalog"
import { TOOL_LOGOS, logoUrl } from "../tool-logos"

// 로고가 없는 도구에 보여 주는 종류별 아이콘.
const KIND_ICONS: Record<ToolKind, LucideIcon> = {
  assistant: MessageCircle,
  coding: Code,
  media: ImageIcon,
  model: Cpu,
  api: Cloud,
  framework: Blocks,
  data: Database,
  automation: Workflow,
  docs: FileText,
}

// 도구 이름 옆에 놓는 작은 그림. 널리 쓰는 도구는 로고를, 로고가 없으면 종류를 나타내는 아이콘을,
// 목록에 없는 도구는 공구 아이콘을 보여 준다. 이름을 옆에 글자로 함께 보여 주므로 화면 낭독기에는 숨긴다.
export function ToolIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const logo = TOOL_LOGOS[knownToolName(name) ?? ""]

  if (logo?.tinted) {
    // 한 가지 색 로고는 그림을 틀로 삼아 글자색으로 칠한다. 밝은 화면과 어두운 화면 모두에서 보인다.
    const mask = `url(${logoUrl(logo)}) center / contain no-repeat`
    return (
      <span
        data-slot="tool-icon"
        aria-hidden="true"
        className={cn("inline-block size-4 shrink-0 bg-current", className)}
        style={{ mask, WebkitMask: mask }}
      />
    )
  }
  if (logo) {
    return (
      // 패키지에 들어 있는 작은 SVG 라 next/image 의 변환을 거치지 않고 그대로 보여 준다.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        data-slot="tool-icon"
        src={logoUrl(logo)}
        alt=""
        aria-hidden="true"
        className={cn("size-4 shrink-0", className)}
      />
    )
  }

  const kind = knownToolKind(name)
  const Icon = kind ? KIND_ICONS[kind] : Wrench
  return (
    <Icon
      data-slot="tool-icon"
      aria-hidden="true"
      strokeWidth={1.5}
      className={cn("size-4 shrink-0 text-icon-subtle", className)}
    />
  )
}
