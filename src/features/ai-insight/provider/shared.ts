// 여러 Provider 가 함께 쓰는 작은 도구. 키를 받지 않고 글만 다룬다.

// 답의 글에서 JSON 객체를 꺼낸다. 앞뒤에 다른 글이나 코드 표시가 붙어 있어도 찾는다. 없으면 undefined 다.
export function extractJson(text: string): unknown {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end <= start) {
    return undefined
  }
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return undefined
  }
}

// 남기는 글에 키가 섞여 들어가지 않게 가린다. 지금 쓰는 키와, 키처럼 생긴 글자를 모두 가린다.
// Provider 의 오류 설명에는 원래 키가 없지만, 중간의 다른 서버가 요청을 되돌려 적는 경우까지 막는다.
export function redactSecrets(text: string, apiKey: string) {
  return text
    .split(apiKey)
    .join("[가림]")
    .replace(/sk-ant-[A-Za-z0-9_-]{8,}/g, "[가림]")
    .replace(/AIza[A-Za-z0-9_-]{20,}/g, "[가림]")
}
