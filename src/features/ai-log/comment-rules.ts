// AI Log 에 다는 댓글의 입력 규칙. 길이는 데이터베이스의 check 제약과 같은 값이어야 한다.
export const AI_LOG_COMMENT_MAX = 1000

// 브라우저가 줄바꿈을 두 글자로 보내는 경우가 있어 한 글자로 맞추고 앞뒤 공백을 뗀다.
export function cleanComment(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
}

// 댓글로 쓸 수 없는 까닭을 돌려준다. 쓸 수 있으면 null 이다. 다듬은 값을 받는다고 본다.
export function commentError(body: string): string | null {
  if (body === "") {
    return "댓글을 입력해 주세요."
  }
  if (Array.from(body).length > AI_LOG_COMMENT_MAX) {
    return `댓글은 ${AI_LOG_COMMENT_MAX}자 이내로 적어 주세요.`
  }
  return null
}
