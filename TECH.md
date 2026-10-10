# Technology

## 기본 기술 구성

| 영역 | 선택 | 현재 상태 |
|---|---|---|
| 웹 | Next.js App Router | 16.4.0 도입 |
| 언어 | TypeScript | 5.9 도입 |
| 스타일 | Tailwind CSS | 4.3 도입 |
| 사용자 인터페이스 | shadcn/ui | 도입. Button, Alert, Input, Textarea, Field, Label, Dialog, Badge, Empty, Avatar, Breadcrumb, LinkTabs, Menu, Skeleton, NativeSelect |
| 데이터베이스 | Supabase PostgreSQL | 도입. `clubs`, `members`, `sessions`, `attendance`, `ai_logs`, `club_invites`, `ai_insights`, `projects`, `project_members`, `project_links`, `project_tasks` 정의 |
| 인증 | Supabase Auth와 Google Login | 도입. 로그인과 로그아웃 구현 |
| 파일 저장 | Supabase Storage | 필요 시 도입 |
| 배포 | Vercel | 도입 예정 |
| 패키지 관리 | npm | 도입 |
| AI Provider | Anthropic 의 Claude | 도입. 새 패키지 없이 Messages API 를 `fetch` 로 부른다. 키와 모델은 서버의 환경 변수 |
| 자동 검증 | Node 내장 test runner, Docker 의 Postgres | 도입. 새 패키지 없음. `npm test` |

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

Supabase CLI 는 의존성에 넣지 않고 `npx supabase@2.120.0` 으로 실행합니다. 지금은 마이그레이션 파일을 만들 때만 씁니다.

끈 기능은 다음과 같습니다.

- Cache Components 와 React Compiler 는 켜지 않았습니다. 필요한 근거가 생기면 검토합니다.
- `agentRules` 를 껐습니다. 켜 두면 `next dev` 가 `AGENTS.md` 에 Next.js 안내 문단을 자동으로 넣고 지워도 다시 넣습니다. `AGENTS.md` 는 이 저장소의 단일 지침이라 직접 관리합니다.

알려진 경고가 하나 있습니다. `npm audit` 가 `braces` 의 서비스 거부 취약점으로 high 5건을 보고합니다. 모두 `eslint-config-next` 가 끌어오는 개발 도구 경로이고 배포되는 코드에는 들어가지 않습니다. 자동 수정은 `eslint-config-next` 를 14 로 내리는 방식이라 적용하지 않았습니다.

## 서버 방향

MVP에서는 별도 Spring Boot 서버를 두지 않습니다. Next.js와 Supabase를 중심으로 구성하고, 별도 서버가 필요한 근거가 생길 때 설계 결정을 다시 검토합니다.

## AI Provider 방향

초기 공급자를 제품 핵심 영역에 직접 결합하지 않습니다. AI Insight 단계에서 공급자별 구현과 제품 기능 사이에 교체 가능한 경계를 둡니다.

2026-10-10 에 경계를 `src/features/ai-insight/provider/` 에 두고 첫 구현으로 Claude 를 붙였습니다. 제품 쪽은 지킬 것, 자료, 답의 모양을 주고 JSON 을 받는다는 약속만 압니다. 키(`ANTHROPIC_API_KEY`)와 모델(`AI_INSIGHT_MODEL`, 기본값 `claude-sonnet-5-5`)은 서버의 환경 변수로 받고, 키가 없어도 기록 기능은 그대로 동작합니다. 키를 다루는 파일은 `server-only` 로 표시해 브라우저 코드가 불러오면 빌드가 실패하게 했고, 남기는 글에서는 키를 가립니다. 근거는 `docs/adr/0018-ai-provider-boundary-and-claude.md` 에 있습니다.

## 아직 정하지 않은 항목

- 테스트 도구와 테스트 범위
- 상태 관리 방식
- 관측성과 오류 수집 도구

이 항목은 해당 기능을 구현하는 마일스톤에서 필요 근거와 함께 정합니다.
