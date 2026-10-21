# Technology

## 기본 기술 구성

| 영역 | 선택 | 현재 상태 |
|---|---|---|
| 웹 | Next.js App Router | 16.4.0 도입 |
| 언어 | TypeScript | 5.9 도입 |
| 스타일 | Tailwind CSS | 4.3 도입 |
| 사용자 인터페이스 | shadcn/ui | 도입. Button, Alert, Input, Textarea, Field, Label, Dialog, Badge, Empty, Avatar, Breadcrumb, LinkTabs, Menu, Skeleton, NativeSelect |
| 데이터베이스 | Supabase PostgreSQL | 도입. `clubs`, `members`, `sessions`, `attendance`, `ai_logs`, `club_invites`, `ai_insights`, `projects`, `project_members`, `project_links`, `project_tasks`, `club_bans`, `deletion_logs`, `ai_insight_runs`, `project_join_requests`, `presentations`, `notification_reads`, `ai_log_revisions`, `retrospectives`, `ai_log_comments`, `ai_log_reactions`, `session_projects`, `ai_log_attachments` 정의 |
| 인증 | Supabase Auth와 Google Login | 도입. 로그인과 로그아웃 구현 |
| 파일 저장 | Supabase Storage | 2026-10-12 도입. AI Log 의 이미지를 공개하지 않는 저장 공간 `ai-log-images` 에 둔다. 새 패키지 없음 |
| 배포 | Vercel | 2026-10-20 도입. `vercel.json` 에 Framework 를 Next.js 로 고정한다. 프로젝트 설정이 다른 값으로 잡혀 있어도 정적 사이트로 배포되지 않게 하려는 것이다 |
| 패키지 관리 | npm | 도입 |
| AI Provider | Google 의 Gemini, Anthropic 의 Claude | 도입. 새 패키지 없이 `fetch` 로 부른다. 2026-10-20 부터 Gemini 3.8 Flash 무료 등급을 쓴다. 키와 모델은 서버의 환경 변수 |
| 자동 검증 | Node 내장 test runner, Docker 의 Postgres | 도입. 새 패키지 없음. `npm test` |
| 디자인 문서 | Google 의 DESIGN.md 형식 | 2026-10-21 도입. `DESIGN.md` 에 디자인 토큰과 그 설명을 함께 둔다. 형식은 `npm run design:lint` 로, `globals.css` 와 같은지는 `npm test` 로 검사한다 |
| 앱 안내 문서 | MDX, `@next/mdx`, Shiki | 2026-10-21 도입. `src/content/docs/` 의 MDX 를 빌드할 때 화면으로 바꾼다. 코드의 색은 빌드할 때 칠한다 |

## 도입한 패키지와 근거

2026-10-08 v0.1 구현 첫 단계에서 아래를 도입했습니다. 뼈대는 `create-next-app` 16.4.0, 컴포넌트는 `shadcn` 4.21 의 기본 설정을 따랐습니다.

