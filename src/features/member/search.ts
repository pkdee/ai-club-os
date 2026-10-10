import type { ClubRole } from "@/features/club/roles"

// 찾는 글자의 최대 길이.
export const MEMBER_SEARCH_MAX = 50

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
export function membersHref(clubId: string, view: MemberView, query: string) {
  const params = new URLSearchParams()
  if (view !== "all") params.set("role", view)
  if (query) params.set("q", query)

  const search = params.toString()
  return `/clubs/${clubId}/members${search ? `?${search}` : ""}`
}
