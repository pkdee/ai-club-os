// Member 를 화면에 보여 줄 때 쓰는 이름. 이름이 비어 있으면 이메일을 쓴다.
export function memberName(member: {
  display_name: string
  email: string | null
}) {
  return member.display_name || member.email || "이름 없음"
}