| 패키지 | 근거 |
|---|---|
| `next` 16.4.0, `react` 19.3.0, `react-dom` 19.3.0 | 뼈대 기본 구성 |
| `tailwindcss` 4.3, `@tailwindcss/turbopack` | 뼈대 기본 구성. Next.js 16.4 는 PostCSS 대신 Turbopack 로더로 Tailwind 를 붙인다. |
| `shadcn`, `tw-animate-css` | shadcn/ui 의 Tailwind 설정과 애니메이션 |
| `@base-ui/react` | shadcn/ui 기본 프리셋(base-nova)의 컴포넌트 기반 |
| `cn`, `class-variance-authority` | shadcn/ui 컴포넌트의 클래스 병합과 변형 정의 |
| `lucide-react` | 아이콘. Figma 아이콘과 같은 Lucide 를 쓴다. |
| `eslint`, `eslint-config-next`, `typescript`, `@types/*` | 뼈대 기본 구성 |
| `@supabase/supabase-js` 2.117.3, `@supabase/ssr` 0.12.7 | 2026-10-10 추가. Supabase 연결과 서버 쪽 세션 관리. 공급망 사고에 대비해 버전을 고정한다. |
| `@lobehub/icons-static-svg` 1.95.1 | 2026-10-10 추가. AI 도구 로고의 SVG 파일. MIT 이고 의존성이 없다. 로고 모양이 모르는 사이에 바뀌지 않게 버전을 고정한다. 로고의 상표는 각 회사에 있다. 근거는 `docs/adr/0014-tool-logos-from-package.md`. |
| `@google/design.md` 0.4.0 | 2026-10-21 추가. 개발 도구. DESIGN.md 형식의 lint 와 토큰을 읽는 함수를 준다. Google Labs 가 만들었고 Apache-2.0 이다. 형식이 alpha 라 규칙이 모르는 사이에 바뀌지 않게 버전을 고정한다. 배포되는 코드에는 들어가지 않는다. 근거는 `docs/adr/0030-design-md-format.md`. |
| `@next/mdx` 16.4.0, `@mdx-js/loader` 3.1.1, `@mdx-js/react` 3.1.1, `@types/mdx` 2.0.14 | 2026-10-21 추가. Next.js 문서가 MDX 에 쓰라고 하는 묶음. `@next/mdx` 는 `next` 와 같은 버전으로 맞춘다. 모두 MIT. |
| `remark-gfm` 4.0.1, `rehype-slug` 6.0.0 | 2026-10-21 추가. Docs 의 표를 읽고 제목에 목차가 가리킬 id 를 붙인다. 모두 MIT. |
| `@shikijs/rehype` 4.5.0 | 2026-10-21 추가. Docs 코드 블록의 색을 빌드할 때 칠한다. `shiki` 4.5.0 이 따라 들어온다. 모두 MIT. 빌드 결과에 Shiki 의 실행 코드는 들어가지 않는 것을 확인했다. |

Docs 에 쓰는 패키지는 모두 버전을 고정했습니다. 근거는 `docs/adr/0031-docs-as-mdx-at-build-time.md` 에 있습니다.

Supabase CLI 는 의존성에 넣지 않고 `npx supabase@2.120.0` 으로 실행합니다. 지금은 마이그레이션 파일을 만들 때만 씁니다.

끈 기능은 다음과 같습니다.

- Cache Components 와 React Compiler 는 켜지 않았습니다. 필요한 근거가 생기면 검토합니다.
- `agentRules` 를 껐습니다. 켜 두면 `next dev` 가 `AGENTS.md` 에 Next.js 안내 문단을 자동으로 넣고 지워도 다시 넣습니다. `AGENTS.md` 는 이 저장소의 단일 지침이라 직접 관리합니다.

알려진 경고가 하나 있습니다. `npm audit` 가 `braces` 의 서비스 거부 취약점으로 high 9건을 보고합니다(2026-10-21 기준. `@google/design.md` 와 Docs 의 패키지를 더하기 전에도 9건이었습니다). 모두 `eslint-config-next` 와 `shadcn` 의 명령줄 도구가 끌어오는 경로이고 배포되는 코드에는 들어가지 않습니다. 자동 수정은 `eslint-config-next` 를 14 로 내리는 방식이라 적용하지 않았습니다.

## 파일 저장 방향

2026-10-12 에 Supabase Storage 를 들였습니다. 쓰는 곳은 AI Log 의 이미지(`ai-log-images`)와, 2026-10-21 에 더한 Club 로고(`club-logos`)입니다.

