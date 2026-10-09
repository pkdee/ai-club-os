# 0002. 세션을 쿠키에 두고 서버에서 인증을 처리한다

## 상태

채택. 2026-10-10.

## 배경

v0.1 의 로그인 수단은 Google Login 하나이고 인증은 Supabase Auth 를 씁니다. 화면은 Next.js App Router 의 Server Component 로 그리는데, Server Component 는 쿠키를 쓸 수 없어서 만료된 세션을 스스로 갱신하지 못합니다. 이후의 모든 기능이 "지금 누가 로그인했는가"에 의존하므로 세션을 어디에 두고 어디서 확인할지 먼저 정해야 했습니다.

## 결정

- 세션은 `@supabase/ssr` 로 쿠키에 둡니다. 로그인은 PKCE 흐름을 쓰고, Server Action 에서 시작해 `/auth/callback` Route Handler 에서 code 를 세션으로 바꿉니다.
- `src/proxy.ts` 가 요청마다 세션을 갱신합니다. 로그인 없이 열 수 있는 경로는 `/login` 과 `/auth/` 뿐이고, 나머지는 로그인 화면으로 보냅니다.
- 서버에서 사용자를 확인할 때는 토큰 서명을 검증하는 `getClaims` 를 씁니다. `getSession` 은 서버에서 신뢰하지 않습니다.
- Supabase 클라이언트는 `src/lib/supabase` 에서만 만듭니다. 기능 코드는 `features/auth` 의 `getCurrentUser`, `signInWithGoogle`, `signOut` 을 씁니다.
- 키는 publishable key 만 씁니다. secret key 는 쓰지 않습니다.

## 결과

- `proxy.ts` 는 화면 이동만 막습니다. Server Action 과 데이터 접근은 각자 사용자를 다시 확인해야 하고, Club 데이터의 격리는 이후 데이터베이스의 행 단위 보안으로 합니다.
- 토큰의 `user_metadata` 는 사용자가 바꿀 수 있는 값이라 이름 표시에만 씁니다. 권한 판단에는 쓰지 않습니다.
- 콜백 주소는 요청이 들어온 주소로 만듭니다. Supabase 의 Site URL 이나 Redirect URLs 에 환경별 주소가 등록되어 있어야 합니다. 배포할 때는 프록시 뒤에서 주소가 올바르게 잡히는지 확인해야 합니다.
- 브라우저용 클라이언트는 만들지 않았습니다. 실시간 구독처럼 브라우저에서 Supabase 를 직접 불러야 할 때 추가합니다.
- Google 인증을 끝까지 마치는 흐름은 자동으로 검증하지 못합니다. 테스트 도구를 정할 때 함께 다룹니다.

## 검토할 대안

- **브라우저에서 로그인 시작**: 코드가 조금 줄지만 세션이 브라우저에 먼저 생겨 서버가 그린 화면과 어긋나는 순간이 생깁니다.
- **Auth.js 같은 별도 인증 라이브러리**: 이후 데이터베이스의 행 단위 보안이 Supabase Auth 의 사용자를 기준으로 동작하므로, 인증을 따로 두면 둘을 잇는 작업이 더 필요합니다.
