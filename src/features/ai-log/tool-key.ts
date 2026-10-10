// 도구 이름을 비교할 때 쓰는 값. 대소문자와 공백의 차이를 없앤다.
// 데이터베이스의 private.search_key 와 같은 규칙이어야 한다.
export function toolKey(value: string) {
  return value.replace(/\s+/g, "").toLowerCase()
}
