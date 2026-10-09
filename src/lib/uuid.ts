const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 주소나 입력으로 받은 값이 식별자 형식인지 확인한다.
// 형식이 틀린 값을 그대로 조회하면 데이터베이스가 오류를 낸다.
export function isUuid(value: string) {
  return UUID_PATTERN.test(value)
}
