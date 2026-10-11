// 계정을 지우면 내가 속한 Club 마다 무슨 일이 생기는지 가른다.
// 실제로 일어나는 일은 데이터베이스가 정한다. 여기서는 지우기 전에 알려 주려고 같은 규칙으로 미리 본다.

export type AccountClub = {
  id: string
  name: string
  role: "admin" | "member"
  memberCount: number
  adminCount: number
}

export type AccountDeletionPlan<T extends AccountClub> = {
  // 나만 있어서 함께 지워지는 Club.
  removed: T[]
  // 내가 마지막 운영자여서 먼저 참여한 구성원이 운영자를 이어받는 Club.
  handedOver: T[]
  // 나만 빠지는 Club.
  left: T[]
}

export function planAccountDeletion<T extends AccountClub>(
  clubs: T[]
): AccountDeletionPlan<T> {
  const plan: AccountDeletionPlan<T> = { removed: [], handedOver: [], left: [] }

  for (const club of clubs) {
    if (club.memberCount <= 1) {
      plan.removed.push(club)
    } else if (club.role === "admin" && club.adminCount <= 1) {
      plan.handedOver.push(club)
    } else {
      plan.left.push(club)
    }
  }
  return plan
}

// 지우기 전에 입력해야 하는 글자. 이메일이 있으면 이메일이고, 없으면 정해 둔 말이다.
export const ACCOUNT_DELETE_PHRASE = "계정 지우기"

export function accountDeleteConfirmValue(email: string | null) {
  return email?.trim() || ACCOUNT_DELETE_PHRASE
}

// 입력한 글자가 맞는지. 이메일은 대소문자를 가리지 않는다.
export function isAccountDeleteConfirmed(typed: unknown, email: string | null) {
  return (
    typeof typed === "string" &&
    typed.trim().toLowerCase() === accountDeleteConfirmValue(email).toLowerCase()
  )
}
