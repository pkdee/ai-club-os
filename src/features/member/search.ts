import type { ClubRole } from "@/features/club/roles"

// 찾는 글자의 최대 길이.
export const MEMBER_SEARCH_MAX = 50

// 목록에서 한 번에 더 보여 주는 Member 수와, 한 화면에 보여 주는 최대 수.
export const MEMBER_PAGE_SIZE = 20
export const MEMBER_LIMIT_MAX = 500

// 주소의 n 값을 보여 줄 Member 수로 바꾼다. 값이 없거나 이상하면 첫 묶음만 보여 준다.
export function memberLimit(value: string | string[] | undefined) {
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10)
  if (!Number.isFinite(parsed)) {
    return MEMBER_PAGE_SIZE
  }
  return Math.min(Math.max(parsed, MEMBER_PAGE_SIZE), MEMBER_LIMIT_MAX)
}

export type MemberView = "all" | ClubRole

// 주소의 값을 찾는 글자로 바꾼다. 앞뒤 공백을 떼고 너무 길면 자른다.
export function parseMemberQuery(value: string | string[] | undefined) {
  return typeof value === "string"
    ? Array.from(value.trim()).slice(0, MEMBER_SEARCH_MAX).join("")
    : ""
}

// 비교할 때 쓰는 값. 대소문자와 공백의 차이를 없앤다.
function searchKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, "")
}

// 이름이나 이메일에 찾는 글자가 들어 있는지 본다. 찾는 글자가 비어 있으면 모두 맞는 것으로 본다.
export function matchesMember(
  member: { name: string; email: string | null },
  query: string
) {
  const needle = searchKey(query)
  if (!needle) {
    return true
  }

  return (
    searchKey(member.name).includes(needle) ||
    searchKey(member.email ?? "").includes(needle)
  )
}

// Member 화면의 주소. 기본값은 주소에 적지 않는다.
// limit 은 한 화면에 보여 줄 Member 수다. 첫 묶음보다 많을 때만 주소에 적는다.
export function membersHref(
  clubId: string,
  view: MemberView,
  query: string,
  limit = MEMBER_PAGE_SIZE
) {
  const params = new URLSearchParams()
  if (view !== "all") params.set("role", view)
  if (query) params.set("q", query)
  if (limit > MEMBER_PAGE_SIZE) params.set("n", String(limit))

  const search = params.toString()
  return `/clubs/${clubId}/members${search ? `?${search}` : ""}`
}