- 저장 공간과 접근 규칙은 마이그레이션이 만듭니다. 대시보드에서 손으로 만들지 않습니다.
- Storage 를 부르는 서버 코드는 기능마다 한 파일에만 둡니다. AI Log 의 이미지는 `src/features/ai-log/image-store.ts`, Club 로고는 `src/features/club/logo-store.ts` 입니다. 둘 다 `server-only` 로 표시했습니다.
- 파일은 브라우저가 Storage 로 바로 올립니다. 서버가 올릴 자리에만 쓰는 한 번짜리 표를 만들어 주고, 브라우저는 로그인 정보를 싣지 않는 연결(`src/lib/supabase/upload-client.ts`)로 그 표를 씁니다. 배포 서비스가 요청 하나의 크기를 5MB 보다 작게 막기 때문입니다.
- 보여 줄 때는 서버가 한 시간짜리 주소를 만듭니다. `next/image` 의 변환은 거치지 않습니다.
- 근거는 `docs/adr/0028-ai-log-images-in-storage.md` 에 있습니다.
- Club 로고는 브라우저가 256px 정사각형으로 줄인 뒤 서버 동작으로 올립니다. 줄인 그림이 512KB 까지라 서버 동작의 요청 크기 한도 안에 듭니다. 보여 줄 때는 앱의 `/clubs/<Club>/logo/<파일 이름>` 이 로그인을 확인하고 Storage 에서 읽어 보냅니다. 근거는 `docs/adr/0032-club-directory-and-logos.md` 에 있습니다.

## 화면 모드

밝은 화면과 어두운 화면은 새 패키지 없이 만들었습니다. 고른 값은 브라우저의 `localStorage` 에 두고, 화면을 그리기 전에 실행하는 짧은 스크립트(`src/lib/theme.ts` 의 `THEME_SCRIPT`)가 `html` 에 `dark` 를 붙입니다. Next.js 문서의 preventing-flash-before-hydration 안내를 따랐습니다.

## 서버 방향

MVP에서는 별도 Spring Boot 서버를 두지 않습니다. Next.js와 Supabase를 중심으로 구성하고, 별도 서버가 필요한 근거가 생길 때 설계 결정을 다시 검토합니다.

## AI Provider 방향

초기 공급자를 제품 핵심 영역에 직접 결합하지 않습니다. AI Insight 단계에서 공급자별 구현과 제품 기능 사이에 교체 가능한 경계를 둡니다.

2026-10-10 에 경계를 `src/features/ai-insight/provider/` 에 두고 첫 구현으로 Claude 를 붙였습니다. 제품 쪽은 지킬 것, 자료, 답의 모양을 주고 JSON 을 받는다는 약속만 압니다. 키(`ANTHROPIC_API_KEY`)와 모델(`AI_INSIGHT_MODEL`, 기본값 `claude-sonnet-5-5`)은 서버의 환경 변수로 받고, 키가 없어도 기록 기능은 그대로 동작합니다. 키를 다루는 파일은 `server-only` 로 표시해 브라우저 코드가 불러오면 빌드가 실패하게 했고, 남기는 글에서는 키를 가립니다. 근거는 `docs/adr/0018-ai-provider-boundary-and-claude.md` 에 있습니다.

2026-10-20 에 두 번째 구현으로 Google 의 Gemini 를 붙였습니다. Interactions API 를 `fetch` 로 부르고, 키는 `GEMINI_API_KEY`, 기본 모델은 `gemini-3.8-flash` 입니다. `AI_INSIGHT_PROVIDER` 로 둘 가운데 하나를 고르고, 비우면 키를 넣은 쪽을 씁니다. 무료 등급이라 Google 이 받은 글을 개선에 쓰므로, Provider 마다 이것을 알릴 글을 두고 쓰기 화면과 개인 정보 안내에 보여 줍니다. 근거는 `docs/adr/0029-gemini-free-tier-provider.md` 에 있습니다.

## 아직 정하지 않은 항목

- 테스트 도구와 테스트 범위. 권한 규칙과 입력 규칙은 `npm test` 로 검증한다. 화면에서의 흐름을 자동으로 검증하는 도구는 2026-10-11 에 사용자가 아직 들이지 않기로 했다.
- 상태 관리 방식
- Storage 의 용량 한도와 오래된 파일의 정리. 지금은 기록마다 4장이라는 제한만 있다.
- 관측성과 오류 수집 도구

이 항목은 해당 기능을 구현하는 마일스톤에서 필요 근거와 함께 정합니다.
