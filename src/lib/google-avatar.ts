// Google 이 프로필 사진을 올려 두는 주소. 데이터베이스의 members_avatar_url_check 와 같은 규칙이어야 한다.
const GOOGLE_AVATAR_PATTERN = /^https:\/\/lh\d+\.googleusercontent\.com\//
const MAX_LENGTH = 1024

// 프로필 사진 주소를 확인한다. Google 의 사진 주소가 아니면 null 로 버린다.
// 이 값은 사용자가 고칠 수 있는 계정 정보에서 오므로, 아무 주소나 받으면 화면이 엉뚱한 곳에서 그림을 불러오게 된다.
export function googleAvatarUrl(value: unknown): string | null {
  return typeof value === "string" &&
    value.length <= MAX_LENGTH &&
    GOOGLE_AVATAR_PATTERN.test(value)
    ? value
    : null
}
