// Club 입력 규칙. 데이터베이스의 check 제약과 같은 값이어야 한다.
export const CLUB_NAME_MAX = 50
export const CLUB_DESCRIPTION_MAX = 200

export type ClubInput = {
  name: string
  description: string
}

export type ClubInputErrors = Partial<Record<keyof ClubInput, string>>

// 데이터베이스가 글자 수를 세는 방식과 맞춘다. 이모지도 한 글자로 센다.
function length(value: string) {
  return Array.from(value).length
}

export function validateClub(input: ClubInput): ClubInputErrors | null {
  const errors: ClubInputErrors = {}

  if (length(input.name) === 0) {
    errors.name = "Club 이름을 입력해 주세요."
  } else if (length(input.name) > CLUB_NAME_MAX) {
    errors.name = `Club 이름은 ${CLUB_NAME_MAX}자 이내로 적어 주세요.`
  }

  if (length(input.description) > CLUB_DESCRIPTION_MAX) {
    errors.description = `소개는 ${CLUB_DESCRIPTION_MAX}자 이내로 적어 주세요.`
  }

  return Object.keys(errors).length > 0 ? errors : null
}
