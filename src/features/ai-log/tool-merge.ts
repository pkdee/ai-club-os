import { knownToolName } from "./tool-catalog"
import { toolKey } from "./tool-key"

// 같은 도구가 다른 표기로 남아 있는 것을 찾아, 운영자가 하나로 합칠 수 있게 묶는다.

export type ToolSpelling = {
  // 기록에 적힌 그대로의 이름.
  tool: string
  // 그 표기를 쓴 기록 수.
  logCount: number
}

export type ToolMergeGroup = {
  // 합친 뒤에 남길 표기. 널리 쓰는 도구면 그 도구의 표기, 아니면 가장 많이 쓴 표기다.
  target: string
  // target 으로 바꿀 표기들. target 과 같은 것은 들어 있지 않다.
  sources: ToolSpelling[]
}

// 같은 도구인지 가르는 값. 널리 쓰는 도구의 다른 표기("챗지피티")는 그 도구의 표기("ChatGPT")로 본다.
function groupKey(tool: string) {
  return toolKey(knownToolName(tool) ?? tool)
}

// 표기가 둘 이상이거나, 하나뿐이어도 널리 쓰는 표기와 다른 묶음을 돌려준다.
// 합칠 기록이 많은 묶음이 앞에 온다. 받은 순서는 쓴 횟수가 많은 순서라고 본다.
export function toolMergeGroups(spellings: ToolSpelling[]): ToolMergeGroup[] {
  const groups = new Map<string, ToolSpelling[]>()
  for (const spelling of spellings) {
    const key = groupKey(spelling.tool)
    groups.set(key, [...(groups.get(key) ?? []), spelling])
  }

  const result: ToolMergeGroup[] = []
  for (const members of groups.values()) {
    const sorted = [...members].sort((a, b) => b.logCount - a.logCount)
    const target = knownToolName(sorted[0].tool) ?? sorted[0].tool
    const sources = sorted.filter((item) => item.tool !== target)
    if (sources.length > 0) {
      result.push({ target, sources })
    }
  }

  const count = (group: ToolMergeGroup) =>
    group.sources.reduce((sum, item) => sum + item.logCount, 0)
  return result.sort((a, b) => count(b) - count(a))
}
