// 역할 값은 데이터베이스의 members.role 과 같아야 한다. 이름은 잠정 결정이다.
export type ClubRole = "admin" | "member"

export const ROLE_LABEL: Record<ClubRole, string> = {
  admin: "운영자",
  member: "구성원",
}
