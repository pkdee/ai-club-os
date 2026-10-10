// Member 를 화면에 보여 줄 때 쓰는 이름. 이름이 비어 있으면 이메일을 쓴다.
export function memberName(member: {
  display_name: string
  email: string | null
}) {
  return member.display_name || member.email || "이름 없음"
}

// Club 안에서 쓰는 이름의 규칙. 데이터베이스의 set_my_display_name 함수와 같은 값이어야 한다.
export const MEMBER_NAME_MAX = 40

// 이름의 앞뒤 공백을 떼고, 이어진 공백은 하나로 줄인다.
export function cleanMemberName(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

// 이름으로 쓸 수 없는 까닭을 돌려준다. 쓸 수 있으면 null 이다.
// @ 를 막는 것은 이메일이 이름으로 보이지 않게 하려는 것이다.
export function memberNameError(value: string): string | null {
  const name = cleanMemberName(value)
  const length = Array.from(name).length

  if (length === 0) {
    return "이름을 입력해 주세요."
  }
  if (length > MEMBER_NAME_MAX) {
    return `이름은 ${MEMBER_NAME_MAX}자 이내로 적어 주세요.`
  }
  if (name.includes("@")) {
    return "이름에는 @ 를 쓸 수 없습니다. 이메일 대신 불리고 싶은 이름을 적어 주세요."
  }
  return null
}
