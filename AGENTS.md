# AGENTS.md

이 파일은 AI Club OS 저장소에서 일하는 에이전트가 따라야 할 단일 관리 지침입니다.

## 프로젝트 목적

AI Club OS는 인공지능 동아리와 스터디 구성원이 학습, 실험, AI Log, 공유, 프로젝트, 발표, 회고를 하나의 흐름으로 수행하도록 돕는 작업 공간입니다.

핵심 제품 메시지는 `Record. Understand. Build.`이며, 제품 흐름은 `Activity -> Knowledge -> Intelligence -> Action`입니다.

## 현재 작업 단계

- 2026-10-08 에 사용자가 v0.1 구현 첫 단계를 승인했다. 범위는 Next.js 뼈대, 디자인 토큰 이식, 로그인 화면이다.
- 2026-10-10 에 사용자가 Supabase 프로젝트와 Google OAuth 설정을 마쳤고, 이어서 Supabase 연결과 Google Login 을 구현했다.
- 2026-10-10 에 사용자가 다음 단계를 승인해 Club 만들기와 내 Club 목록을 구현했다.
- 2026-10-10 에 데이터베이스 적용을 확인한 뒤 Club 개요와 Club 안쪽 화면 틀을 구현했다.
- 2026-10-10 에 사용자가 Session 단계를 승인하고 시각을 한국 시간으로 고정하기로 정했다. Session 목록, 만들기, 수정, 상세를 구현했다.
- 승인된 범위를 넘는 구현은 사용자가 다음 단계를 승인한 뒤에 진행한다.
- 패키지 설치, 외부 서비스 연결, 데이터베이스 변경, 배포 설정을 임의로 진행하지 않는다.
- 기존 파일을 삭제하거나 덮어쓰기 전에 반드시 상태와 사용자 변경 사항을 확인한다.

## 제품 범위

- v0.1: Google Login, Club, Member, Session, Attendance, AI Log
- v0.2: AI Insight
- v0.3: Project
- v0.4: Web Presentation
- AI Log를 핵심 Entity로 취급한다.

## 기본 기술 방향

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL, Auth, Storage
- Vercel
- MVP에서는 별도 Spring Boot 서버를 두지 않는다.
- AI Provider는 교체 가능한 경계 뒤에 둔다.
- Next.js 16 은 이전 버전과 달라진 점이 많다. Next.js 코드를 쓰기 전에 `node_modules/next/dist/docs/` 의 해당 문서를 확인한다.

## 구조 원칙

- 기능 단위 경계를 우선한다.
- `auth`, `club`, `member`, `session`, `attendance`, `ai-log`를 서로 구분한다.
- 화면, 데이터 접근, 외부 서비스 연결이 한 파일에 섞이지 않게 한다.
- 아직 필요하지 않은 기능과 추상화는 미리 구현하지 않는다.
- 중요한 기술 선택은 `docs/adr/`에 기록한다.

## 문서 관리

- 제품 목표와 범위는 `docs/PRD.md`에서 관리한다.
- 검증 가능한 요구 사항은 `docs/REQUIREMENTS.md`에서 관리한다.
- 기능 단계는 `docs/FEATURES.md`에서 관리한다.
- 기술 선택은 `TECH.md`에서 관리한다.
- 전체 구조는 `ARCHITECTURE.md`에서 관리한다.
- 화면과 경험 원칙은 `DESIGN.md`에서 관리한다.
- 데이터 구조는 `docs/DATABASE.md`에서 관리한다.
- `CLAUDE.md`에는 별도 지침을 추가하지 않고 이 파일만 불러오게 유지한다.

## 작업 규칙

- 변경 전 현재 깃 상태를 확인한다.
- 작은 단위로 변경하고 변경 이유를 문서에 남긴다.
- 검증하지 않은 상태를 완료로 표현하지 않는다.
- 비밀 값과 개인 정보는 저장소에 넣지 않는다.
- 데이터베이스 변경은 `supabase/migrations/` 의 SQL 파일로 남긴다. 파일은 `npx supabase migration new <이름>` 으로 만든다.
- 사용자 승인 없이 원격 저장소 생성, 푸시, 배포를 하지 않는다.

## 커밋 규칙

- 작업 브랜치를 따로 만들지 않고 `main` 에 직접 커밋한다. 브랜치는 사용자가 요청할 때만 만든다.
- 커밋 메시지는 한국어로 쓰고 Conventional Commits 를 따른다. type 은 `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style` 등을 쓴다.
- 제목은 `<type>: <한글 요약>` 형식의 한 줄로 쓴다. 72자 이내의 명령형으로 쓰고 마침표를 붙이지 않는다.
- 제목 다음 한 줄을 비우고, 본문은 3~5줄의 목록으로 핵심만 적는다. 긴 설명과 구현 코드는 넣지 않는다.
- 고유명과 기술명(API, Controller, Repository 등)은 영문 그대로 둔다.
- 브레이킹 체인지가 있으면 마지막 줄에 `BREAKING CHANGE: <내용>` 을, 관련 이슈가 있으면 `Refs: <번호 또는 URL>` 을 붙인다.
- 변경이 너무 작거나 뜻이 불분명하면 그대로 커밋하지 말고 더 알맞은 커밋 단위를 제안한다.

```text
feat: 안테나 로그 API에 createdFrom, createdTo 필터 추가

- API 계층 및 Repository 쿼리에 날짜 필터 로직 추가
- Service/Controller에 createdFrom, createdTo 파라미터 반영
- OpenAPI 스펙에 신규 쿼리 파라미터 문서화
- JPA 쿼리 predicate로 날짜 조건 처리 보완
```

