import { parseDraft, serializeDraft, type AiLogDraft } from "./draft"
import { formatLogDateTime } from "./format"
import type { AiLogInput } from "./rules"

// 브라우저에 맡겨 둔 쓰다 만 AI Log 를 읽고 쓴다. 브라우저에서만 부른다.
// 저장소를 쓸 수 없는 브라우저(개인 정보 보호 모드 등)에서는 아무 일도 하지 않는다.

export type OpenedDraft = AiLogDraft & {
  // 맡겨 둔 시각을 보여 줄 글자. 예: 10월 10일 14:20
  savedLabel: string
}

// 화면을 연 순간에 맡겨져 있던 것. 쓰는 동안 새로 맡기는 것은 여기에 넣지 않는다.
// 그래야 방금 적은 내용이 "쓰다 만 내용" 으로 다시 나타나지 않는다.
const opened = new Map<string, OpenedDraft | null>()

function read(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

// 같은 화면에서는 몇 번을 불러도 처음 읽은 값을 돌려준다.
export function openedDraft(key: string): OpenedDraft | null {
  if (!opened.has(key)) {
    const now = new Date()
    const draft = parseDraft(read(key), now)
    opened.set(
      key,
      draft
        ? { ...draft, savedLabel: formatLogDateTime(draft.savedAt, now) }
        : null
    )
  }
  return opened.get(key) ?? null
}

// 화면이 닫힐 때 부른다. 다음에 열면 저장소를 새로 읽는다.
export function forgetOpenedDraft(key: string) {
  opened.delete(key)
}

// 맡겨 둔 시각을 돌려준다. 저장소가 가득 찼거나 막혀 있어 맡기지 못했으면 null 이다. 쓰는 일은 그대로 할 수 있다.
export function writeDraft(key: string, values: AiLogInput) {
  const now = new Date()
  try {
    window.localStorage.setItem(key, serializeDraft(values, now))
    return now.toISOString()
  } catch {
    return null
  }
}

export function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // 지우지 못해도 기한이 지나면 읽지 않는다.
  }
}
